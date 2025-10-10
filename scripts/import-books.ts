/**
 * Script to import book data from backup SQL file
 * Run with:
 *   npm run import-books:dev -- books-backup.sql
 *   npm run import-books:preview -- books-backup.sql
 *   npm run import-books:prod -- books-backup.sql
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';

// Environment is loaded by dotenv-cli before this script runs
async function importBooks() {
  const sqlFile = process.argv[2];

  if (!sqlFile) {
    console.error('Usage:');
    console.error('  npm run import-books:dev -- <sql-file>');
    console.error('  npm run import-books:preview -- <sql-file>');
    console.error('  npm run import-books:prod -- <sql-file>');
    console.error('\nExample:');
    console.error('  npm run import-books:dev -- books-backup.sql');
    console.error('  npm run import-books:preview -- books-backup-preview.sql');
    console.error('  npm run import-books:prod -- books-backup-prod.sql');
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
