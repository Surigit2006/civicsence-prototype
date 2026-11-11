import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'You must be logged in to report a civic issue' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      category,
      description,
      photo_url,
      latitude,
      longitude,
      street_name,
      landmark,
    } = body;

    // Strict validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Issue title/summary is required' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category is required (e.g., Roads & Potholes, Waste Management, Street Lights)' },
        { status: 400 }
      );
    }

    // Must post at least 1 photo!
    if (!photo_url || typeof photo_url !== 'string' || photo_url.trim().length === 0) {
      return NextResponse.json(
        { error: 'At least 1 photo of the civic issue is required' },
        { status: 400 }
      );
    }

    // Must provide map location (lat & lng)
    if (
      latitude === undefined ||
      longitude === undefined ||
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return NextResponse.json(
        { error: 'Location coordinates on the map are required' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude coordinates' },
        { status: 400 }
      );
    }

    // Must provide street name
    if (!street_name || typeof street_name !== 'string' || street_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Street name is required' },
        { status: 400 }
      );
    }

    // Must provide landmark
    if (!landmark || typeof landmark !== 'string' || landmark.trim().length === 0) {
      return NextResponse.json(
        { error: 'Landmark is required' },
        { status: 400 }
      );
    }

    const insertResult = db.prepare(`
      INSERT INTO issues (
        user_id,
        title,
        category,
        description,
        photo_url,
        latitude,
        longitude,
        street_name,
        landmark,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `).run(
      authUser.id,
      title.trim(),
      category.trim(),
      (description || '').trim(),
      photo_url.trim(),
      latitude,
      longitude,
      street_name.trim(),
      landmark.trim()
    );

    const issueId = Number(insertResult.lastInsertRowid);
    const newIssue = db.prepare(`
      SELECT 
        i.*,
        u.username as username
      FROM issues i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `).get(issueId);

    return NextResponse.json(
      {
        success: true,
        message: 'Civic issue reported successfully',
        issue: newIssue,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error reporting issue:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while reporting issue' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let query = `
      SELECT 
        i.*,
        u.username as username,
        r.username as responder_username
      FROM issues i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN users r ON i.responded_by = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'All') {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (category && category !== 'All') {
      query += ` AND i.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY i.created_at DESC`;

    const issues = db.prepare(query).all(...params);

    return NextResponse.json({
      success: true,
      issues,
    });
  } catch (error: any) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while fetching issues' },
      { status: 500 }
    );
  }
}

