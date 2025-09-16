import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import * as jose from 'jose';

async function getUserFromToken() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return null;

  try {
    const jwtSecret = process.env.JWT_SECRET || 'a-very-strong-secret-key-for-development';
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

// GET /api/divisions - Fetch all divisions
export async function GET() {
  const user = await getUserFromToken();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM divisi ORDER BY nama ASC');
    client.release();
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('GET /api/divisions error:', error);
    return NextResponse.json({ message: 'Failed to fetch divisions' }, { status: 500 });
  }
}
