import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// GET /api/auth/session - Get current user session from token
export async function GET() {
  const token = cookies().get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'a-very-strong-secret-key-for-development';
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(token, secret);

    // Return the user data from the token payload
    return NextResponse.json({ user: payload }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}
