import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path from the dynamic route segments
    const filePath = params.path.join('/');
    
    // Get the backend media URL (remove /api suffix if present)
    const mediaBaseUrl = BASE_URL.replace(/\/api\/?$/, '');
    const backendUrl = `${mediaBaseUrl}/media/${filePath}`;
    
    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      headers: {
        // Forward any relevant headers
        'ngrok-skip-browser-warning': 'true',
        // Forward user agent if needed
        'User-Agent': request.headers.get('User-Agent') || 'NextJS-Proxy',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch media from backend: ${response.status} ${response.statusText}`);
      return new NextResponse('Media not found', { status: 404 });
    }

    // Get the content type from the backend response
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    
    // Stream the response from backend to client
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year since files don't change
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Error proxying media request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
