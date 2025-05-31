import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
import { writeBatch, doc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { announcementIds } = await request.json();

    if (!announcementIds || !Array.isArray(announcementIds)) {
      return NextResponse.json(
        { success: false, error: 'announcementIds must be an array' },
        { status: 400 }
      );
    }

    const batch = writeBatch(firestore);

    announcementIds.forEach((id: string) => {
      batch.delete(doc(firestore, 'announcements', id));
    });

    await batch.commit();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Firestore batch deletion error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
