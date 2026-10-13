import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <div className="narrow">
        <p className="kicker">Missing page</p>
        <h1>That topic is not in the syllabus list.</h1>
        <Link className="btn primary" href="/">
          Back to topics
        </Link>
      </div>
    </div>
  );
}
