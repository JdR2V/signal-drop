"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

// ── Inner component that uses useSearchParams ──────────────
function ShareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const keyB64 = searchParams.get("key");

  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id || !keyB64) return;
    const url = `${window.location.origin}/d/${id}#${keyB64}`;
    setShareUrl(url);
    setReady(true);
  }, [id, keyB64, router]);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-400 font-mono text-sm animate-pulse">
          generating link...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg p-6 font-mono">
        <div className="mb-6">
          <h1 className="text-green-400 text-xl font-bold">signal.drop</h1>
          <p className="text-neutral-500 text-sm">drop created successfully!</p>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center mb-4">
            <span className="text-green-400 text-2xl">🔒</span>
          </div>
          <h2 className="text-white text-lg font-bold">your drop is ready</h2>
          <p className="text-neutral-400 text-sm text-center mt-2">
            encrypted in your browser.
            <br />
            the server cannot read this message.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">
            Shareable Link
          </label>
          <div
            className="bg-neutral-800 border border-neutral-600 rounded p-3
                          text-green-400 text-xs break-all select-all"
          >
            {shareUrl || "Generating..."}
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white
                     font-bold py-3 px-6 rounded transition-colors text-sm mb-3"
        >
          {copied ? "✓ copied!" : "copy link to clipboard"}
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400
                     font-bold py-3 px-6 rounded transition-colors text-sm"
        >
          create another drop
        </button>

        <p className="text-neutral-600 text-xs text-center mt-4">
          destroys on first read · aes-256-gcm
        </p>
      </div>
    </div>
  );
}

// ── Outer component that wraps with Suspense ───────────────
export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-green-400 font-mono text-sm animate-pulse">
            generating link...
          </p>
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
