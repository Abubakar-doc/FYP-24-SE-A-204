import { adminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    try {
      await adminAuth.getUserByEmail(email);
      // If found, email exists
      return NextResponse.json({ exists: true });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Email does not exist
        return NextResponse.json({ exists: false });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error checking email existence:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
