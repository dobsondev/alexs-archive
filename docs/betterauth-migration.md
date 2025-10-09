# BetterAuth Migration Guide

This guide outlines the step-by-step process for migrating from Auth0 to BetterAuth with a fresh database approach.

## Overview

This migration uses a **fresh database approach** where we:
1. Create a completely new database
2. Run fresh BetterAuth migrations
3. Import existing book data
4. Manually recreate user accounts

This approach ensures a clean schema that matches BetterAuth's expectations exactly, avoiding schema conflicts.

## Prerequisites

- Access to production database for exporting book data
- Ability to create a new database (Neon branch or new database)
- BetterAuth v1.3.27 installed (`npm install better-auth@1.3.27`)
- bcrypt installed (`npm install bcrypt @types/bcrypt`)

## Step-by-Step Migration

### 1. Export Book Data from Production

Export all existing books from your production database:

```bash
npx tsx scripts/export-books.ts > books-backup.sql
```

This creates a SQL file containing all book data with INSERT statements.

### 2. Create Fresh Database

Create a new blank database:
- **Neon**: Create a new branch or database instance
- **Local**: Use a fresh Postgres instance
- Update your `.env` with the new `DATABASE_URL`

### 3. Delete Old Migrations

Remove all existing migrations to start fresh:

```bash
rm -rf drizzle/0*.sql
rm -rf drizzle/meta/*
```

Keep only the `drizzle/meta/_journal.json` structure (it will be regenerated).

### 4. Generate Fresh BetterAuth Migration

Generate new migrations based on the current schema:

```bash
npm run db:generate
```

This creates a single migration file with the complete BetterAuth schema.

### 5. Run Migration on Fresh Database

Apply the migration to your new blank database:

```bash
npm run db:migrate
```

Verify the tables were created:
- `alexs-archive_user`
- `alexs-archive_account`
- `alexs-archive_session`
- `alexs-archive_verification`
- `alexs-archive_book`

### 6. Import Book Data

Import the books from your backup:

```bash
npx tsx scripts/import-books.ts books-backup.sql
```

Verify books were imported successfully (should see count of imported books).

### 7. Create Admin User

Create your first admin user:

```bash
npm run create-user -- "Admin Name" admin@example.com securepassword --admin --upload
```

Test login at `/sign-in` to verify authentication works.

### 8. Create Additional Users

For each user that needs access, create their account:

```bash
# Regular user
npm run create-user -- "User Name" user@example.com password123 --kindle=user@kindle.com

# User with upload permission
npm run create-user -- "Uploader" uploader@example.com pass123 --upload --kindle=kindle@kindle.com

# Admin user
npm run create-user -- "Another Admin" admin2@example.com pass123 --admin --upload
```

### 9. Update Environment Variables

Ensure production environment has:

```bash
DATABASE_URL=<new-database-url>
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=<your-production-url>
UPLOADTHING_TOKEN=<existing-token>
RESEND_API_KEY=<existing-key>
```

### 10. Deploy to Production

1. Commit all changes (schema, migrations, BetterAuth code)
2. Deploy to your hosting platform
3. Verify environment variables are set
4. Test authentication and book functionality

### 11. Cleanup

After successful migration:

```bash
# Remove Auth0 documentation (optional)
rm docs/authentication.md

# Remove old Auth0-related scripts (see Scripts Cleanup section below)
```

## Scripts Cleanup

### Keep These Scripts:
- `scripts/create-user.ts` - User creation (actively used)
- `scripts/export-books.ts` - Book export utility (useful for backups)
- `scripts/import-books.ts` - Book import utility (useful for restoring)

### Delete These Scripts:
- `scripts/create-admin.ts` - Replaced by `create-user` with `--admin` flag
- `scripts/create-admin-simple.ts` - Replaced by `create-user`
- `scripts/create-admin-direct.ts` - Replaced by `create-user`
- `scripts/make-admin.ts` - Replaced by recreating user with `create-user`
- `scripts/check-user.ts` - Can use Drizzle Studio instead
- `scripts/check-account.ts` - Can use Drizzle Studio instead
- `scripts/delete-user.ts` - Can use Drizzle Studio or direct SQL
- `scripts/add-type-column.ts` - Migration-specific, no longer needed

```bash
# Clean up old scripts
rm scripts/create-admin.ts
rm scripts/create-admin-simple.ts
rm scripts/create-admin-direct.ts
rm scripts/make-admin.ts
rm scripts/check-user.ts
rm scripts/check-account.ts
rm scripts/delete-user.ts
rm scripts/add-type-column.ts
```

## Verification Checklist

After migration, verify:

- [ ] Users can sign in at `/sign-in`
- [ ] Users can change passwords at `/user/profile`
- [ ] Admin users see upload button in top bar
- [ ] Book uploads work (if you have upload permission)
- [ ] Books display correctly on `/books`
- [ ] Individual book pages work (`/books/[id]`)
- [ ] Send to Kindle works for own email
- [ ] Admins can send to other users' Kindle emails
- [ ] All routes except `/`, `/sign-in` are protected

## Rollback Plan

If migration fails:

1. Keep old database connection string
2. Revert code to pre-migration state
3. Re-deploy old version
4. Debug issues before attempting migration again

## Key Schema Changes

### BetterAuth Schema Requirements

- All text fields use `text` type (not `varchar`)
- Account table uses `accountId` (not `providerAccountId`)
- Account table uses `providerId` (not `provider`)
- Account table includes `password` field for email/password auth
- Session table uses `token` (not `session_token`)
- Session table uses `expiresAt` (not `expires`)
- Password hashing uses scrypt with specific parameters (N=16384, r=16, p=1)

### Custom Fields

BetterAuth requires custom fields to be declared in `src/server/auth/index.ts`:

```typescript
user: {
  additionalFields: {
    uploadPermission: { type: "boolean", defaultValue: false, required: false },
    isAdmin: { type: "boolean", defaultValue: false, required: false },
    kindleEmail: { type: "string", required: false },
  },
}
```

## Troubleshooting

### "Invalid password hash" error
- Password wasn't hashed with BetterAuth's `hashPassword` function
- Recreate user with `create-user` script

### Custom fields not in session
- Check `user.additionalFields` configuration in `src/server/auth/index.ts`
- Ensure fields are properly defined

### Hydration errors in TopBar
- Use `isClient` state pattern to defer session-dependent rendering
- See `src/app/_components/TopBar.tsx` for reference

### Route not protected
- Add authentication check to page or layout
- Server-side: Use `auth.api.getSession()` with redirect
- Client-side: Use `useSession()` hook with redirect

## Additional Resources

- [BetterAuth Documentation](https://www.better-auth.com/docs)
- [BetterAuth GitHub](https://github.com/better-auth/better-auth)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
