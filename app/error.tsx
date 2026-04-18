"use client";
import { useEffect } from "react";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html lang="en"><body className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 20 20" fill="none" className="w-7 h-7"><path d="M10 6v4M10 14v.5" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="10" r="8" stroke="#dc2626" strokeWidth="1.5"/></svg>
        </div>
        <h1 className="font-display text-xl text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-[13px] text-gray-400 mb-6">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="btn-green">Try again</button>
      </div>
    </body></html>
  );
}
