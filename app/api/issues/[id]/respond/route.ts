import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const ALLOWED_STATUSES = ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only municipality administrators can respond to civic issues' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const issueId = parseInt(id, 10);
    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status, admin_response } = body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!admin_response || typeof admin_response !== 'string' || admin_response.trim().length === 0) {
      return NextResponse.json(
        { error: 'Official response message cannot be empty' },
        { status: 400 }
      );
    }

    // Verify issue exists
    const issue = db.prepare('SELECT id FROM issues WHERE id = ?').get(issueId);
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    db.prepare(`
      UPDATE issues
      SET 
        status = ?,
        admin_response = ?,
        responded_at = CURRENT_TIMESTAMP,
        responded_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, admin_response.trim(), authUser.id, issueId);

    const updatedIssue = db.prepare(`
      SELECT 
        i.*,
        u.username as username,
        r.username as responder_username
      FROM issues i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN users r ON i.responded_by = r.id
      WHERE i.id = ?
    `).get(issueId);

    return NextResponse.json({
      success: true,
      message: 'Municipality response recorded and citizen notified successfully',
      issue: updatedIssue,
    });
  } catch (error: any) {
    console.error('Error recording admin response:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while saving response' },
      { status: 500 }
    );
  }
}

