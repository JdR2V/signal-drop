"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { importKeyFromBase64, decryptMessage } from "@/lib/crypto";
import CopyButton from "@/components/CopyButton";

type State = "loading" | "warning" | "revealed" | "destroyed" | "error";

export default function ReadPage() {
  const params = useParams();
  const id = params.id as string;

  const [state, setState] = useState<State>("loading");
  const [plaintext, setPlaintext] = useState("");
  const [hint, setHint] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchAndDecrypt() {
      try {
        // Extract the key from the URL fragment
        const fragment = window.location.hash.slice(1); // remove the '#'
        if (!fragment) {
          setErrorMsg(
            "No decryption key found in URL. The link may be incomplete.",
          );
          setState("error");
          return;
        }

        // Fetch the encrypted payload from the server
        const response = await fetch(`/api/drops/${id}`);
        if (!response.ok) {
          const data = await response.json();
          setErrorMsg(
            data.error || "This drop does not exist or has already been read.",
          );
          setState("error");
          return;
        }

        const {
          ciphertext,
          iv,
          hint: dropHint,
          expires_at,
        } = await response.json();

        setHint(dropHint || "");
        setExpiresAt(expires_at);

        // Import the key and decrypt — all in the browser
        const key = await importKeyFromBase64(fragment);
        const text = await decryptMessage({ ciphertext, iv }, key);
        setPlaintext(text);

        setState("warning"); // Show the self-destruct warning before revealing
      } catch (e) {
        console.error(e);
        setErrorMsg(
          "Decryption failed. The key may be invalid or the message tampered with.",
        );
        setState("error");
      }
    }

    fetchAndDecrypt();
  }, [id]);

  async function handleReveal() {
    setState("revealed");
  }

  async function handleDestroy() {
    await fetch(`/api/drops/${id}`, { method: "DELETE" });
    setPlaintext("");
    setState("destroyed");
  }

  // ── Render states ──────────────────────────────────────────

  if (state === "loading") {
    return (
      <Screen>
        <p className="text-green-400 text-sm animate-pulse">decrypting...</p>
      </Screen>
    );
  }

  if (state === "error") {
    return (
      <Screen>
        <div className="bg-red-950 border border-red-700 rounded p-4 text-sm text-red-300">
          <p className="font-bold mb-1">⚠ drop unavailable</p>
          <p>{errorMsg}</p>
        </div>
      </Screen>
    );
  }

  if (state === "warning") {
    return (
      <Screen>
        {/* Self-destruct warning banner */}
        <div className="bg-amber-950 border border-amber-600 rounded p-4 mb-4 text-sm">
          <p className="text-amber-400 font-bold">
            ⚠ this message will self-destruct
          </p>
          <p className="text-amber-200 mt-1 text-xs">
            once you click read, this message is permanently deleted from the
            server and cannot be recovered. there is no second chance.
          </p>
        </div>

        {hint && (
          <div className="mb-4 text-xs text-neutral-500">
            <span className="text-neutral-600">hint: </span>
            {hint}
          </div>
        )}

        {expiresAt && (
          <div className="mb-4 text-xs text-neutral-600">
            expires in <ExpiryCountdown expiresAt={expiresAt} />
          </div>
        )}

        <button
          onClick={handleReveal}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white
                     font-bold py-3 rounded text-sm mb-3 transition-colors"
        >
          🔥 Show message
        </button>

        <button
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400
                           py-3 rounded text-sm transition-colors"
        >
          not ready — come back later
        </button>
      </Screen>
    );
  }

  if (state === "revealed") {
    return (
      <Screen>
        <div className="mb-4">
          <div
            className="bg-neutral-800 border border-neutral-600 rounded p-4
                          text-green-300 text-sm leading-relaxed whitespace-pre-wrap"
          >
            {plaintext}
          </div>
        </div>

        {/* Copy after reveal feature */}
        <CopyButton text={plaintext} />

        <button
          onClick={handleDestroy}
          className="w-full mt-3 bg-red-700 hover:bg-red-600 text-white
                     font-bold py-3 rounded text-sm transition-colors"
        >
          🔥 destroy permanently
        </button>
      </Screen>
    );
  }

  if (state === "destroyed") {
    return (
      <Screen>
        <div className="text-center py-8">
          <p className="text-4xl mb-4">💀</p>
          <p className="text-neutral-400 text-sm">message destroyed.</p>
          <p className="text-neutral-600 text-xs mt-2">it never existed.</p>
        </div>
      </Screen>
    );
  }

  return null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg p-6 font-mono">
        <div className="mb-6">
          <h1 className="text-green-400 text-xl font-bold">signal.drop</h1>
          <p className="text-neutral-500 text-sm">
            // incoming drop — read carefully
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const expires = new Date(expiresAt);
  const now = new Date();
  const diff = expires.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return (
    <span className="text-amber-500">
      {hours}h {minutes}m left
    </span>
  );
}
