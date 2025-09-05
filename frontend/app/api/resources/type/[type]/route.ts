import { NextResponse } from 'next/server';
import { Resource } from '@/lib/models/Resource';

// GET /api/resources/type/[type] - Fetch resources by type
export async function GET(request: Request, { params }: { params: { type: string } }) {
  try {
    const { type } = params;

    // Validate resource type
    const validTypes = ['article', 'video', 'book', 'worksheet', 'reference'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      );
    }

    const resources = await Resource.findByType(type);
    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching resources by type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources by type' },
      { status: 500 }
    );
  }
}
