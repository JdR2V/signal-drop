import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// Maps the expiry option the user picks to an actual SQL interval
const EXPIRY_MAP: Record<string, string> = {
  "1h": "1 hour",
  "6h": "6 hours",
  "24h": "24 hours",
  "7d": "7 days",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ciphertext, iv, hint, expiry } = body;

    // Validate required fields
    if (!ciphertext || !iv || !expiry) {
      return NextResponse.json(
        { error: "Missing required fields: ciphertext, iv, expiry" },
        { status: 400 },
      );
    }

    const interval = EXPIRY_MAP[expiry];
    if (!interval) {
      return NextResponse.json(
        { error: "Invalid expiry. Use: 1h, 6h, 24h, 7d" },
        { status: 400 },
      );
    }

    // Generate a short, URL-friendly ID
    // We take the first 8 chars of a UUID (still 4 billion possibilities — unguessable)
    const id = uuidv4().replace(/-/g, "").substring(0, 8);

    await pool.query(
      `INSERT INTO drops (id, ciphertext, iv, hint, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + $5::interval)`,
      [id, ciphertext, iv, hint || null, interval],
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Error creating drop:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
