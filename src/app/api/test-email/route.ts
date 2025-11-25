import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, dealerName, activationToken } = body;

    if (!email || !dealerName || !activationToken) {
      return NextResponse.json(
        { error: 'Missing required fields: email, dealerName, activationToken' },
        { status: 400 }
      );
    }

    // Send test welcome email
    const result = await sendWelcomeEmail(email, {
      dealer_name: dealerName,
      activation_token: activationToken,
      free_listings: 100
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result.id,
      recipient: email
    });
  } catch (error: unknown) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint для быстрого теста с дефолтными значениями
export async function GET() {
  try {
    const testEmail = 'artur.paehn@gmail.com'; // Твой email для теста
    const testDealerName = 'Test Motors LLC';
    const testToken = 'test_' + Math.random().toString(36).substring(7);

    const result = await sendWelcomeEmail(testEmail, {
      dealer_name: testDealerName,
      activation_token: testToken,
      free_listings: 100
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result.id,
      recipient: testEmail,
      activationUrl: `https://carlynx.us/dealers/activate/${testToken}`
    });
  } catch (error: unknown) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
