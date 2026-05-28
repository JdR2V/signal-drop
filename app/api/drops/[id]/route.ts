import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET — Fetch the encrypted payload (no key, just ciphertext + iv)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // ← Promise type
) {
  const { id } = await params; // ← await it

  try {
    const result = await pool.query(
      `SELECT ciphertext, iv, hint, expires_at
       FROM drops
       WHERE id = $1
         AND expires_at > NOW()
         AND read_at IS NULL`,
      [id], // ← use id directly
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Drop not found, expired, or already read." },
        { status: 404 },
      );
    }

    await pool.query(`UPDATE drops SET read_at = NOW() WHERE id = $1`, [id]);

    const { ciphertext, iv, hint, expires_at } = result.rows[0];
    return NextResponse.json({ ciphertext, iv, hint, expires_at });
  } catch (error) {
    console.error("Error fetching drop:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE — Permanently destroy the drop
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // ← Promise type
) {
  const { id } = await params; // ← await it

  try {
    const result = await pool.query(
      `DELETE FROM drops WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Drop not found." }, { status: 404 });
    }

    return NextResponse.json({ destroyed: true });
  } catch (error) {
    console.error("Error deleting drop:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
