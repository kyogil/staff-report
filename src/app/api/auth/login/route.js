import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const client = await pool.connect();
    let user;

    try {
      const result = await client.query('SELECT * FROM pengguna WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }
      user = result.rows[0];
    } finally {
      client.release();
    }

    const isPasswordValid = await bcrypt.compare(password, user.sandi);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // JWT_SECRET should be in your .env.local file
    const jwtSecret = process.env.JWT_SECRET || 'a-very-strong-secret-key-for-development';

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.peran,
        name: user.nama,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return NextResponse.json({ message: 'Login successful' }, { status: 200 });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
