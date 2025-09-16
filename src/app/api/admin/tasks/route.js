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

// GET /api/admin/tasks - Fetch all tasks for the admin dashboard
export async function GET(req) {
  const user = await getUserFromToken();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const divisionId = searchParams.get('divisionId');
  const userId = searchParams.get('userId');
  const month = searchParams.get('month'); // YYYY-MM format

  let query = `
    SELECT
      t.id,
      t.nama_task,
      t.deskripsi,
      t.hasil,
      t.tanggal_mulai,
      t.tanggal_selesai,
      p.nama as pengguna_nama,
      d.nama as divisi_nama
    FROM tugas t
    JOIN pengguna p ON t.pengguna_id = p.id
    JOIN divisi d ON p.divisi_id = d.id
  `;

  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  if (userId && userId !== 'all') {
    whereClauses.push(`t.pengguna_id = $${paramIndex}`);
    queryParams.push(userId);
    paramIndex++;
  } else if (divisionId && divisionId !== 'all') {
    whereClauses.push(`p.divisi_id = $${paramIndex}`);
    queryParams.push(divisionId);
    paramIndex++;
  }

  if (month && month !== 'all') {
    const [year, monthNum] = month.split('-');
    whereClauses.push(`EXTRACT(YEAR FROM t.tanggal_mulai) = $${paramIndex}`);
    queryParams.push(year);
    paramIndex++;
    whereClauses.push(`EXTRACT(MONTH FROM t.tanggal_mulai) = $${paramIndex}`);
    queryParams.push(monthNum);
    paramIndex++;
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY t.dibuat_pada DESC';

  try {
    const client = await pool.connect();
    const result = await client.query(query, queryParams);
    client.release();
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/tasks error:', error);
    return NextResponse.json({ message: 'Failed to fetch tasks' }, { status: 500 });
  }
}
