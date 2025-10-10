# BetterAuth Migration - Summary & Plan

- `npm run db:migrate:dev`
- `npm run import-books:dev books-backup.sql`
- `npm run create-user:dev -- "Full Name" email@example.com password --admin --upload --kindle=email@kindle.com`

## Documentation Updates ✅

- ✅ Updated `README.md` with BetterAuth information
- ✅ Updated `CLAUDE.md` with BetterAuth architecture details
- ✅ Created `docs/betterauth-migration.md` with step-by-step migration guide

### Migration Steps Summary

1. **Export Books** - Save existing book data with `export-books.ts`
2. **Create Fresh DB** - New Neon branch or blank database
3. **Delete Migrations** - Remove old migration files
4. **Generate Fresh Migration** - Create new migration with BetterAuth schema
5. **Run Migration** - Apply to blank database
6. **Import Books** - Restore book data with `import-books.ts`
7. **Create Users** - Manually recreate all users with `create-user` script
8. **Deploy** - Update environment variables and deploy
9. **Cleanup** - Remove obsolete scripts and documentation

## Key Technical Details

### BetterAuth Schema Requirements

```typescript
// All auth tables use 'text' type, not 'varchar'
// Field naming conventions:
accounts: {
  accountId: text("account_id")      // not providerAccountId
  providerId: text("provider_id")    // not provider
  password: text("password")         // required for email/password
}

sessions: {
  token: text("token")               // not session_token
  expiresAt: timestamp("expires_at") // not expires
}
```

### Password Hashing

BetterAuth uses scrypt with specific parameters:
- N: 16384
- r: 16
- p: 1
- dkLen: 64
- Format: `salt:hashedKey` (hex encoded)

The `create-user` script uses BetterAuth's `hashPassword()` function to ensure compatibility.

### Custom User Fields

Custom fields must be declared in BetterAuth config:

```typescript
// src/server/auth/index.ts
user: {
  additionalFields: {
    uploadPermission: { type: "boolean", defaultValue: false, required: false },
    isAdmin: { type: "boolean", defaultValue: false, required: false },
    kindleEmail: { type: "string", required: false },
  },
}
```

## Post-Migration Verification

### Functional Testing
- [ ] User sign-in works
- [ ] Password change works
- [ ] Admin sees upload button
- [ ] Book upload works
- [ ] Send to Kindle works
- [ ] Admin can send to other users
- [ ] All routes properly protected

### Data Verification
- [ ] All books imported correctly
- [ ] All users recreated
- [ ] User permissions correct
- [ ] Kindle emails set

### Cleanup Tasks
- [ ] Remove obsolete scripts
- [ ] Update package.json (remove unused scripts)
- [ ] Remove Auth0 documentation
- [ ] Commit migration guide
- [ ] Update deployment docs

## Timeline Estimate

- **Preparation**: 15 minutes (export books, create database)
- **Migration**: 30 minutes (generate schema, import data)
- **User Creation**: 5 minutes per user
- **Testing**: 30 minutes (verify all functionality)
- **Deployment**: 15 minutes (deploy and verify production)

**Total**: ~2 hours for typical installation

## Success Criteria

Migration is complete when:

1. ✅ All books successfully imported
2. ✅ All users can sign in
3. ✅ Password changes work
4. ✅ Upload functionality works
5. ✅ Send to Kindle works
6. ✅ Admin features work
7. ✅ All routes properly protected
8. ✅ No Auth0 references remain
9. ✅ Documentation updated
10. ✅ Obsolete scripts removed

## Rollback Strategy

If migration encounters issues:

1. Keep old database connection string available
2. Revert code to pre-migration commit
3. Redeploy with old Auth0 configuration
4. Debug issues in development
5. Retry migration when issues resolved

The fresh database approach makes rollback simple - just switch back to the old `DATABASE_URL`.
