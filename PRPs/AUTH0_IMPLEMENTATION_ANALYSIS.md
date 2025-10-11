# Auth0 Authentication Implementation Analysis

**Project:** Alex's Archive (eBook Storage Application)
**Framework:** Next.js 15 with App Router
**Authentication Library:** NextAuth.js v5 (beta.25) - now known as Auth.js
**Provider:** Auth0
**Analysis Date:** 2025-09-30

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Environment Configuration](#environment-configuration)
3. [Database Schema](#database-schema)
4. [Authentication Configuration](#authentication-configuration)
5. [Authentication Flow](#authentication-flow)
6. [File-by-File Breakdown](#file-by-file-breakdown)
7. [Protected Routes & Authorization](#protected-routes--authorization)
8. [Client-Side Authentication](#client-side-authentication)
9. [Server-Side Authentication](#server-side-authentication)
10. [Security Patterns](#security-patterns)
11. [Custom Extensions](#custom-extensions)

---

## Executive Summary

This Next.js application uses NextAuth.js v5 (beta) with Auth0 as the OAuth provider. The implementation follows the T3 Stack architecture with:

- **Database-backed sessions** using Drizzle ORM and PostgreSQL
- **Custom session augmentation** to include user ID and upload permissions
- **Server-side authentication** using React Server Components
- **Client-side authentication** using React Context (SessionProvider)
- **Route protection** at the layout level
- **Permission-based authorization** for upload and admin features

---

## Environment Configuration

### File: `/Users/alex/Development/DobsonDev/alexs-archive/src/env.js`

**Lines 10-16, 39-42:**
```javascript
server: {
  AUTH_SECRET:
    process.env.NODE_ENV === "production"
      ? z.string()
      : z.string().optional(),
  AUTH0_CLIENT_ID: z.string(),
  AUTH0_CLIENT_SECRET: z.string(),
  AUTH0_ISSUER: z.string(),
  // ...
},
runtimeEnv: {
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  AUTH0_ISSUER: process.env.AUTH0_ISSUER,
  // ...
}
```

### Required Environment Variables

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `AUTH_SECRET` | Production only | NextAuth.js session encryption secret | Generated via `npx auth secret` |
| `AUTH0_CLIENT_ID` | Yes | Auth0 application client ID | From Auth0 dashboard |
| `AUTH0_CLIENT_SECRET` | Yes | Auth0 application client secret | From Auth0 dashboard |
| `AUTH0_ISSUER` | Yes | Auth0 tenant domain | `https://<tenant>.auth0.com` |
| `AUTH_TRUST_HOST` | Production | Trust X-Forwarded-Host header | `true` for reverse proxies |

**Notes:**
- Environment validation uses T3's `@t3-oss/env-nextjs` with Zod schemas
- `AUTH_SECRET` is optional in development but required in production
- Empty strings are treated as undefined (`emptyStringAsUndefined: true`)

---

## Database Schema

### File: `/Users/alex/Development/DobsonDev/alexs-archive/src/server/db/schema.ts`

The schema follows NextAuth.js adapter requirements with custom extensions.

### Users Table (Lines 47-61)

```typescript
export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
  kindleEmail: varchar("kindle_email", { length: 255 }),      // CUSTOM FIELD
  uploadPermission: boolean("upload_permission").notNull().default(false), // CUSTOM FIELD
});
```

**Table Name:** `alexs-archive_user`
**Custom Fields:**
- `kindleEmail` - Stores user's Kindle email for book sending
- `uploadPermission` - Boolean flag for upload/admin privileges

### Accounts Table (Lines 67-94)

```typescript
export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);
```

**Table Name:** `alexs-archive_account`
**Purpose:** Stores OAuth provider account linkage
**Primary Key:** Composite of `provider` + `providerAccountId`
**Index:** On `userId` for efficient lookups

### Sessions Table (Lines 100-117)

```typescript
export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  })
);
```

**Table Name:** `alexs-archive_session`
**Purpose:** Stores active user sessions
**Primary Key:** `sessionToken`
**Index:** On `userId`

### Verification Tokens Table (Lines 123-136)

```typescript
export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);
```

**Table Name:** `alexs-archive_verification_token`
**Purpose:** Email verification tokens (if needed)
**Primary Key:** Composite of `identifier` + `token`

---

## Authentication Configuration

### File: `/Users/alex/Development/DobsonDev/alexs-archive/src/server/auth/config.ts`

This file contains the core NextAuth.js configuration.

### TypeScript Module Augmentation (Lines 13-26)

```typescript
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      uploadPermission?: boolean;
    } & DefaultSession["user"];
  }
}
```

**Purpose:** Extends the default NextAuth session type to include custom fields
**Fields Added:**
- `id` - User's database ID (always present)
- `uploadPermission` - Boolean flag for admin privileges (optional)

### Auth0 Provider Configuration (Lines 34-53)

```typescript
export const authConfig = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER,
      authorization: {
        params: {
          scope: "openid email profile",
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          uploadPermission: false
        };
      },
    })
  ],
  // ...
}
```

**Key Points:**
- Uses Auth0's OAuth provider
- Requests `openid email profile` scopes
- Maps Auth0 profile to local user object:
  - `profile.sub` → `id` (Auth0's unique user ID)
  - `profile.name` → `name`
  - `profile.email` → `email`
  - `profile.picture` → `image`
- Sets `uploadPermission: false` by default for new users

### Drizzle Adapter Configuration (Lines 55-60)

```typescript
adapter: DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
}),
```

**Purpose:** Connects NextAuth.js to the PostgreSQL database via Drizzle ORM
**Behavior:**
- Automatically creates/updates users on sign-in
- Manages OAuth account linkage
- Handles session persistence

### Session Callback (Lines 61-69)

```typescript
callbacks: {
  session: ({ session, user }) => ({
    ...session,
    user: {
      ...session.user,
      id: user.id,
    },
  }),
},
```

**Purpose:** Augments the session object with database user information
**Note:** The `uploadPermission` field is NOT automatically added here - it must be fetched separately when needed

---

### File: `/Users/alex/Development/DobsonDev/alexs-archive/src/server/auth/index.ts`

```typescript
import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
```

**Lines 1-10:**
- Initializes NextAuth with the configuration
- Wraps `auth()` function with React's `cache()` for request deduplication
- Exports:
  - `auth` - Server-side function to get current session
  - `handlers` - GET/POST handlers for API routes
  - `signIn` - Server action for signing in
  - `signOut` - Server action for signing out

**React Cache Wrapper:**
The `cache()` wrapper ensures that calling `auth()` multiple times in the same React render will only execute once, improving performance.

---

## Authentication Flow

### 1. User Initiates Sign-In

```
┌─────────────────┐
│  Homepage       │
│  /              │
│                 │
│ [Sign In]       │ ← User clicks button
└────────┬────────┘
         │
         │ signIn() from next-auth/react
         ▼
┌─────────────────┐
│ Auth API Route  │
│ /api/auth/      │
│ signin          │
└────────┬────────┘
         │
         │ Redirects to Auth0
         ▼
┌─────────────────┐
│   Auth0         │
│   Login Page    │
│                 │
└─────────────────┘
```

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/SignInButton.tsx` (Lines 5-9)

```typescript
export default function SignInButton() {
  return (
    <button onClick={() => signIn()}>Sign in</button>
  );
}
```

### 2. Auth0 Authentication

```
┌─────────────────┐
│   Auth0         │
│   Login Page    │
│                 │
│ User enters     │
│ credentials     │
└────────┬────────┘
         │
         │ Authentication Success
         ▼
┌─────────────────┐
│   Auth0         │
│   Callback      │
│                 │
└────────┬────────┘
         │
         │ Redirects with auth code
         ▼
```

**Auth0 Configuration Required:**
- Callback URL: `http://localhost:3000/api/auth/callback/auth0`
- Logout URL: `http://localhost:3000/`

### 3. NextAuth Callback Processing

```
┌─────────────────┐
│ Auth API Route  │
│ /api/auth/      │
│ callback/auth0  │
└────────┬────────┘
         │
         │ 1. Exchange auth code for tokens
         │ 2. Fetch user profile from Auth0
         │ 3. Run profile() callback
         ▼
┌─────────────────┐
│ Drizzle Adapter │
│                 │
│ - Create/update │
│   user in DB    │
│ - Create account│
│   link          │
│ - Create session│
└────────┬────────┘
         │
         │ 4. Run session() callback
         │ 5. Set session cookie
         ▼
┌─────────────────┐
│ Redirect to     │
│ /books          │
└─────────────────┘
```

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "~/server/auth";

export const { GET, POST } = handlers;
```

This catch-all route handles:
- `/api/auth/signin` - Initiates sign-in
- `/api/auth/callback/auth0` - Auth0 callback
- `/api/auth/signout` - Initiates sign-out
- `/api/auth/session` - Returns current session (used by client)

### 4. Authenticated State

```
┌─────────────────┐
│ Client Browser  │
│                 │
│ Session cookie  │
│ stored          │
└────────┬────────┘
         │
         │ Every request includes cookie
         ▼
┌─────────────────┐
│ Server          │
│                 │
│ await auth()    │ ← Validates session
└────────┬────────┘
         │
         │ Returns session object
         ▼
┌─────────────────┐
│ Protected Page  │
│ Renders         │
└─────────────────┘
```

### 5. Sign-Out Flow

```
┌─────────────────┐
│ TopBar          │
│ Component       │
│                 │
│ [Sign Out]      │ ← User clicks
└────────┬────────┘
         │
         │ signOut() from next-auth/react
         ▼
┌─────────────────┐
│ Auth API Route  │
│ /api/auth/      │
│ signout         │
└────────┬────────┘
         │
         │ 1. Delete session from DB
         │ 2. Clear session cookie
         │ 3. Redirect to homepage
         ▼
┌─────────────────┐
│ Homepage        │
│ /               │
└─────────────────┘
```

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/TopBar.tsx` (Line 48)

```typescript
<a href="#" onClick={(e) => { e.preventDefault(); void signOut();}}>
  Sign out
</a>
```

---

## File-by-File Breakdown

### Core Authentication Files

#### 1. `/Users/alex/Development/DobsonDev/alexs-archive/src/server/auth/config.ts`
- **Lines 1-11:** Import dependencies and database schema
- **Lines 19-26:** TypeScript module augmentation for custom session type
- **Lines 33-70:** NextAuth configuration object
  - **Lines 34-53:** Auth0 provider configuration
  - **Lines 55-60:** Drizzle adapter configuration
  - **Lines 61-69:** Session callback to add user ID

#### 2. `/Users/alex/Development/DobsonDev/alexs-archive/src/server/auth/index.ts`
- **Lines 1-10:** Initialize NextAuth and export auth utilities
- **Line 8:** Wrap `auth()` with React cache for performance

#### 3. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/auth/[...nextauth]/route.ts`
- **Lines 1-3:** Export NextAuth handlers as GET/POST route handlers
- Handles all auth endpoints: signin, callback, signout, session

### Database Files

#### 4. `/Users/alex/Development/DobsonDev/alexs-archive/src/server/db/schema.ts`
- **Lines 47-61:** Users table with custom fields
- **Lines 67-94:** Accounts table for OAuth linkage
- **Lines 100-117:** Sessions table for active sessions
- **Lines 123-136:** Verification tokens table

#### 5. `/Users/alex/Development/DobsonDev/alexs-archive/src/server/db/index.ts`
- **Lines 1-19:** Initialize Drizzle database connection
- Uses connection pooling and caching in development

### Client Components

#### 6. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/layout.tsx`
- **Line 5:** Import SessionProvider
- **Lines 18-26:** Wrap app with SessionProvider for client-side auth

```typescript
<SessionProvider>
  <KindleEmailProvider>
    <html lang="en">
      <body>{children}</body>
    </html>
  </KindleEmailProvider>
</SessionProvider>
```

#### 7. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/SignInButton.tsx`
- **Line 3:** Import `signIn` from next-auth/react
- **Line 7:** Trigger sign-in on button click

#### 8. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/TopBar.tsx`
- **Line 3:** Import `useSession` and `signOut`
- **Line 12:** Get session data with `useSession()`
- **Line 14:** Conditionally render if user is logged in
- **Line 17:** Show upload link if user has `uploadPermission`
- **Line 31:** Display user avatar/image
- **Line 48:** Sign out button

#### 9. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_contexts/KindleEmailContext.tsx`
- **Line 4:** Import `useSession`
- **Line 25:** Access session to get current user email
- **Line 35-37:** Auto-select current user's Kindle email

### Server Components & Layouts

#### 10. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/page.tsx`
- **Line 1:** Import `auth` server function
- **Line 6:** Call `await auth()` to get session
- **Lines 8-10:** Redirect to /books if already authenticated
- **Lines 12-21:** Show sign-in page if not authenticated

#### 11. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/books/layout.tsx`
- **Line 1:** Import `auth` and `redirect`
- **Line 12:** Check session with `await auth()`
- **Lines 14-16:** Redirect to homepage if not authenticated
- **Lines 18-23:** Render TopBar and children if authenticated

#### 12. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/user/layout.tsx`
- **Line 1:** Import `auth` and `redirect`
- **Line 12:** Check session
- **Lines 14-16:** Redirect to homepage if not authenticated
- Identical pattern to books layout

#### 13. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/books/upload/layout.tsx`
- **Line 1:** Import `auth` and `redirect`
- **Line 9:** Check session
- **Lines 11-13:** Redirect if not authenticated
- **Lines 15-17:** Additional check for `uploadPermission`
- **Line 16:** Redirect to /books if user lacks upload permission

### API Routes

#### 14. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/users/kindle-emails/route.ts`
- **Line 3:** Import `auth`
- **Line 9:** Get session with `await auth()`
- **Lines 11-16:** Return 401 if not authenticated
- **Lines 18-24:** Query database for current user's upload permission
- **Lines 26-31:** Return 403 if user lacks permission
- **Lines 33-43:** Return list of users with Kindle emails (admin only)

#### 15. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/uploadthing/core.ts`
- **Line 2:** Import `auth`
- **Line 25:** Check session in middleware
- **Line 28:** Throw error if not authenticated
- **Lines 30-43:** Process upload with user context

#### 16. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/books/route.ts`
- **No authentication check** - Public endpoint
- Returns all books without authentication

### Server Actions

#### 17. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/profile.ts`
- **Line 4:** Import `auth`
- **Line 14:** Get session in `updateKindleEmail`
- **Lines 16-18:** Return error if not authenticated
- **Line 27:** Update user's Kindle email in database
- **Line 49:** Get session in `getUserProfile`
- **Lines 51-53:** Return null if not authenticated

#### 18. `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/sendToKindle.ts`
- **Line 5:** Import `auth`
- **Line 10:** Get session
- **Lines 12-14:** Return error if not authenticated
- **Lines 24-37:** Check upload permission for sending to other users
- **Lines 59-75:** Get current user's Kindle email from database

---

## Protected Routes & Authorization

### Route Protection Strategy

This application uses **layout-based route protection** where authentication checks occur in layout components that wrap entire route segments.

### Public Routes

| Route | File | Authentication |
|-------|------|----------------|
| `/` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/page.tsx` | Optional (redirects if authenticated) |
| `/api/health` | Not analyzed | Assumed public |
| `/api/books` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/books/route.ts` | None |

### Protected Routes - Requires Authentication

| Route | Layout File | Auth Check Lines | Redirect Target |
|-------|-------------|------------------|-----------------|
| `/books/*` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/books/layout.tsx` | 12-16 | `/` |
| `/user/*` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/user/layout.tsx` | 12-16 | `/` |

**Pattern Used:**
```typescript
const session = await auth();
if (!session) {
  redirect("/");
}
```

### Protected Routes - Requires Upload Permission

| Route | Layout File | Auth Check Lines | Permission Check Lines | Redirect Target |
|-------|-------------|------------------|------------------------|-----------------|
| `/books/upload/*` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/books/upload/layout.tsx` | 9-13 | 15-17 | `/books` |

**Pattern Used:**
```typescript
const session = await auth();
if (!session) {
  redirect("/");
}
if (!session.user || !session.user.uploadPermission) {
  redirect("/books");
}
```

**Important Note:** The `uploadPermission` flag is NOT automatically populated in the session. This appears to be a bug or incomplete implementation, as the session callback in `config.ts` doesn't include this field.

### Protected API Routes

| Route | File | Auth Check | Permission Check |
|-------|------|------------|------------------|
| `/api/users/kindle-emails` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/users/kindle-emails/route.ts` | Lines 9-16 | Lines 18-31 (uploadPermission) |
| `/api/uploadthing/epubUploader` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/uploadthing/core.ts` | Lines 25-28 | None (authenticated users only) |

### Protected Server Actions

| Action | File | Auth Check |
|--------|------|------------|
| `updateKindleEmail` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/profile.ts` | Lines 14-18 |
| `getUserProfile` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/profile.ts` | Lines 49-53 |
| `sendToKindle` | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/sendToKindle.ts` | Lines 10-14 |

---

## Client-Side Authentication

### SessionProvider Setup

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/layout.tsx` (Lines 18-26)

```typescript
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <KindleEmailProvider>
        <html lang="en">
          <body>{children}</body>
        </html>
      </KindleEmailProvider>
    </SessionProvider>
  );
}
```

The `SessionProvider` wraps the entire application at the root layout level, making session data available to all client components.

### useSession Hook

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/TopBar.tsx` (Line 12)

```typescript
const { data: session } = useSession()
```

**Returns:**
- `session.user.id` - User's database ID
- `session.user.name` - User's name
- `session.user.email` - User's email
- `session.user.image` - User's profile image URL
- `session.user.uploadPermission` - Upload permission flag (may be undefined)

**Usage Pattern:**
```typescript
if (session && session.user) {
  // User is authenticated
  if (session.user.uploadPermission) {
    // User has admin privileges
  }
}
```

### Sign-In Action

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/SignInButton.tsx` (Line 3, 7)

```typescript
import { signIn } from "next-auth/react"

export default function SignInButton() {
  return (
    <button onClick={() => signIn()}>Sign in</button>
  );
}
```

**Behavior:**
- Redirects to Auth0 login page
- Returns to current page after authentication (by default)
- Can accept options: `signIn("auth0", { callbackUrl: "/books" })`

### Sign-Out Action

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/TopBar.tsx` (Line 48)

```typescript
import { signOut } from "next-auth/react"

<a href="#" onClick={(e) => {
  e.preventDefault();
  void signOut();
}}>
  Sign out
</a>
```

**Behavior:**
- Clears session from database
- Removes session cookie
- Redirects to homepage (by default)
- Can accept options: `signOut({ callbackUrl: "/" })`

### Client-Side Usage Locations

| Component/Context | File | Line | Usage |
|-------------------|------|------|-------|
| TopBar | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/TopBar.tsx` | 3, 12 | `useSession()`, `signOut()` |
| SignInButton | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/SignInButton.tsx` | 3, 7 | `signIn()` |
| KindleEmailContext | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_contexts/KindleEmailContext.tsx` | 4, 25 | `useSession()` |

---

## Server-Side Authentication

### auth() Function

The primary server-side authentication method is the `auth()` function exported from `/Users/alex/Development/DobsonDev/alexs-archive/src/server/auth/index.ts`.

**Signature:**
```typescript
const auth: () => Promise<Session | null>
```

**Returns:**
- `Session` object if authenticated
- `null` if not authenticated

**Session Object Structure:**
```typescript
{
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    uploadPermission?: boolean;
  },
  expires: string; // ISO 8601 date string
}
```

### Usage Patterns

#### 1. Route Protection (Redirect)

```typescript
const session = await auth();
if (!session) {
  redirect("/");
}
```

**Used in:**
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/books/layout.tsx` (Lines 12-16)
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/user/layout.tsx` (Lines 12-16)

#### 2. Permission Check (Redirect)

```typescript
const session = await auth();
if (!session || !session.user || !session.user.uploadPermission) {
  redirect("/books");
}
```

**Used in:**
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/books/upload/layout.tsx` (Lines 9-17)

#### 3. Conditional Redirect (Homepage)

```typescript
const session = await auth();
if (session) {
  redirect('/books');
}
```

**Used in:**
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/page.tsx` (Lines 6-10)

#### 4. API Route Authorization

```typescript
const session = await auth();
if (!session?.user?.email) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

**Used in:**
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/users/kindle-emails/route.ts` (Lines 9-16)

#### 5. Server Action Authorization

```typescript
const session = await auth();
if (!session?.user?.email) {
  return { success: false, message: 'You must be logged in' };
}
```

**Used in:**
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/profile.ts` (Lines 14-18, 49-53)
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/sendToKindle.ts` (Lines 10-14)

#### 6. Middleware (UploadThing)

```typescript
const session = await auth();
if (!session || !session.user) {
  throw new Error("Unauthorized");
}
```

**Used in:**
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/uploadthing/core.ts` (Lines 25-28)

### Server-Side Usage Locations

| Location | File | Lines | Purpose |
|----------|------|-------|---------|
| Homepage | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/page.tsx` | 6-10 | Redirect if authenticated |
| Books Layout | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/books/layout.tsx` | 12-16 | Require authentication |
| User Layout | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/user/layout.tsx` | 12-16 | Require authentication |
| Upload Layout | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/books/upload/layout.tsx` | 9-17 | Require authentication + permission |
| Kindle Emails API | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/users/kindle-emails/route.ts` | 9-16 | API authorization |
| UploadThing Core | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/uploadthing/core.ts` | 25-28 | Upload authorization |
| Profile Actions | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/profile.ts` | 14-18, 49-53 | Action authorization |
| Send to Kindle | `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/sendToKindle.ts` | 10-14 | Action authorization |

---

## Security Patterns

### 1. Environment Variable Validation

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/env.js`

All Auth0 credentials are validated at build time using Zod schemas:

```javascript
server: {
  AUTH_SECRET: process.env.NODE_ENV === "production"
    ? z.string()
    : z.string().optional(),
  AUTH0_CLIENT_ID: z.string(),
  AUTH0_CLIENT_SECRET: z.string(),
  AUTH0_ISSUER: z.string(),
}
```

**Benefits:**
- Build fails if required variables are missing
- Type-safe access to environment variables
- Empty strings treated as undefined
- Can skip validation with `SKIP_ENV_VALIDATION=true`

### 2. Session Token Storage

- Sessions stored in database, not JWT
- Session tokens stored in HTTP-only cookies
- Tokens are randomly generated UUIDs
- Expiration enforced at database level

**Table:** `alexs-archive_session`
**Token Column:** `session_token` (VARCHAR 255, PRIMARY KEY)
**Expiration Column:** `expires` (TIMESTAMP)

### 3. CSRF Protection

NextAuth.js includes built-in CSRF protection:
- CSRF tokens generated for state-changing operations
- Tokens validated on POST requests
- Double-submit cookie pattern

### 4. OAuth State Parameter

Auth0 provider automatically includes state parameter to prevent CSRF attacks during OAuth flow.

### 5. Authorization Patterns

#### Pattern A: Layout-Level Protection
```typescript
// Blocks entire route segments
const session = await auth();
if (!session) redirect("/");
```

**Pros:**
- Simple and effective
- Catches all pages in route segment
- Single source of truth

**Cons:**
- Less granular control
- Can't conditionally show/hide elements

#### Pattern B: Database Permission Check
```typescript
// Check actual database value for permissions
const user = await db.query.users.findFirst({
  where: eq(users.email, session.user.email),
  columns: { uploadPermission: true }
});

if (!user?.uploadPermission) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Used in:**
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/users/kindle-emails/route.ts` (Lines 18-31)
- `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/sendToKindle.ts` (Lines 24-37)

**Benefits:**
- Always checks current permission state
- Can't be bypassed by stale session data
- Supports real-time permission changes

### 6. User Input Validation

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/profile.ts` (Lines 9-11)

```typescript
const ProfileSchema = z.object({
  kindleEmail: z.string().email().optional().or(z.literal(''))
});
```

Server actions validate user input with Zod before database operations.

### 7. SQL Injection Prevention

All database queries use Drizzle ORM's query builder, which automatically sanitizes inputs:

```typescript
await db.update(users)
  .set({ kindleEmail: parsed.kindleEmail ?? null })
  .where(eq(users.email, session.user.email));
```

### 8. Rate Limiting

**Not Implemented** - No rate limiting detected on authentication endpoints or API routes.

**Recommendation:** Consider adding rate limiting for:
- `/api/auth/signin`
- `/api/uploadthing/*`
- Server actions (profile updates, send to Kindle)

---

## Custom Extensions

### 1. Upload Permission System

The application implements a custom permission system for upload privileges.

**Database Field:**
- Table: `alexs-archive_user`
- Column: `upload_permission` (BOOLEAN, DEFAULT false)
- Set in: `/Users/alex/Development/DobsonDev/alexs-archive/src/server/db/schema.ts` (Line 60)

**Default Value:**
```typescript
profile(profile) {
  return {
    // ...
    uploadPermission: false // Set to false by default
  };
}
```

**Usage Locations:**
1. **Client-side (TopBar)** - Show/hide upload link
   - File: `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_components/TopBar.tsx`
   - Line: 17
   - Check: `{session.user.uploadPermission && (...)}`

2. **Server-side (Upload Layout)** - Block route access
   - File: `/Users/alex/Development/DobsonDev/alexs-archive/src/app/books/upload/layout.tsx`
   - Lines: 15-17
   - Check: `if (!session.user || !session.user.uploadPermission) redirect("/books")`

3. **API Route (Kindle Emails)** - Restrict admin-only endpoint
   - File: `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/users/kindle-emails/route.ts`
   - Lines: 18-31
   - Check: Database query for `uploadPermission`

4. **Server Action (Send to Kindle)** - Allow sending to other users
   - File: `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/sendToKindle.ts`
   - Lines: 24-37
   - Check: Database query for `uploadPermission`

**Permission Grant Process:**
Permissions must be granted manually via database:
```sql
UPDATE "alexs-archive_user"
SET upload_permission = true
WHERE email = 'admin@example.com';
```

### 2. Kindle Email Integration

Custom field added to user table for Kindle device email addresses.

**Database Field:**
- Table: `alexs-archive_user`
- Column: `kindle_email` (VARCHAR 255, NULLABLE)
- Set in: `/Users/alex/Development/DobsonDev/alexs-archive/src/server/db/schema.ts` (Line 59)

**Management:**
- Users can set their Kindle email in profile settings
- File: `/Users/alex/Development/DobsonDev/alexs-archive/src/app/user/profile/page.tsx`
- Update action: `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/profile.ts`

**Usage:**
- Send books to user's own Kindle
- Admins can send books to other users' Kindle emails
- File: `/Users/alex/Development/DobsonDev/alexs-archive/src/app/_actions/sendToKindle.ts`

### 3. Admin User List

Admin users (with `uploadPermission`) can fetch list of all users with Kindle emails.

**Endpoint:** `GET /api/users/kindle-emails`
**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/users/kindle-emails/route.ts`

**Response:**
```typescript
[
  {
    name: string | null,
    email: string,
    kindleEmail: string
  },
  // ...
]
```

**Used by:** KindleEmailSelector component (admin feature)

### 4. Custom Session Caching

**File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/server/auth/index.ts` (Line 8)

```typescript
const auth = cache(uncachedAuth);
```

The `auth()` function is wrapped with React's `cache()` to:
- Deduplicate multiple auth checks in single request
- Improve performance in nested components
- Reduce database queries

**Example Benefit:**
If a layout calls `auth()` and a child component also calls `auth()`, only one database query executes.

---

## Key Findings & Observations

### Strengths

1. **Modern Architecture**
   - Uses NextAuth.js v5 (Auth.js) with Auth0
   - Leverages Next.js 15 App Router
   - Database-backed sessions for security
   - Type-safe with TypeScript

2. **Good Security Practices**
   - Environment variable validation
   - SQL injection prevention via ORM
   - HTTP-only session cookies
   - CSRF protection built-in

3. **Flexible Permission System**
   - Custom `uploadPermission` field
   - Granular access control
   - Admin features for user management

4. **Server-First Approach**
   - Authentication primarily server-side
   - Layout-level route protection
   - Server actions for mutations

### Potential Issues

1. **Session Callback Incomplete**
   - **File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/server/auth/config.ts` (Lines 61-69)
   - The session callback doesn't include `uploadPermission`
   - This field appears in TypeScript types but isn't populated
   - Components relying on `session.user.uploadPermission` may receive `undefined`

   **Current Code:**
   ```typescript
   callbacks: {
     session: ({ session, user }) => ({
       ...session,
       user: {
         ...session.user,
         id: user.id,
         // uploadPermission NOT included here
       },
     }),
   },
   ```

   **Expected Fix:**
   ```typescript
   callbacks: {
     session: ({ session, user }) => ({
       ...session,
       user: {
         ...session.user,
         id: user.id,
         uploadPermission: (user as any).uploadPermission ?? false,
       },
     }),
   },
   ```

2. **Inconsistent Permission Checks**
   - Some routes check `session.user.uploadPermission` (client session)
   - Others query database for current permission value
   - Could lead to authorization bypass if session is stale

3. **No Rate Limiting**
   - Authentication endpoints not rate-limited
   - Could be vulnerable to brute force attacks
   - File upload endpoint not rate-limited

4. **Public Books API**
   - **File:** `/Users/alex/Development/DobsonDev/alexs-archive/src/app/api/books/route.ts`
   - Returns all books without authentication
   - May be intentional but worth noting

5. **No Middleware Protection**
   - No Next.js middleware file detected
   - All route protection happens in layouts
   - Could add middleware for centralized auth logic

### Recommendations

1. **Fix Session Callback**
   - Add `uploadPermission` to session callback
   - Or remove from TypeScript types and always query database

2. **Add Rate Limiting**
   - Use middleware or edge functions
   - Limit auth endpoints, file uploads, and server actions

3. **Implement Middleware**
   - Create `/middleware.ts` for centralized auth
   - Can replace some layout-level checks

4. **Add Logging**
   - Log authentication events
   - Track permission checks for audit trail

5. **Document Permission Grant**
   - Create admin interface or script
   - Document SQL command for granting permissions

---

## Testing Checklist

### Authentication Flow
- [ ] Sign in with Auth0 redirects properly
- [ ] Auth0 callback creates user in database
- [ ] Session persists across page navigations
- [ ] Sign out clears session
- [ ] Sign out redirects to homepage

### Route Protection
- [ ] Unauthenticated users redirected from `/books`
- [ ] Unauthenticated users redirected from `/user`
- [ ] Users without permission redirected from `/books/upload`
- [ ] Authenticated users can access `/books`
- [ ] Authenticated users redirected from `/` to `/books`

### API Security
- [ ] `/api/users/kindle-emails` returns 401 when not authenticated
- [ ] `/api/users/kindle-emails` returns 403 when user lacks permission
- [ ] `/api/uploadthing` rejects unauthenticated uploads

### Server Actions
- [ ] `updateKindleEmail` rejects unauthenticated requests
- [ ] `getUserProfile` returns null when not authenticated
- [ ] `sendToKindle` rejects unauthenticated requests
- [ ] `sendToKindle` checks permission when sending to others

### Client Components
- [ ] TopBar shows user info when authenticated
- [ ] TopBar hides when not authenticated
- [ ] Upload link only visible with permission
- [ ] Sign out button triggers logout

---

## Additional Files Referenced

### Documentation
- `/Users/alex/Development/DobsonDev/alexs-archive/docs/authentication.md` - Auth0 setup guide
- `/Users/alex/Development/DobsonDev/alexs-archive/CLAUDE.md` - Project instructions
- `/Users/alex/Development/DobsonDev/alexs-archive/README.md` - Project overview

### Configuration
- `/Users/alex/Development/DobsonDev/alexs-archive/.env.example` - Environment variable template
- `/Users/alex/Development/DobsonDev/alexs-archive/package.json` - Dependency versions

### Dependencies
- `next-auth`: 5.0.0-beta.25
- `@auth/drizzle-adapter`: ^1.7.2
- `drizzle-orm`: ^0.33.0
- `next`: ^15.0.1

---

## Summary

This Next.js application implements a robust authentication system using NextAuth.js v5 with Auth0 as the OAuth provider. The architecture follows modern best practices with:

- **Server-first authentication** using React Server Components
- **Database-backed sessions** for enhanced security
- **Custom permission system** for upload/admin privileges
- **Layout-based route protection** for clean code organization
- **Type-safe environment validation** to prevent misconfigurations

The main areas for improvement are:
1. Completing the session callback to include `uploadPermission`
2. Adding rate limiting to auth endpoints
3. Considering Next.js middleware for centralized auth logic

Overall, the implementation is solid and production-ready with minor refinements needed.
