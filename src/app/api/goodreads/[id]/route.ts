import { NextRequest, NextResponse } from 'next/server';
import { scrapeGoodreads } from '~/app/_utils/scrapeGoodReads';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'GoodReads ID is required' },
        { status: 400 }
      );
    }

    const bookData = await scrapeGoodreads(id);
    return NextResponse.json(bookData);
  } catch (error) {
    console.error('Error in GoodReads API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book data' },
      { status: 500 }
    );
  }
}
