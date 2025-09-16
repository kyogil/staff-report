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

// PUT /api/tasks/[id] - Update a specific task for the logged-in user
export async function PUT(req, { params }) {
  const user = await getUserFromToken();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const taskId = params.id;

  try {
    const { nama_task, deskripsi, tanggal_mulai, tanggal_selesai, hasil } = await req.json();

    if (!nama_task || !deskripsi || !tanggal_mulai) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const query = `
      UPDATE tugas
      SET
        nama_task = $1,
        deskripsi = $2,
        tanggal_mulai = $3,
        tanggal_selesai = $4,
        hasil = $5,
        diperbarui_pada = CURRENT_TIMESTAMP
      WHERE id = $6 AND pengguna_id = $7
      RETURNING *;
    `;
    const values = [
      nama_task,
      deskripsi,
      tanggal_mulai,
      tanggal_selesai || null,
      hasil || null,
      taskId,
      user.userId
    ];

    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Task not found or you do not have permission to edit it' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error(`PUT /api/tasks/${taskId} error:`, error);
    return NextResponse.json({ message: 'Failed to update task' }, { status: 500 });
  }
}
