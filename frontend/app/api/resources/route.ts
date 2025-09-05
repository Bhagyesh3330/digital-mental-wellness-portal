import { NextResponse } from 'next/server';
import { Resource } from '@/lib/models/Resource';

// GET /api/resources - Fetch all resources
export async function GET() {
  try {
    const resources = await Resource.findAll();
    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST /api/resources - Create a new resource
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, type, category, url, author, tags, duration } = body;

    // Validate required fields
    if (!title || !description || !type || !url || !author) {
      return NextResponse.json(
        { error: 'Title, description, type, URL, and author are required' },
        { status: 400 }
      );
    }

    // Validate resource type
    const validTypes = ['article', 'video', 'book', 'worksheet', 'reference'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      );
    }

    const result = await Resource.create({
      title: title.trim(),
      description: description.trim(),
      type,
      category: category?.trim() || 'general',
      url: url.trim(),
      author: author.trim(),
      tags: Array.isArray(tags) ? tags : [],
      duration: duration?.trim() || undefined,
    });

    if (!result.success || !result.resource) {
      return NextResponse.json(
        { error: result.error || 'Failed to create resource' },
        { status: 400 }
      );
    }

    return NextResponse.json({ resource: result.resource }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
