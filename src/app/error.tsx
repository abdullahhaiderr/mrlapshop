"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-page"><div><span className="eyebrow">SOMETHING WENT WRONG</span><h1>Let's try that again.</h1><p>The page could not be loaded. Please try again.</p><button className="button button-primary" onClick={() => reset()}>Try again</button></div></main>;
}
