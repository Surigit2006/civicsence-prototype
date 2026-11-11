import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const issues = db.prepare(`
      SELECT 
        i.*,
        u.username as username,
        r.username as responder_username
      FROM issues i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN users r ON i.responded_by = r.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `).all(authUser.id);

    return NextResponse.json({
      success: true,
      issues,
    });
  } catch (error: any) {
    console.error('Error fetching citizen issues:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

