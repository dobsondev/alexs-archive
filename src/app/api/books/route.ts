import { NextResponse } from 'next/server';
import { db } from '~/server/db';

export async function GET() {
  try {
    const books = await db.query.books.findMany();
    return NextResponse.json(books);
  } catch (error) {
    console.error('Failed to fetch books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}