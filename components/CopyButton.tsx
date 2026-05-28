"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

/**
 * A button that copies `text` to the clipboard.
 * Shows a confirmation flash when successfully copied.
 * The button is deliberately styled differently from the Destroy button
 * to avoid accidental clicks on the wrong action.
 */
export default function CopyButton({ text }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      // Fallback for browsers where clipboard API needs user gesture in certain contexts
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        document.execCommand("copy");
        setStatus("copied");
        setTimeout(() => setStatus("idle"), 2500);
      } catch {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2500);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`w-full font-bold py-3 rounded text-sm transition-all duration-200
        ${
          status === "copied"
            ? "bg-green-700 border border-green-500 text-green-200"
            : status === "error"
              ? "bg-red-900 border border-red-600 text-red-300"
              : "bg-neutral-700 hover:bg-neutral-600 border border-neutral-500 text-neutral-200"
        }`}
    >
      {status === "copied"
        ? "✓ copied to clipboard"
        : status === "error"
          ? "copy failed — select manually"
          : "⎘ copy message"}
    </button>
  );
}
