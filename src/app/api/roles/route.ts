import { NextRequest, NextResponse } from 'next/server';

// GET /api/roles - Get available user roles
export async function GET(request: NextRequest) {
  try {
    // Return the available roles from the UserRole enum
    const roles = [
      { id: 'USER', name: 'User' },
      { id: 'EDITOR', name: 'Editor' },
      { id: 'PUBLISHER', name: 'Publisher' },
      { id: 'ADMIN', name: 'Admin' },
    ];

    return NextResponse.json({
      success: true,
      roles: roles,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 