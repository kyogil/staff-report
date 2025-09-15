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
    console.error('Failed to verify token in API route', error);
    return null;
  }
}

// GET /api/tasks - Fetch tasks for the logged-in user
export async function GET(req) {
  const user = await getUserFromToken();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // 'pending', 'completed', or 'all'

  let query = 'SELECT * FROM tugas WHERE pengguna_id = $1';
  const queryParams = [user.userId];

  if (status === 'pending') {
    query += ' AND tanggal_selesai IS NULL';
  } else if (status === 'completed') {
    query += ' AND tanggal_selesai IS NOT NULL';
  }

  query += ' ORDER BY dibuat_pada DESC';

  try {
    const client = await pool.connect();
    const result = await client.query(query, queryParams);
    client.release();
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ message: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(req) {
  const user = await getUserFromToken();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { nama_task, deskripsi, tanggal_mulai, tanggal_selesai, hasil } = await req.json();

    if (!nama_task || !deskripsi || !tanggal_mulai) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const query = `
      INSERT INTO tugas (pengguna_id, nama_task, deskripsi, tanggal_mulai, tanggal_selesai, hasil, diperbarui_pada)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const values = [user.userId, nama_task, deskripsi, tanggal_mulai, tanggal_selesai || null, hasil || null];

    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ message: 'Failed to create task' }, { status: 500 });
  }
}
