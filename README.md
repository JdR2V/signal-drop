# signal.drop

> End-to-end encrypted messages that self-destruct on read.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?style=flat-square&logo=postgresql&logoColor=white)
![AES-256-GCM](https://img.shields.io/badge/Encryption-AES--256--GCM-00ff50?style=flat-square)
![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)

**[Live Demo →](https://signal-drop.vercel.app)**

---

## What it does

Signal Drop lets you send a secret message to anyone via a one-time link. The message encrypts in your browser before anything touches the server, the recipient reads it, and it's gone — permanently deleted from the database. Opening the link again returns a 404.

No accounts. No logs. No second chances.

---

## How it works

The core idea is a **zero-knowledge architecture** — the server stores encrypted data but has no way to read it.

Here's the flow:

1. **Sender** writes a message and picks an expiry window (1h, 6h, 24h, 7 days)
2. A fresh **AES-256-GCM key** is generated in the browser — it never leaves the sender's device in readable form
3. The message is encrypted client-side and only the **ciphertext + IV** are sent to the server
4. The server stores the encrypted blob and returns a drop ID
5. The shareable link is built as `/d/{id}#{encryption_key}` — the `#` fragment is the key piece: browsers never send URL fragments to servers, so the key travels only between sender and recipient
6. The recipient opens the link, their browser extracts the key from the fragment, fetches the ciphertext, and **decrypts locally**
7. On destroy, the row is deleted from the database permanently

Even if the database were compromised, an attacker would find only encrypted blobs with no keys.

```
SENDER                        SERVER                      RECIPIENT
──────                        ──────                      ─────────
Generate AES-256 key
Encrypt message in browser
POST {ciphertext, iv}   ───────────────────────→   Store encrypted blob
                        ←───────────────────────   Return drop_id
Build URL: /d/{id}#{key}
Share via Signal/email
                                                    GET /d/{id}
                                                    ← ciphertext + iv
                                                    Decrypt with #key locally
                                                    Read message
                                                    DELETE /d/{id} ──→ Gone forever
```

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full stack in one repo, API routes + React |
| Database | PostgreSQL | Reliable, simple schema, easy expiry queries |
| Encryption | Web Crypto API (built-in) | Native browser crypto, no third-party deps |
| Algorithm | AES-256-GCM | Authenticated encryption — detects tampering |
| Styling | Tailwind CSS | Utility-first, fast to iterate |
| Font | JetBrains Mono | Monospace terminal aesthetic |
| Deployment | Vercel + Neon | Zero-config, generous free tier |

---

## Security model

- **Zero knowledge**: The server never sees plaintext or encryption keys
- **URL fragment safety**: The `#` part of a URL is processed by the browser only — it is never included in HTTP requests
- **AES-256-GCM**: Provides both confidentiality (encryption) and authenticity (built-in MAC). Tampered ciphertext fails decryption loudly
- **Fresh IV per message**: A random 12-byte initialization vector is generated for every encryption, ensuring identical messages produce different ciphertext
- **One-read enforcement**: The `read_at` timestamp is set the moment a drop is fetched. A second request returns 404 even if the recipient hasn't clicked Destroy yet
- **Expiry**: Drops have a server-side expiry enforced at query time — expired drops are treated as nonexistent regardless of database state

---

## Running locally

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/signal-drop.git
cd signal-drop

# Install dependencies
npm install

# Create your environment file
echo DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/signal_drop > .env.local

# Create the database and schema
psql -U postgres -c "CREATE DATABASE signal_drop;"
psql -U postgres -d signal_drop -c "
CREATE TABLE drops (
  id          VARCHAR(12) PRIMARY KEY,
  ciphertext  TEXT NOT NULL,
  iv          TEXT NOT NULL,
  hint        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  read_at     TIMESTAMPTZ
);
CREATE INDEX idx_drops_expires_at ON drops (expires_at);"

# Start the dev server
npm run dev
```

Visit `http://localhost:3000`.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Screen 1 — Compose & encrypt
│   ├── share/page.tsx        # Screen 2 — Share the link
│   ├── d/[id]/page.tsx       # Screen 3 — Read & destroy
│   └── api/drops/            # REST API (create, fetch, delete)
├── components/
│   ├── HackerBackground.tsx  # Animated canvas grid background
│   └── CopyButton.tsx        # Copy-after-reveal with fallback
└── lib/
    ├── crypto.ts             # Web Crypto API helpers
    └── db.ts                 # PostgreSQL connection pool
```

---

## What I learned building this

This project pushed me to think about security from first principles rather than just reaching for an auth library. The URL fragment trick was the most interesting part — it's a browser behavior that's been there forever, but using it deliberately as a key transport mechanism felt clever. Understanding *why* AES-GCM needs a fresh IV every time, and what "authenticated encryption" actually means in practice, was a genuinely useful rabbit hole.

On the infrastructure side, managing the one-read enforcement logic across a distributed system (what happens if the browser closes mid-read?) was a good exercise in thinking about edge cases.

---

## License

MIT — use it, learn from it, build on it.
