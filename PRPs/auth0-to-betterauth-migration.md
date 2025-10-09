name: "Auth0 to BetterAuth Migration PRP"
description: |
  Complete migration from NextAuth.js + Auth0 to BetterAuth for self-hosted authentication
  in Alex's Archive eBook application. This PRP enables one-pass implementation success.

---

## Goal

**Feature Goal**: Migrate authentication from Auth0 (third-party OAuth) to BetterAuth (self-hosted) in the Alex's Archive Next.js 15 application, eliminating external authentication dependencies while maintaining all existing functionality and user data.

Users should be added manually and there should be no option to signup to the application. This can be done via the database or via an admin panel.

**Deliverable**: Fully functional BetterAuth-based authentication system with:
- All existing users migrated and able to authenticate
- Email/password authentication working
- OAuth providers (Google, GitHub) working (if desired for future)
- Upload permission system preserved
- Admin posing functionality preserved
- Kindle email sending still secured by auth
- All auth-dependent features (upload, send to Kindle, user profiles) working

**Success Definition**:
- All 22 authentication-dependent files updated and tested
- All existing user sessions invalidated and users can log in with BetterAuth
- Database schema migrated with zero data loss
- All protected routes (upload, user profile, admin features) properly secured
- Build passes with no TypeScript errors
- All authentication flows tested manually

## Why

- **Eliminate vendor dependency**: Remove Auth0 third-party service, reducing external points of failure
- **Full data ownership**: All authentication data stored in application database
- **Cost reduction**: No Auth0 subscription fees as user base grows
- **Simplified architecture**: Single database for all application data including auth
- **Better DX**: Modern TypeScript-first auth with automatic type inference
- **Built-in features**: Rate limiting, session management, security features without custom code
- **Integration simplicity**: Works natively with existing Drizzle ORM and PostgreSQL setup

## What

Replace the current NextAuth.js v5 + Auth0 OAuth implementation with BetterAuth self-hosted authentication:

### Current State
- NextAuth.js v5 (beta.25) with Auth0 provider
- 4 database tables: users, accounts, sessions, verification_tokens
- Custom session augmentation for user ID and uploadPermission
- 22 files using authentication
- Protected routes for upload, user profile, admin features

### Target State
- BetterAuth with Drizzle adapter
- Updated database schema (mapped to existing tables where possible)
- Email/password authentication (new capability)
- Custom user fields preserved (uploadPermission, kindleEmail, isAdmin)
- All 22 files updated to use BetterAuth APIs
- Middleware for route protection

### Success Criteria

- [ ] BetterAuth installed and configured with Drizzle adapter
- [ ] Database schema updated with BetterAuth requirements
- [ ] Environment variables migrated to BetterAuth format
- [ ] Server-side auth instance created and configured
- [ ] Client-side auth hooks working in all components
- [ ] API route handler updated from [...nextauth] to [...all]
- [ ] All protected routes secured with BetterAuth session checks
- [ ] Upload permission system working with BetterAuth
- [ ] Admin posing functionality working
- [ ] Kindle email sending auth checks working
- [ ] User profile management working
- [ ] UploadThing middleware using BetterAuth session
- [ ] All existing users can authenticate
- [ ] Type safety maintained throughout

## All Needed Context

### Context Completeness Check

_This PRP provides: complete file-by-file analysis of current Auth0 implementation (AUTH0_IMPLEMENTATION_ANALYSIS.md), comprehensive BetterAuth documentation (better-auth-research.md), migration patterns from official guides, exact file paths for all 22 auth-dependent files, database schema mapping strategy, and step-by-step implementation tasks. An AI agent with no prior knowledge of this codebase can implement this migration successfully._

### Documentation & References

```yaml
# MUST READ - Include in context window
- file: /Users/alex/Development/DobsonDev/alexs-archive/AUTH0_IMPLEMENTATION_ANALYSIS.md
  why: Complete analysis of current Auth0 implementation - all 22 files, auth flow, session handling
  critical: Shows custom uploadPermission field, admin posing pattern, UploadThing integration

- file: /Users/alex/Development/DobsonDev/alexs-archive/PRPs/better-auth-research.md
  why: Comprehensive BetterAuth setup guide with Next.js 15 App Router integration
  critical: Database schema requirements, Drizzle adapter config, session management patterns

- url: https://www.better-auth.com/docs/integrations/next
  why: Official Next.js integration guide - API route setup, middleware, headers pattern
  critical: Must use headers() in App Router for session checks, toNextJsHandler pattern

- url: https://www.better-auth.com/docs/adapters/drizzle
  why: Drizzle adapter configuration for PostgreSQL
  critical: Field mapping for existing schema, provider: "pg" required

- url: https://www.better-auth.com/docs/guides/next-auth-migration-guide
  why: Official migration guide from NextAuth to BetterAuth
  critical: Session table field mapping (token vs sessionToken, expiresAt vs expires)

- url: https://www.better-auth.com/docs/concepts/database#field-mapping
  why: How to map BetterAuth fields to existing database columns
  critical: Preserve existing table structure, avoid renaming columns

- file: /Users/alex/Development/DobsonDev/alexs-archive/src/server/db/schema.ts
  why: Current database schema with custom fields (uploadPermission, kindleEmail, isAdmin)
  pattern: Drizzle schema definition with createTable helper, custom prefix
  gotcha: Table names use alexs-archive_ prefix, must preserve in BetterAuth config

- file: /Users/alex/Development/DobsonDev/alexs-archive/src/server/auth/config.ts
  why: Current NextAuth configuration showing session callback pattern
  pattern: Session augmentation adds custom fields, must replicate in BetterAuth
  gotcha: Session callback currently incomplete - doesn't include uploadPermission despite TypeScript types

- file: /Users/alex/Development/DobsonDev/alexs-archive/src/env.js
  why: T3 environment validation pattern
  pattern: Zod schema for server/client env vars, emptyStringAsUndefined
  gotcha: AUTH_SECRET optional in dev, required in production

- file: /Users/alex/Development/DobsonDev/alexs-archive/src/app/api/uploadthing/core.ts
  why: Shows how UploadThing middleware uses auth
  pattern: getServerSession pattern must be replaced with BetterAuth equivalent
  gotcha: Must preserve user.id and user.uploadPermission checks
```

### Current Codebase Tree

```bash
/Users/alex/Development/DobsonDev/alexs-archive
├── src
│   ├── app
│   │   ├── _actions
│   │   │   ├── sendToKindle.ts        # Uses auth for Kindle email sending
│   │   │   └── profile.ts             # Uses auth for profile updates
│   │   ├── _components
│   │   │   ├── TopBar.tsx             # Shows user session, sign in/out
│   │   │   ├── SignInButton.tsx       # Handles sign in
│   │   │   ├── BookCard.tsx           # Uses session for conditional rendering
│   │   │   └── BookSearch.tsx         # Uses session
│   │   ├── _contexts
│   │   │   └── KindleEmailContext.tsx # Manages auth-dependent context
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   └── [...nextauth]
│   │   │   │       └── route.ts       # NextAuth API route (REPLACE)
│   │   │   ├── uploadthing
│   │   │   │   └── core.ts            # UploadThing auth middleware
│   │   │   └── users
│   │   │       └── kindle-emails
│   │   │           └── route.ts       # Protected API route
│   │   ├── books
│   │   │   ├── layout.tsx             # Uses session
│   │   │   └── upload
│   │   │       └── layout.tsx         # Protected upload route
│   │   ├── user
│   │   │   └── layout.tsx             # Protected user profile route
│   │   ├── layout.tsx                 # Root layout with SessionProvider
│   │   └── page.tsx                   # Home page with session
│   ├── env.js                         # Environment validation (UPDATE)
│   └── server
│       ├── auth
│       │   ├── config.ts              # NextAuth config (REPLACE)
│       │   └── index.ts               # Auth exports (REPLACE)
│       └── db
│           └── schema.ts              # Database schema (UPDATE)
├── drizzle                            # Database migrations
├── package.json                       # Dependencies (UPDATE)
└── tsconfig.json                      # TypeScript config
```

### Desired Codebase Tree (Changes)

```bash
/Users/alex/Development/DobsonDev/alexs-archive
├── src
│   ├── app
│   │   ├── api
│   │   │   └── auth
│   │   │       └── [...all]           # NEW: BetterAuth API route
│   │   │           └── route.ts
│   │   └── _lib
│   │       └── auth-client.ts         # NEW: Client-side auth instance
│   └── server
│       └── auth
│           ├── index.ts               # MODIFIED: BetterAuth server instance
│           └── config.ts              # REMOVED: No longer needed (config in index.ts)
└── drizzle
    └── 0001_betterauth_migration.sql  # NEW: Database migration for BetterAuth fields
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: BetterAuth with Next.js App Router
// - MUST use headers() from next/headers for session checks in Server Components
// - Cannot use middleware for session validation in Next.js < 15.2.0 (performance)
// - Use getSessionCookie() in middleware, full validation in route handlers

// CRITICAL: Drizzle adapter configuration
// - Must specify provider: "pg" for PostgreSQL
// - Table name mapping: use tableName option to preserve alexs-archive_ prefix
// - Field mapping: session.token maps to sessionToken, session.expiresAt maps to expires

// CRITICAL: Custom user fields
// - uploadPermission, kindleEmail, isAdmin must be preserved
// - These fields live on user table, not session table
// - Access via session.user, not session directly

// CRITICAL: Migration considerations
// - All existing sessions will be invalidated
// - Users must re-authenticate after migration
// - OAuth accounts table structure different (provider vs providerId)
// - emailVerified type: NextAuth uses timestamp, BetterAuth uses boolean

// GOTCHA: UploadThing integration
// - Middleware function receives req with headers
// - Must use auth.api.getSession({ headers: req.headers })
// - Return user data in metadata for onUploadComplete

// GOTCHA: TypeScript types
// - BetterAuth auto-generates types from schema
// - Must extend User interface for custom fields
// - No manual type augmentation needed like NextAuth

// GOTCHA: Environment variables
// - BETTER_AUTH_SECRET replaces AUTH_SECRET
// - BETTER_AUTH_URL required (base URL for callbacks)
// - Remove AUTH0_* variables after migration complete
```

## Implementation Blueprint

### Data Models and Structure

Update database schema to support BetterAuth while preserving existing custom fields:

```typescript
// File: src/server/db/schema.ts
// MODIFY existing user table - add BetterAuth required fields
export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false), // CHANGE from timestamp to boolean
  image: varchar("image", { length: 255 }),

  // BetterAuth required fields (NEW)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Custom fields (PRESERVE)
  uploadPermission: boolean("upload_permission").default(false).notNull(),
  kindleEmail: varchar("kindle_email", { length: 255 }),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

// MODIFY session table - add BetterAuth required fields
export const sessions = createTable("session", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(), // Maps to BetterAuth token
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", {
    mode: "date",
    withTimezone: true,
  }).notNull(), // Maps to BetterAuth expiresAt

  // BetterAuth required fields (NEW)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 255 }),
  userAgent: varchar("user_agent", { length: 255 }),
});

// MODIFY account table - update for BetterAuth OAuth structure
export const accounts = createTable("account", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 255 }).notNull(), // Maps to BetterAuth providerId
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(), // Maps to BetterAuth accountId
  refresh_token: varchar("refresh_token", { length: 255 }),
  access_token: varchar("access_token", { length: 255 }),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),

  // BetterAuth required fields (NEW)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ADD verification table for email verification (if using email/password)
export const verifications = createTable("verification", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: INSTALL BetterAuth dependencies
  - RUN: npm install better-auth
  - VERIFY: package.json shows better-auth in dependencies
  - NAMING: N/A
  - PLACEMENT: N/A
  - VALIDATION: npm list better-auth shows installed version

Task 2: UPDATE database schema in src/server/db/schema.ts
  - MODIFY: users table - change emailVerified to boolean, add createdAt/updatedAt
  - MODIFY: sessions table - add createdAt/updatedAt, ipAddress, userAgent
  - MODIFY: accounts table - add createdAt/updatedAt
  - ADD: verifications table for email verification tokens
  - FOLLOW pattern: Existing createTable helper with alexs-archive_ prefix
  - PRESERVE: All custom fields (uploadPermission, kindleEmail, isAdmin)
  - CRITICAL: emailVerified changes from timestamp to boolean
  - VALIDATION: Run npm run db:generate to create migration

Task 3: GENERATE and APPLY database migration
  - RUN: npm run db:generate to create migration file
  - REVIEW: Generated migration in drizzle/ directory
  - RUN: npm run db:push to apply migration to database
  - CRITICAL: Backup database before applying migration
  - VALIDATION: Check database schema in Drizzle Studio (npm run db:studio)

Task 4: CREATE BetterAuth server instance at src/server/auth/index.ts
  - REPLACE: Entire file with BetterAuth configuration
  - IMPLEMENT: betterAuth() with drizzleAdapter
  - CONFIGURE: Database adapter with field mapping for existing schema
  - CONFIGURE: emailAndPassword authentication enabled
  - CONFIGURE: Table name mapping to preserve alexs-archive_ prefix
  - CONFIGURE: Field mapping: sessionToken->token, expires->expiresAt, provider->providerId
  - FOLLOW pattern: better-auth-research.md sections 5 and 10
  - NAMING: Export as `auth` for consistency with existing code
  - DEPENDENCIES: Import db from ~/server/db, drizzleAdapter from better-auth/adapters/drizzle
  - PLACEMENT: src/server/auth/index.ts
  - CRITICAL: Use provider: "pg" in adapter config
  - VALIDATION: File compiles without TypeScript errors

Task 5: CREATE client-side auth instance at src/app/_lib/auth-client.ts
  - CREATE: New file for client-side BetterAuth instance
  - IMPLEMENT: createAuthClient() from better-auth/react
  - EXPORT: Named exports for signIn, signOut, signUp, useSession
  - CONFIGURE: baseURL from environment or window.location.origin
  - FOLLOW pattern: better-auth-research.md section 6
  - NAMING: authClient instance, named exports for hooks
  - PLACEMENT: src/app/_lib/auth-client.ts (NEW)
  - DEPENDENCIES: Import from better-auth/react
  - VALIDATION: File compiles without TypeScript errors

Task 6: UPDATE environment variables in src/env.js
  - MODIFY: Replace AUTH0_* variables with BETTER_AUTH_* variables
  - ADD: BETTER_AUTH_SECRET to server schema (required)
  - ADD: BETTER_AUTH_URL to server schema (required)
  - REMOVE: AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_ISSUER from schema
  - MODIFY: Rename AUTH_SECRET to BETTER_AUTH_SECRET in schema
  - UPDATE: runtimeEnv object with new variable mappings
  - FOLLOW pattern: Existing T3 env validation with Zod
  - PRESERVE: All other environment variables (DATABASE_URL, UPLOADTHING_TOKEN, etc.)
  - PLACEMENT: src/env.js
  - VALIDATION: Application starts without env validation errors

Task 7: UPDATE .env file with BetterAuth variables
  - ADD: BETTER_AUTH_SECRET=<generated secret from npx @better-auth/cli secret>
  - ADD: BETTER_AUTH_URL=http://localhost:3000
  - REMOVE: AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_ISSUER (keep for rollback initially)
  - CRITICAL: Generate new secret, don't reuse AUTH_SECRET
  - VALIDATION: Application starts and connects to database

Task 8: CREATE BetterAuth API route at src/app/api/auth/[...all]/route.ts
  - CREATE: New directory and file for BetterAuth API handler
  - IMPLEMENT: GET and POST exports using toNextJsHandler
  - IMPORT: auth from ~/server/auth
  - IMPORT: toNextJsHandler from better-auth/next-js
  - EXPORT: { GET, POST } = toNextJsHandler(auth.handler)
  - FOLLOW pattern: better-auth-research.md section 5, AUTH0_IMPLEMENTATION_ANALYSIS.md line 160
  - NAMING: Directory [...all], file route.ts
  - PLACEMENT: src/app/api/auth/[...all]/route.ts (NEW)
  - VALIDATION: Can access /api/auth/session in browser

Task 9: DELETE old NextAuth API route
  - DELETE: src/app/api/auth/[...nextauth]/route.ts
  - DELETE: src/app/api/auth/[...nextauth]/ directory
  - DELETE: src/server/auth/config.ts (NextAuth config no longer needed)
  - CRITICAL: Only after Task 8 is complete and tested
  - VALIDATION: Old route returns 404

Task 10: UPDATE root layout at src/app/layout.tsx
  - MODIFY: Replace SessionProvider from next-auth/react
  - IMPORT: SessionProvider from @/app/_lib/auth-client (if BetterAuth provides one)
  - OR: Remove SessionProvider entirely (BetterAuth handles session differently)
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 322-350
  - PRESERVE: All other providers and layout structure
  - PLACEMENT: src/app/layout.tsx
  - CRITICAL: Check if BetterAuth requires provider wrapper or not
  - VALIDATION: Application renders without errors

Task 11: UPDATE TopBar component at src/app/_components/TopBar.tsx
  - MODIFY: Replace useSession from next-auth/react with version from @/app/_lib/auth-client
  - MODIFY: Replace signOut from next-auth/react with version from @/app/_lib/auth-client
  - PRESERVE: All rendering logic and UI
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 401-468
  - PLACEMENT: src/app/_components/TopBar.tsx
  - VALIDATION: Component renders user info when logged in, shows sign in when not

Task 12: UPDATE SignInButton component at src/app/_components/SignInButton.tsx
  - MODIFY: Replace signIn from next-auth/react with version from @/app/_lib/auth-client
  - UPDATE: signIn call to use BetterAuth syntax (signIn.email or signIn.social)
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 470-490
  - PLACEMENT: src/app/_components/SignInButton.tsx
  - VALIDATION: Sign in button triggers authentication flow

Task 13: UPDATE BookCard component at src/app/_components/BookCard.tsx
  - MODIFY: Replace useSession from next-auth/react with version from @/app/_lib/auth-client
  - PRESERVE: All conditional rendering based on session.user
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 492-530
  - PLACEMENT: src/app/_components/BookCard.tsx
  - VALIDATION: Component shows correct actions based on auth state

Task 14: UPDATE BookSearch component at src/app/_components/BookSearch.tsx
  - MODIFY: Replace useSession from next-auth/react with version from @/app/_lib/auth-client
  - PRESERVE: All search and filter logic
  - PLACEMENT: src/app/_components/BookSearch.tsx
  - VALIDATION: Search works for authenticated and unauthenticated users

Task 15: UPDATE KindleEmailContext at src/app/_contexts/KindleEmailContext.tsx
  - MODIFY: Replace useSession from next-auth/react with version from @/app/_lib/auth-client
  - PRESERVE: All context logic for Kindle email management
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 354-399
  - PLACEMENT: src/app/_contexts/KindleEmailContext.tsx
  - VALIDATION: Context provides correct user data

Task 16: UPDATE UploadThing core at src/app/api/uploadthing/core.ts
  - MODIFY: Replace getServerSession with auth.api.getSession
  - IMPORT: auth from ~/server/auth
  - MODIFY: Pass req.headers to getSession
  - PRESERVE: uploadPermission check logic
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 202-270, better-auth-research.md
  - PLACEMENT: src/app/api/uploadthing/core.ts
  - CRITICAL: Must preserve user.uploadPermission check for security
  - VALIDATION: Upload only works for users with uploadPermission

Task 17: UPDATE Kindle emails API route at src/app/api/users/kindle-emails/route.ts
  - MODIFY: Replace getServerSession with auth.api.getSession
  - IMPORT: auth from ~/server/auth, headers from next/headers
  - MODIFY: Pass { headers: await headers() } to getSession
  - PRESERVE: All business logic
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 272-320
  - PLACEMENT: src/app/api/users/kindle-emails/route.ts
  - VALIDATION: API returns 401 when unauthenticated, works when authenticated

Task 18: UPDATE sendToKindle action at src/app/_actions/sendToKindle.ts
  - MODIFY: Replace getServerSession with auth.api.getSession
  - IMPORT: auth from ~/server/auth, headers from next/headers
  - MODIFY: Pass { headers: await headers() } to getSession
  - PRESERVE: All Kindle email sending logic
  - PRESERVE: Admin posing functionality
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 540-590
  - PLACEMENT: src/app/_actions/sendToKindle.ts
  - CRITICAL: Preserve admin posing feature (isAdmin check)
  - VALIDATION: Send to Kindle works for own email and admin can send to others

Task 19: UPDATE profile action at src/app/_actions/profile.ts
  - MODIFY: Replace getServerSession with auth.api.getSession
  - IMPORT: auth from ~/server/auth, headers from next/headers
  - MODIFY: Pass { headers: await headers() } to getSession
  - PRESERVE: All profile update logic
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 592-630
  - PLACEMENT: src/app/_actions/profile.ts
  - VALIDATION: Profile updates work for authenticated users

Task 20: UPDATE upload layout at src/app/books/upload/layout.tsx
  - MODIFY: Replace getServerSession with auth.api.getSession
  - IMPORT: auth from ~/server/auth, headers from next/headers
  - MODIFY: Pass { headers: await headers() } to getSession
  - PRESERVE: uploadPermission check and redirect logic
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 632-680
  - PLACEMENT: src/app/books/upload/layout.tsx
  - CRITICAL: Must check uploadPermission for route protection
  - VALIDATION: Upload page only accessible to users with uploadPermission

Task 21: UPDATE user profile layout at src/app/user/layout.tsx
  - MODIFY: Replace getServerSession with auth.api.getSession
  - IMPORT: auth from ~/server/auth, headers from next/headers
  - MODIFY: Pass { headers: await headers() } to getSession
  - PRESERVE: Authentication check and redirect logic
  - FOLLOW pattern: AUTH0_IMPLEMENTATION_ANALYSIS.md lines 682-720
  - PLACEMENT: src/app/user/layout.tsx
  - VALIDATION: User profile only accessible when authenticated

Task 22: UPDATE books layout at src/app/books/layout.tsx
  - MODIFY: Replace useSession with version from @/app/_lib/auth-client
  - PRESERVE: All layout and session-dependent rendering
  - PLACEMENT: src/app/books/layout.tsx
  - VALIDATION: Books page renders correctly for all auth states

Task 23: UPDATE home page at src/app/page.tsx
  - MODIFY: Replace getServerSession with auth.api.getSession
  - IMPORT: auth from ~/server/auth, headers from next/headers
  - MODIFY: Pass { headers: await headers() } to getSession
  - PRESERVE: All page content and session-dependent rendering
  - PLACEMENT: src/app/page.tsx
  - VALIDATION: Home page shows correct content based on auth state

Task 24: EXTEND TypeScript types for custom user fields
  - CREATE: types/better-auth.d.ts (NEW)
  - DECLARE: module augmentation for better-auth
  - EXTEND: User interface with uploadPermission, kindleEmail, isAdmin
  - FOLLOW pattern: better-auth-research.md section 11
  - PLACEMENT: types/better-auth.d.ts or src/types/auth.ts
  - VALIDATION: TypeScript recognizes custom fields on session.user

Task 25: REMOVE NextAuth dependencies
  - RUN: npm uninstall next-auth
  - VERIFY: package.json no longer lists next-auth
  - CRITICAL: Only after all code updated and tested
  - VALIDATION: Application builds without errors

Task 26: UPDATE package.json scripts (if needed)
  - VERIFY: No auth-specific scripts need updating
  - PRESERVE: All existing scripts
  - VALIDATION: npm run build succeeds
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: BetterAuth server instance with Drizzle adapter
// File: src/server/auth/index.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // CRITICAL: Must specify PostgreSQL
    schema: {
      // Map BetterAuth field names to existing database columns
      user: {
        fields: {
          email: "email",
          emailVerified: "email_verified",
          name: "name",
          image: "image",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      session: {
        fields: {
          sessionToken: "session_token", // BetterAuth uses token, we have sessionToken
          userId: "user_id",
          expiresAt: "expires", // BetterAuth uses expiresAt, we have expires
          createdAt: "created_at",
          updatedAt: "updated_at",
          ipAddress: "ip_address",
          userAgent: "user_agent",
        },
      },
      account: {
        fields: {
          userId: "user_id",
          providerId: "provider", // BetterAuth uses providerId, we have provider
          accountId: "provider_account_id", // BetterAuth uses accountId
          accessToken: "access_token",
          refreshToken: "refresh_token",
          idToken: "id_token",
          expiresAt: "expires_at",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
    },
  }),
  emailAndPassword: {
    enabled: true, // NEW: Enable email/password authentication
  },
  trustedOrigins: ["http://localhost:3000"], // Add your production URL
});

// Export types for use in components
export type Session = typeof auth.$Infer.Session;

// PATTERN 2: Client-side auth instance
// File: src/app/_lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = authClient;

// PATTERN 3: Server Component session check
// Used in: layouts, pages, server actions
import { auth } from "~/server/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({
  headers: await headers(), // CRITICAL: Must pass headers in App Router
});

if (!session) {
  redirect("/"); // Or appropriate redirect
}

// Access user data
const userId = session.user.id;
const userName = session.user.name;
const hasUploadPermission = session.user.uploadPermission; // Custom field

// PATTERN 4: Client Component session check
// Used in: client components
"use client";
import { useSession } from "@/app/_lib/auth-client";

export function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Hello {session.user.name}</div>;
}

// PATTERN 5: Sign in (client-side)
import { signIn } from "@/app/_lib/auth-client";

// Email/password sign in
await signIn.email({
  email: "user@example.com",
  password: "password",
  callbackURL: "/dashboard",
});

// Social sign in (if configured)
await signIn.social({
  provider: "google",
  callbackURL: "/dashboard",
});

// PATTERN 6: Sign out (client-side)
import { signOut } from "@/app/_lib/auth-client";

await signOut({
  fetchOptions: {
    onSuccess: () => {
      window.location.href = "/";
    },
  },
});

// PATTERN 7: UploadThing middleware with BetterAuth
// File: src/app/api/uploadthing/core.ts
import { auth } from "~/server/auth";
import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  ebookUploader: f({ "application/epub+zip": { maxFileSize: "32MB" } })
    .middleware(async ({ req }) => {
      // Get session from BetterAuth
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      // Check authentication
      if (!session) throw new Error("Unauthorized");

      // CRITICAL: Check uploadPermission for security
      if (!session.user.uploadPermission) {
        throw new Error("Upload permission required");
      }

      // Return metadata
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
    }),
};

// PATTERN 8: TypeScript type extension for custom fields
// File: types/better-auth.d.ts
import type { User as BetterAuthUser, Session as BetterAuthSession } from "better-auth";

declare module "better-auth" {
  interface User extends BetterAuthUser {
    uploadPermission: boolean;
    kindleEmail: string | null;
    isAdmin: boolean;
  }
}

// GOTCHA: Migration data transformation
// emailVerified changes from timestamp to boolean
// If migrating existing data, use this transformation:
// UPDATE alexs-archive_user SET email_verified = (email_verified IS NOT NULL);
```

### Integration Points

```yaml
DATABASE:
  - migration: "Add createdAt, updatedAt to sessions and accounts tables"
  - migration: "Change emailVerified from timestamp to boolean on users table"
  - migration: "Add ipAddress, userAgent to sessions table"
  - migration: "Add verifications table for email verification"
  - index: "Session token should already be indexed (unique constraint)"
  - index: "User email should already be indexed (unique constraint)"

CONFIG:
  - add to: src/env.js
  - pattern: |
      server: {
        BETTER_AUTH_SECRET: z.string().min(32),
        BETTER_AUTH_URL: z.string().url(),
        // Remove: AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_ISSUER
      }

DEPENDENCIES:
  - add: better-auth
  - remove: next-auth (after migration complete and tested)

API_ROUTES:
  - add: src/app/api/auth/[...all]/route.ts
  - remove: src/app/api/auth/[...nextauth]/route.ts
  - pattern: "export const { GET, POST } = toNextJsHandler(auth.handler)"

TYPES:
  - add: types/better-auth.d.ts
  - pattern: "Declare module augmentation for better-auth User interface"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding

# Type checking
npm run typecheck

# Linting
npm run lint

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Database Validation

```bash
# After schema changes (Task 2-3)

# Generate migration
npm run db:generate

# Review migration file in drizzle/ directory
cat drizzle/0001_betterauth_migration.sql

# Apply migration to development database
npm run db:push

# Open Drizzle Studio to verify schema
npm run db:studio

# Verify:
# - users table has createdAt, updatedAt, emailVerified is boolean
# - sessions table has createdAt, updatedAt, ipAddress, userAgent
# - accounts table has createdAt, updatedAt
# - verifications table exists

# Expected: All tables match BetterAuth requirements
```

### Level 3: Build Validation

```bash
# After all code changes (Task 4-24)

# Full build
npm run build

# Expected: Build completes without TypeScript or build errors
# If errors exist, fix them before proceeding to manual testing
```

### Level 4: Authentication Flow Testing (Manual)

```bash
# Start development server
npm run dev

# Test 1: Access session endpoint
curl http://localhost:3000/api/auth/session
# Expected: Returns session data or null

# Test 2: Sign in flow
# 1. Navigate to http://localhost:3000
# 2. Click sign in button
# 3. Enter email and password (create account if needed)
# 4. Verify redirect to appropriate page
# 5. Verify user name appears in TopBar
# Expected: Successful authentication and session creation

# Test 3: Protected routes
# 1. Sign out
# 2. Try to access /books/upload
# 3. Verify redirect to home or login
# 4. Sign in with account that has uploadPermission
# 5. Access /books/upload
# 6. Verify page loads
# Expected: Routes protected correctly based on auth state

# Test 4: Upload functionality
# 1. Sign in with account that has uploadPermission
# 2. Navigate to /books/upload
# 3. Select an epub file
# 4. Submit upload
# 5. Verify upload completes
# Expected: UploadThing integration works with BetterAuth

# Test 5: Send to Kindle
# 1. Sign in
# 2. Set Kindle email in profile
# 3. Find a book
# 4. Click "Send to Kindle"
# 5. Verify email sent (check logs)
# Expected: Kindle email sending works with BetterAuth

# Test 6: Admin posing (if admin user exists)
# 1. Sign in as admin user
# 2. Attempt to send book to another user's Kindle
# 3. Verify action completes
# Expected: Admin can pose as other users for sending

# Test 7: Sign out
# 1. Click sign out button
# 2. Verify redirect to home
# 3. Verify TopBar shows sign in button
# Expected: Sign out clears session properly
```

### Level 5: Database Session Verification

```bash
# After authentication testing

# Open Drizzle Studio
npm run db:studio

# Verify:
# 1. sessions table has new entries after sign in
# 2. Session records include ipAddress and userAgent
# 3. expiresAt is set to appropriate future date
# 4. userId correctly references user table

# Expected: Session data properly stored in database
```

## Final Validation Checklist

### Technical Validation

- [ ] All validation levels (1-5) completed successfully
- [ ] TypeScript builds with zero errors: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Production build succeeds: `npm run build`
- [ ] Database schema matches BetterAuth requirements
- [ ] All 22 auth-dependent files updated

### Feature Validation

- [ ] Sign in with email/password works
- [ ] Sign out works and clears session
- [ ] Session persists across page refreshes
- [ ] Protected route /books/upload redirects when not authenticated
- [ ] Protected route /books/upload accessible with uploadPermission
- [ ] Protected route /user accessible when authenticated
- [ ] UploadThing integration works (auth check in middleware)
- [ ] Send to Kindle works for authenticated users with Kindle email
- [ ] Admin posing works (admin can send to other users)
- [ ] User profile updates work
- [ ] TopBar shows correct auth state (signed in/out)
- [ ] BookCard actions conditional on auth state
- [ ] Session includes custom fields (uploadPermission, kindleEmail, isAdmin)

### Code Quality Validation

- [ ] No remaining references to next-auth/react in codebase
- [ ] No remaining references to getServerSession from next-auth
- [ ] All imports use @/app/_lib/auth-client for client hooks
- [ ] All server code uses ~/server/auth for session checks
- [ ] TypeScript types include custom user fields
- [ ] Environment variables updated (BETTER_AUTH_* instead of AUTH0_*)
- [ ] Old NextAuth dependencies removed from package.json
- [ ] Old API route [...nextauth] deleted
- [ ] Old config.ts file deleted

### Security Validation

- [ ] Upload permission check working in UploadThing middleware
- [ ] API routes return 401 when unauthenticated
- [ ] Protected layouts redirect when unauthorized
- [ ] Session tokens stored securely (httpOnly cookies)
- [ ] BETTER_AUTH_SECRET is strong (32+ characters)
- [ ] No sensitive auth data exposed in client bundles

### Data Integrity Validation

- [ ] Existing user data preserved in database
- [ ] Custom fields (uploadPermission, kindleEmail, isAdmin) intact
- [ ] No data loss from schema migration
- [ ] Users can authenticate after migration (may need password reset flow)

---

## Anti-Patterns to Avoid

- ❌ Don't use getServerSession - use auth.api.getSession({ headers })
- ❌ Don't forget to pass headers() in Server Components
- ❌ Don't use useSession from next-auth/react - use from @/app/_lib/auth-client
- ❌ Don't skip database migration backup
- ❌ Don't remove Auth0 env vars until fully tested (keep for rollback)
- ❌ Don't use middleware for session validation in Next.js < 15.2.0 (performance issue)
- ❌ Don't forget to map database fields (sessionToken vs token, expires vs expiresAt)
- ❌ Don't skip emailVerified type change (timestamp to boolean)
- ❌ Don't forget to add createdAt/updatedAt to all auth tables
- ❌ Don't hardcode auth URLs - use environment variables
- ❌ Don't skip type augmentation for custom user fields
- ❌ Don't test only happy path - test unauthorized access, permission checks
- ❌ Don't deploy without testing all auth-dependent features locally

---

## Migration Notes

### Session Invalidation

All existing user sessions will be invalidated during this migration. Users must re-authenticate after deployment.

**Recommended approach:**
1. Deploy during low-traffic period
2. Add notification banner: "Please log in again due to security upgrade"
3. Have support ready for user questions

### Password Reset

Since users previously authenticated via Auth0 OAuth, they may not have passwords in your database. You'll need to implement a "Set Password" or email verification flow for existing users.

**Options:**
1. Email existing users with password reset links
2. Implement "magic link" authentication as alternative (BetterAuth plugin available)
3. Keep OAuth providers (Google, GitHub) for existing users

### Rollback Plan

If issues occur:

1. Revert code to previous commit
2. Restore database from backup (if schema was modified)
3. Restore old .env file with AUTH0_* variables
4. Redeploy

**Keep old NextAuth code in git history for at least 2 weeks after successful migration.**

---

## Confidence Score

**8/10** for one-pass implementation success

**Reasoning:**
- ✅ Complete file-by-file analysis of current implementation
- ✅ Comprehensive BetterAuth documentation and examples
- ✅ Clear database migration strategy with field mapping
- ✅ All 22 files identified with specific patterns to follow
- ✅ Detailed validation steps at multiple levels
- ⚠️ Custom fields (uploadPermission, isAdmin, kindleEmail) require careful type extension
- ⚠️ Existing users need password reset or alternative auth flow
- ⚠️ Admin posing functionality needs verification with BetterAuth session structure

**Mitigation for remaining risks:**
- Test admin posing feature thoroughly in development before production
- Implement password reset flow before user migration
- Test with real database migration on staging environment first