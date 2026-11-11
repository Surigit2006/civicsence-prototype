import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    // Query user
    const userRow = db.prepare('SELECT id, username, password_hash, role FROM users WHERE username = ? COLLATE NOCASE').get(trimmedUsername) as {
      id: number;
      username: string;
      password_hash: string;
      role: 'citizen' | 'admin';
    } | undefined;

    if (!userRow) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const passwordValid = bcrypt.compareSync(password, userRow.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = {
      id: userRow.id,
      username: userRow.username,
      role: userRow.role,
    };
    const token = signToken(user);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user,
      token,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during login' },
      { status: 500 }
    );
  }
}

