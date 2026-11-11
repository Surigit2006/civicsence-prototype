import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const issueId = parseInt(id, 10);

    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    const issue = db.prepare(`
      SELECT 
        i.*,
        u.username as username,
        r.username as responder_username
      FROM issues i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN users r ON i.responded_by = r.id
      WHERE i.id = ?
    `).get(issueId);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, issue });
  } catch (error: any) {
    console.error('Error fetching issue:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

