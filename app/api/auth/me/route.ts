import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const userRow = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(authUser.id) as {
    id: number;
    username: string;
    role: 'citizen' | 'admin';
    created_at: string;
  } | undefined;

  if (!userRow) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: userRow.id,
      username: userRow.username,
      role: userRow.role,
      createdAt: userRow.created_at,
    },
  });
}

