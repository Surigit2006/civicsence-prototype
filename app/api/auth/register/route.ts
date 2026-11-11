import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 3) {
      return NextResponse.json(
        { error: 'Password must be at least 3 characters long' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(trimmedUsername);
    if (existing) {
      return NextResponse.json(
        { error: 'Username is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, 'citizen')
    `).run(trimmedUsername, passwordHash);

    const userId = Number(result.lastInsertRowid);
    const user = { id: userId, username: trimmedUsername, role: 'citizen' as const };
    const token = signToken(user);

    const response = NextResponse.json({
      success: true,
      message: 'Citizen account created successfully',
      user,
      token,
    }, { status: 201 });

    // Set HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}

