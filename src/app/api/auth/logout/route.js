import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the authentication cookie
    cookies().set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: -1, // Expire the cookie immediately
      path: '/',
    });

    return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
