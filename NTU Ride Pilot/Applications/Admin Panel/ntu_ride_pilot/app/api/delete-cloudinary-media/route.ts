import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { publicIds } = await request.json();

    if (!publicIds || !Array.isArray(publicIds)) {
      return NextResponse.json(
        { success: false, error: 'publicIds must be an array' },
        { status: 400 }
      );
    }

    const deleteResults = await Promise.all(
      publicIds.map(id => cloudinary.uploader.destroy(id))
    );

    return NextResponse.json({ success: true, results: deleteResults }, { status: 200 });
  } catch (error: any) {
    console.error('Cloudinary deletion error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
