/**
 * Script to import book data from backup SQL file
 * Run with: npx tsx scripts/import-books.ts books-backup.sql
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import postgres from 'postgres';
import { readFileSync } from 'fs';

async function importBooks() {
  const sqlFile = process.argv[2];

  if (!sqlFile) {
    console.error('Usage: npx tsx scripts/import-books.ts <sql-file>');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  try {
    console.log('Reading SQL file:', sqlFile);
    const sql = readFileSync(sqlFile, 'utf-8');

    // Split by lines and filter out comments, dotenv output, and empty lines
    const statements = sql
      .split('\n')
      .filter(line =>
        !line.trim().startsWith('--') &&
        !line.trim().startsWith('[dotenv') &&
        line.trim().length > 0
      )
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim().length > 0);

    console.log(`Found ${statements.length} SQL statements`);

    const client = postgres(process.env.DATABASE_URL);

    let imported = 0;
    for (const statement of statements) {
      if (statement.trim()) {
        await client.unsafe(statement);
        imported++;
        if (imported % 10 === 0) {
          console.log(`Imported ${imported}/${statements.length} books...`);
        }
      }
    }

    console.log(`✅ Successfully imported ${imported} books!`);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to import books:', error);
    process.exit(1);
  }
}

importBooks();
