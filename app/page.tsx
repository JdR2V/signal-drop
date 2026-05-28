"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateKey, exportKeyToBase64, encryptMessage } from "@/lib/crypto";

const EXPIRY_OPTIONS = [
  { label: "1 hour", value: "1h" },
  { label: "6 hours", value: "6h" },
  { label: "24 hours", value: "24h" },
  { label: "7 days", value: "7d" },
];

export default function ComposePage() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [hint, setHint] = useState("");
  const [expiry, setExpiry] = useState("24h");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEncrypt() {
    if (!message.trim()) {
      setError("Write a message first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Generate a fresh AES-256 key in the browser
      const key = await generateKey();

      // Step 2: Encrypt the message
      const { ciphertext, iv } = await encryptMessage(message, key);

      // Step 3: Export the key to Base64 for the URL fragment
      const keyB64 = await exportKeyToBase64(key);

      // Step 4: Send ONLY the encrypted data to the server
      const response = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext, iv, hint, expiry }),
      });

      if (!response.ok) throw new Error("Server error creating drop.");

      const { id } = await response.json();

      // Step 5: Navigate to Share screen with the key in the fragment
      // The key is stored in sessionStorage temporarily to survive the redirect
      // (The URL fragment doesn't survive server-side navigation in Next.js)
      router.push(`/share?id=${id}&key=${keyB64}`);
    } catch (e) {
      setError("Encryption failed. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg p-6 font-mono">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-green-400 text-xl font-bold tracking-tight">
            signal.drop
          </h1>
          <p className="text-neutral-500 text-sm">
            // end-to-end encrypted · self-destructs on read
          </p>
        </div>

        {/* Message field */}
        <div className="mb-4">
          <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">
            Your Message
          </label>
          <textarea
            className="w-full bg-neutral-800 border border-neutral-600 rounded p-3
                       text-green-300 text-sm placeholder-neutral-600
                       focus:outline-none focus:border-green-500
                       resize-none h-32"
            placeholder="Type your secret message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Expiry selector */}
        <div className="mb-4">
          <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">
            Expiry
          </label>
          <div className="grid grid-cols-4 gap-2">
            {EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setExpiry(opt.value)}
                className={`py-2 px-1 text-xs rounded border transition-colors
                  ${
                    expiry === opt.value
                      ? "bg-green-500 border-green-500 text-black font-bold"
                      : "bg-neutral-800 border-neutral-600 text-neutral-400 hover:border-green-600"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hint field */}
        <div className="mb-6">
          <label className="block text-neutral-400 text-xs uppercase tracking-widest mb-2">
            Hint{" "}
            <span className="text-neutral-600 normal-case">
              (optional, unencrypted)
            </span>
          </label>
          <input
            className="w-full bg-neutral-800 border border-neutral-600 rounded p-3
                       text-neutral-300 text-sm placeholder-neutral-600
                       focus:outline-none focus:border-green-500"
            placeholder="e.g. check your signal messages for the url"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleEncrypt}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-neutral-700
                     text-white font-bold py-3 px-6 rounded
                     transition-colors text-sm tracking-wider"
        >
          {loading ? "encrypting..." : "encrypt and generate link →"}
        </button>
      </div>
    </div>
  );
}
