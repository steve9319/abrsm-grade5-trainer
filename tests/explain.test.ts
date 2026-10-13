import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EXPLANATION_UNAVAILABLE_TEXT } from "@/lib/copy";
import {
  DEFAULT_ANTHROPIC_MODEL,
  parseExplainPayload,
  requestExplanation,
  type ExplainInput,
} from "@/lib/explain";

const sample: ExplainInput = {
  topic: "intervals",
  question: "The interval from C up to G is a:",
  correctAnswer: "A",
  options: [
    { id: "A", text: "Perfect 5th" },
    { id: "B", text: "Perfect 4th" },
  ],
};

describe("explanation fallback", () => {
  it("returns explanation unavailable and does not call the network when no key is set", async () => {
    let called = 0;
    const result = await requestExplanation(sample, {}, async () => {
      called += 1;
      return new Response("should not run");
    });
    assert.equal(called, 0);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { available: false, message: EXPLANATION_UNAVAILABLE_TEXT });
  });

  it("uses claude-sonnet-5-5 unless ANTHROPIC_MODEL is set", async () => {
    const seen: string[] = [];
    const fetchImpl: typeof fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { model: string };
      seen.push(body.model);
      return Response.json({
        content: [
          {
            type: "text",
            text: '```json\n{"explanation":"C up to G is a perfect 5th.","optionExplanations":{"A":"Right.","B":"A 4th would reach F."}}\n```',
          },
        ],
      });
    };

    const generated = await requestExplanation(sample, { ANTHROPIC_API_KEY: "test-key" }, fetchImpl);
    assert.equal(seen[0], DEFAULT_ANTHROPIC_MODEL);
    assert.equal(DEFAULT_ANTHROPIC_MODEL, "claude-sonnet-5-5");
    assert.equal(generated.body.available, true);
    if (generated.body.available) {
      assert.match(generated.body.explanation, /perfect 5th/);
      assert.match(generated.body.optionExplanations.B, /4th/);
    }

    await requestExplanation(
      sample,
      { ANTHROPIC_API_KEY: "test-key", ANTHROPIC_MODEL: "claude-sonnet-custom" },
      fetchImpl,
    );
    assert.equal(seen[1], "claude-sonnet-custom");
  });

  it("hides API failures behind explanation unavailable", async () => {
    const result = await requestExplanation(sample, { ANTHROPIC_API_KEY: "test-key" }, async () => {
      return new Response("nope", { status: 500 });
    });
    assert.equal(result.body.available, false);
    if (!result.body.available) assert.equal(result.body.message, EXPLANATION_UNAVAILABLE_TEXT);
  });

  it("parses a fenced JSON explanation", () => {
    const parsed = parseExplainPayload('Sure\n```json\n{"explanation":"Because.","optionExplanations":{"A":"Yes"}}\n```');
    assert.equal(parsed?.explanation, "Because.");
    assert.equal(parsed?.optionExplanations.A, "Yes");
  });
});
