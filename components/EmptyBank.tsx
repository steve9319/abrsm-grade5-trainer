import { NO_QUESTIONS_HINT, NO_QUESTIONS_LOADED } from "@/lib/copy";

export function EmptyBank({ detail = NO_QUESTIONS_HINT }: { detail?: string }) {
  return (
    <div className="card empty-bank">
      <h2>{NO_QUESTIONS_LOADED}</h2>
      <p>{detail}</p>
    </div>
  );
}
