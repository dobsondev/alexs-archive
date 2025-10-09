/**
 * Script to export all book data from production database
 * Run with: npx tsx scripts/export-books.ts > books-backup.sql
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import postgres from 'postgres';

async function exportBooks() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  try {
    const client = postgres(process.env.DATABASE_URL);

    // Get all books
    const books = await client`
      SELECT
        id, title, series, series_num, author, page_count,
        published_date, image_url, good_reads_url, uploadthing_url,
        created_at, updated_at
      FROM "alexs-archive_book"
      ORDER BY id
    `;

    // Generate INSERT statements with created_by set to NULL
    console.log('-- Book data export');
    console.log('-- Generated:', new Date().toISOString());
    console.log('');

    for (const book of books) {
      const values = [
        book.id,
        book.title ? `'${book.title.replace(/'/g, "''")}'` : 'NULL',
        book.series ? `'${book.series.replace(/'/g, "''")}'` : 'NULL',
        book.series_num ?? 'NULL',
        book.author ? `'${book.author.replace(/'/g, "''")}'` : 'NULL',
        book.page_count,
        `'${book.published_date}'`,
        `'${book.image_url}'`,
        `'${book.good_reads_url}'`,
        `'${book.uploadthing_url}'`,
        'NULL', // created_by
        `'${book.created_at.toISOString()}'`,
        book.updated_at ? `'${book.updated_at.toISOString()}'` : 'NULL',
      ];

      console.log(
        `INSERT INTO "alexs-archive_book" (id, title, series, series_num, author, page_count, published_date, image_url, good_reads_url, uploadthing_url, created_by, created_at, updated_at) VALUES (${values.join(', ')});`
      );
    }

    console.log('');
    console.log(`-- Total books exported: ${books.length}`);

    await client.end();
  } catch (error) {
    console.error('Failed to export books:', error);
    process.exit(1);
  }
}

exportBooks();
