import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  return NextResponse.json({ 
    message: 'Test endpoint',
    receivedAuth: authHeader,
    allHeaders: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  });
}
