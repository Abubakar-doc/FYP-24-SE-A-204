// app/api/sendNotification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminMessaging }          from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const { title, message } = await req.json()
  if (!title || !message) {
    return NextResponse.json({ error: 'Missing title or message' }, { status: 400 })
  }

  try {
    await adminMessaging.send({
      topic: 'announcements',
      notification: { title, body: message },
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('FCM send error', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
