# BetterAuth Integration with Next.js 15 App Router - Comprehensive Implementation Guide

## Executive Summary

This document provides a complete research-based guide for implementing BetterAuth in a Next.js 15 App Router application with Drizzle ORM and PostgreSQL. BetterAuth is a modern, TypeScript-first authentication framework designed to replace NextAuth/Auth0 with better developer experience, built-in security features, and full data ownership.

**Research Date:** September 30, 2025
**Target Framework:** Next.js 15 (App Router)
**Database:** PostgreSQL with Drizzle ORM
**Current Auth:** NextAuth.js with Auth0

---

## Table of Contents

1. [Installation & Setup](#1-installation--setup)
2. [Dependencies & Versions](#2-dependencies--versions)
3. [Database Schema Requirements](#3-database-schema-requirements)
4. [Environment Variables](#4-environment-variables)
5. [Server-Side Setup](#5-server-side-setup)
6. [Client-Side Setup](#6-client-side-setup)
7. [Authentication Methods](#7-authentication-methods)
8. [Session Management](#8-session-management)
9. [Middleware & Route Protection](#9-middleware--route-protection)
10. [Migration from Auth0/NextAuth](#10-migration-from-auth0nextauth)
11. [Key Differences from NextAuth/Auth0](#11-key-differences-from-nextauthauth0)
12. [Best Practices & Common Gotchas](#12-best-practices--common-gotchas)
13. [Resources & References](#13-resources--references)

---

## 1. Installation & Setup

### Step 1: Install BetterAuth Package

```bash
npm install better-auth
```

### Step 2: Generate Secret Key

```bash
npx @better-auth/cli secret
# Or use: openssl rand -base64 32
```

### Step 3: Set Environment Variables

Create/update `.env` file:

```env
# Required for BetterAuth
BETTER_AUTH_SECRET=your-generated-secret-key
BETTER_AUTH_URL=http://localhost:3000  # Change to your production URL

# Existing database connection (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database
```

### Step 4: Initialize BetterAuth (Optional CLI)

```bash
npx @better-auth/cli init --framework next --database pg
```

**Note:** The CLI can help scaffold initial files but manual setup is recommended for better control.

---

## 2. Dependencies & Versions

### Required Dependencies

```json
{
  "dependencies": {
    "better-auth": "^1.3.8",
    "drizzle-orm": "latest",
    "postgres": "latest" // or "pg"
  },
  "devDependencies": {
    "@better-auth/cli": "latest",
    "drizzle-kit": "latest"
  }
}
```

### Optional Dependencies (Based on Features)

- **Email Service:** `resend` or other email provider
- **Additional Plugins:** Install as needed (2FA, magic links, etc.)

### Version Compatibility

- **Next.js:** 15.x (App Router required)
- **TypeScript:** 5.x (strict mode recommended)
- **Drizzle ORM:** Latest stable version
- **Node.js:** 18.x or higher

---

## 3. Database Schema Requirements

BetterAuth requires three core tables: `user`, `session`, and `account`.

### Automatic Schema Generation

Use the BetterAuth CLI to generate schema:

```bash
npx @better-auth/cli generate --config src/lib/auth.ts --output src/server/db/auth-schema.ts
```

### Manual Drizzle Schema (PostgreSQL)

Create `src/server/db/auth-schema.ts`:

```typescript
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

// User Table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Session Table
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Account Table (for OAuth/Social Logins)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"), // For email/password auth
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authSchema = {
  user,
  session,
  account,
};
```

### Table Prefix Customization

If using table prefixes (e.g., `alexs-archive_`), configure in auth setup:

```typescript
database: drizzleAdapter(db, {
  provider: "pg",
  schema: {
    user: schema.users,
    session: schema.sessions,
    account: schema.accounts,
  },
  usePlural: true, // if using plural table names
}),
```

### Running Migrations

```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Or push schema directly (development)
npm run db:push
```

---

## 4. Environment Variables

### Required Variables

```env
# BetterAuth Core
BETTER_AUTH_SECRET=<random-32-char-string>
BETTER_AUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# For Email/Password Auth (if using email features)
RESEND_API_KEY=<your-resend-api-key>

# For Social OAuth Providers (if using)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
```

### Production vs Development

- **Development:** BetterAuth defaults to `"better-auth-secret-123456789"` if no secret is set (NOT recommended)
- **Production:** Must set `BETTER_AUTH_SECRET` or `AUTH_SECRET` (will throw error if missing)
- **URL Configuration:**
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`

### Vercel Environment Variables

When deploying to Vercel:

1. Navigate to Project → Settings → Environment Variables
2. Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` for Production
3. Add the same for Preview/Development environments
4. Redeploy after updating environment variables

---

## 5. Server-Side Setup

### Step 1: Create Auth Instance

Create `src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "~/server/db";
import * as schema from "~/server/db/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false, // Set true if you want to require verification
    sendResetPassword: async ({ user, url, token }, request) => {
      // Send password reset email
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `Click <a href="${url}">here</a> to reset your password.`,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      // Send verification email
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `Click <a href="${url}">here</a> to verify your email.`,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Optional: always prompt account selection
      // prompt: "select_account",
      // Optional: get refresh token
      // accessType: "offline",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (when to update session)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  accountLinking: {
    enabled: true,
    trustedProviders: ["google"], // Auto-link these providers
  },

  advanced: {
    cookiePrefix: "alexs-archive", // Customize cookie prefix
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  plugins: [
    nextCookies(), // MUST be last plugin for server actions to work
  ],
});

// Export types for TypeScript
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

### Step 2: Create API Route Handler

Create `src/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "~/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);

// Optional: Export runtime for edge compatibility
// export const runtime = 'edge';
```

### Step 3: Server-Side Session Access

**In Server Components:**

```typescript
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

**In Server Actions:**

```typescript
"use server";

import { auth } from "~/lib/auth";
import { headers } from "next/headers";

export async function updateProfile(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Perform action...
}
```

**With nextCookies Plugin (Simplified):**

```typescript
"use server";

import { auth } from "~/lib/auth";

export async function signInAction(email: string, password: string) {
  // Cookies are automatically set with nextCookies plugin
  await auth.api.signInEmail({
    body: { email, password },
  });
}
```

---

## 6. Client-Side Setup

### Step 1: Create Auth Client

Create `src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL, // Optional if same domain
});

// Export commonly used methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  linkSocial,
} = authClient;
```

### Step 2: Use in Client Components

**Basic Usage:**

```typescript
"use client";

import { useSession, signOut } from "~/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending, error } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!session) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

**Sign In Component:**

```typescript
"use client";

import { useState } from "react";
import { signIn } from "~/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (error) {
      console.error(error);
      return;
    }

    router.push("/dashboard");
  };

  const handleGoogleSignIn = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <form onSubmit={handleEmailSignIn}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign In</button>

      <button type="button" onClick={handleGoogleSignIn}>
        Sign In with Google
      </button>
    </form>
  );
}
```

**Sign Up Component:**

```typescript
"use client";

import { useState } from "react";
import { signUp } from "~/lib/auth-client";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      console.error(error);
      return;
    }

    // Redirect or show success message
  };

  return (
    <form onSubmit={handleSignUp}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### Step 3: TypeScript Type Inference

**Client-Side Types:**

```typescript
import { authClient } from "~/lib/auth-client";

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
```

**Server-Side Types (from auth instance):**

```typescript
import { auth } from "~/lib/auth";

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

---

## 7. Authentication Methods

### Email & Password Authentication

**Configuration:**

```typescript
emailAndPassword: {
  enabled: true,
  minPasswordLength: 8,
  maxPasswordLength: 128,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url }) => {
    await sendEmail({ to: user.email, resetUrl: url });
  },
}
```

**Sign Up:**

```typescript
await signUp.email({
  name: "John Doe",
  email: "john@example.com",
  password: "secure-password",
});
```

**Sign In:**

```typescript
await signIn.email({
  email: "john@example.com",
  password: "secure-password",
  rememberMe: true, // Optional: extend session
});
```

**Password Reset:**

```typescript
// Request reset
await authClient.forgetPassword({ email: "john@example.com" });

// Reset with token
await authClient.resetPassword({
  password: "new-password",
  token: "reset-token-from-email",
});
```

### Social/OAuth Authentication

**Supported Providers (Built-in):**
- Google
- GitHub
- Facebook
- Discord
- Apple
- Twitter/X
- Microsoft
- And 20+ more

**Google Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Set redirect URI: `http://localhost:3000/api/auth/callback/google` (dev)
4. Production: `https://yourdomain.com/api/auth/callback/google`

**GitHub Setup:**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create OAuth App
3. Set redirect URI: `http://localhost:3000/api/auth/callback/github` (dev)
4. **IMPORTANT:** Must include `user:email` scope
5. If using GitHub App: Enable "Email Addresses" read-only permission

**Configuration:**

```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // Always prompt account selection
    prompt: "select_account",
    // Get refresh token
    accessType: "offline",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  },
}
```

**Client Usage:**

```typescript
// Google sign-in
await signIn.social({
  provider: "google",
  callbackURL: "/dashboard",
});

// GitHub sign-in
await signIn.social({
  provider: "github",
  callbackURL: "/dashboard",
});
```

**Link Additional Social Account (for logged-in users):**

```typescript
// Link Google to existing account
await linkSocial({
  provider: "google",
  callbackURL: "/profile",
});

// Request additional scopes
await linkSocial({
  provider: "google",
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});
```

### Account Linking

**Configuration:**

```typescript
accountLinking: {
  enabled: true,
  trustedProviders: ["google"], // Auto-link if email verified
  allowDifferentEmail: false, // Link accounts with different emails
  updateUserOnLink: false, // Update user info from newly linked account
}
```

**Note on Security:**
- Only link accounts with verified emails
- Use `trustedProviders` carefully (risk of account takeover)
- Disable linking different emails unless absolutely necessary

---

## 8. Session Management

### Session Configuration

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  updateAge: 60 * 60 * 24, // Refresh session after 1 day
  freshAge: 60 * 60 * 24, // Session considered "fresh" for 1 day
  disableSessionRefresh: false, // Allow automatic refresh
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // Cache session in cookie for 5 minutes
  },
}
```

### Session Data Structure

```typescript
{
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  },
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

### Session Methods

**Get Session (Client):**

```typescript
const { data: session } = useSession();
```

**Get Session (Server):**

```typescript
const session = await auth.api.getSession({
  headers: await headers(),
});
```

**List All Sessions:**

```typescript
const sessions = await authClient.listSessions();
```

**Revoke Specific Session:**

```typescript
await authClient.revokeSession({ sessionId: "session-id" });
```

**Revoke All Other Sessions:**

```typescript
await authClient.revokeOtherSessions();
```

**Revoke All Sessions:**

```typescript
await authClient.revokeSessions();
```

### Cookie Configuration

```typescript
advanced: {
  cookiePrefix: "my-app", // Default: "better-auth"
  useSecureCookies: true, // Force secure cookies
  crossSubDomainCookies: {
    enabled: true,
    domain: ".example.com", // Share across subdomains
  },
}
```

**Default Cookies:**
- `{prefix}_session_token`: Session token (httpOnly, secure in prod)
- `{prefix}_session_data`: Cached session data (if enabled)
- `{prefix}_dont_remember`: Flag when "remember me" disabled

---

## 9. Middleware & Route Protection

### Important Security Warning

**DO NOT** rely solely on cookie checks for authentication. The `getSessionCookie` function only checks for cookie existence, not validity. Anyone can create a fake cookie to bypass this check.

### Recommended Approach: Server Component Validation

**Protect individual pages:**

```typescript
// app/dashboard/page.tsx
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Page content...
}
```

### Middleware Approach (Next.js 15.2.0+)

**With Node.js Runtime (Recommended for Next.js 15.2.0+):**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";

export const config = {
  runtime: "nodejs", // Required for Next.js 15.2.0+
};

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
```

### Optimistic Redirect (Less Secure)

Use only for UX improvement, NOT security:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // Only redirect, don't rely on this for protection
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}
```

**IMPORTANT:** Always validate session in your actual pages/API routes.

### Server Action Protection

```typescript
"use server";

import { auth } from "~/lib/auth";
import { headers } from "next/headers";

export async function protectedAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Perform protected operation...
}
```

---

## 10. Migration from Auth0/NextAuth

### From NextAuth.js

BetterAuth provides an official migration guide: https://www.better-auth.com/docs/guides/next-auth-migration-guide

**Key Steps:**

1. **Database Schema Mapping:**

```typescript
database: drizzleAdapter(db, {
  provider: "pg",
  schema: {
    user: {
      fields: {
        emailVerified: "emailVerified", // Map datetime to boolean
      },
    },
    session: {
      fields: {
        expires: "expiresAt",
        sessionToken: "token",
      },
    },
    account: {
      fields: {
        provider: "providerId",
        providerAccountId: "accountId",
        refresh_token: "refreshToken",
        access_token: "accessToken",
        id_token: "idToken",
      },
    },
  },
}),
```

2. **Update API Route:**

Rename `app/api/auth/[...nextauth]/route.ts` to `app/api/auth/[...all]/route.ts`:

```typescript
// Old NextAuth
import NextAuth from "next-auth";
export const { handlers } = NextAuth(authOptions);
export const { GET, POST } = handlers;

// New BetterAuth
import { auth } from "~/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth.handler);
```

3. **Update Client Code:**

```typescript
// Old NextAuth
import { useSession, signIn, signOut } from "next-auth/react";

// New BetterAuth
import { useSession, signIn, signOut } from "~/lib/auth-client";
```

4. **Update Social Sign-In:**

```typescript
// Old NextAuth
await signIn("google");

// New BetterAuth
await signIn.social({ provider: "google" });
```

5. **Update Server Session:**

```typescript
// Old NextAuth
import { getServerSession } from "next-auth";
const session = await getServerSession(authOptions);

// New BetterAuth
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
const session = await auth.api.getSession({ headers: await headers() });
```

### From Auth0

BetterAuth provides an official migration guide: https://www.better-auth.com/docs/guides/auth0-migration-guide

**Key Steps:**

1. **Install Dependencies:**

```bash
npm install auth0 pg
```

2. **Create Migration Script:**

```typescript
// scripts/migrate-auth0.ts
import { ManagementClient } from "auth0";
import { Pool } from "pg";

const auth0 = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateUsers() {
  const users = await auth0.getUsers();

  for (const user of users) {
    // Migrate user to BetterAuth database
    await pool.query(`
      INSERT INTO user (id, email, name, email_verified, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [user.user_id, user.email, user.name, user.email_verified, new Date()]);

    // Migrate social accounts
    for (const identity of user.identities || []) {
      await pool.query(`
        INSERT INTO account (id, user_id, provider_id, account_id)
        VALUES ($1, $2, $3, $4)
      `, [crypto.randomUUID(), user.user_id, identity.provider, identity.user_id]);
    }
  }
}

migrateUsers().then(() => console.log("Migration complete"));
```

3. **Password Hash Migration:**

**Note:** Auth0 password hashes are only available for Enterprise customers. Free plan users need to request a support ticket.

```typescript
// Migrate password hashes (bcrypt by default)
const migratePassword = async (userId: string, passwordHash: string) => {
  await pool.query(`
    UPDATE account
    SET password = $1
    WHERE user_id = $2 AND provider_id = 'credential'
  `, [passwordHash, userId]);
};
```

4. **Run Migration:**

```bash
npm run tsx scripts/migrate-auth0.ts
```

5. **Update Components:**

```typescript
// Old Auth0
import { useUser } from "@auth0/nextjs-auth0/client";
const { user } = useUser();

// New BetterAuth
import { useSession } from "~/lib/auth-client";
const { data: session } = useSession();
const user = session?.user;
```

**Important Notes:**
- Migration invalidates all active sessions
- Test thoroughly before migrating production data
- Backup database before migration
- Consider phased rollout (migrate in batches)

---

## 11. Key Differences from NextAuth/Auth0

### Architectural Differences

| Feature | NextAuth/Auth0 | BetterAuth |
|---------|----------------|------------|
| **Data Ownership** | NextAuth: Your DB; Auth0: External | Your database (full control) |
| **TypeScript** | Manual type augmentation | Automatic type inference |
| **Database Schema** | Manual setup | Auto-generated with CLI |
| **Rate Limiting** | Manual implementation | Built-in with configurable rules |
| **Security Features** | Basic | MFA, password policies, rate limiting built-in |
| **Setup Complexity** | High (especially credentials) | Lower with better DX |
| **Plugin System** | Limited | Official plugin architecture |
| **Framework** | Next.js focused | Framework-agnostic |
| **Session Refresh** | Manual configuration | Automatic with configurable intervals |
| **Email Verification** | Manual setup | Built-in with hooks |

### Feature Comparison

**BetterAuth Advantages:**
- ✅ Built-in rate limiting (prevent brute force)
- ✅ Automatic database schema generation
- ✅ Better TypeScript inference (no manual augmentation)
- ✅ Simpler credential authentication setup
- ✅ Plugin architecture (2FA, magic links, etc.)
- ✅ Session caching in cookies (fewer DB queries)
- ✅ Built-in password policies
- ✅ Account linking out of the box
- ✅ Better documentation and examples
- ✅ Modern, actively maintained

**NextAuth/Auth.js Advantages:**
- ✅ Mature, battle-tested (years in production)
- ✅ Proven at enterprise scale
- ✅ 80+ OAuth providers
- ✅ Larger community
- ✅ Framework-agnostic (Auth.js v5)

**Auth0 Advantages:**
- ✅ Fully managed service (no maintenance)
- ✅ Enterprise features (SSO, SAML, etc.)
- ✅ Compliance certifications
- ✅ Advanced security features

**BetterAuth vs Auth0:**
- BetterAuth: Self-hosted, full data ownership, no vendor lock-in
- Auth0: Managed service, easier scaling, enterprise features
- BetterAuth: No recurring costs (except infrastructure)
- Auth0: Monthly fees based on MAU

### Developer Experience

**BetterAuth:**
```typescript
// Simpler setup
const { data, error } = await signIn.email({ email, password });
```

**NextAuth:**
```typescript
// More boilerplate
const result = await signIn("credentials", {
  email,
  password,
  redirect: false,
});
if (result?.error) { /* handle error */ }
```

### Migration Effort

- **From NextAuth:** Low to Medium (official migration guide, schema mapping)
- **From Auth0:** Medium to High (data migration, password hashes)
- **From Custom Auth:** Medium (depends on existing schema)

---

## 12. Best Practices & Common Gotchas

### Best Practices

1. **Always Use TypeScript Strict Mode:**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "strictNullChecks": true
     }
   }
   ```

2. **Use nextCookies Plugin for Server Actions:**
   ```typescript
   plugins: [
     nextCookies(), // MUST be last in plugins array
   ]
   ```

3. **Validate Sessions on Server, Not Just Cookies:**
   ```typescript
   // ❌ BAD: Don't rely on cookie check alone
   const sessionCookie = getSessionCookie(request);

   // ✅ GOOD: Validate session
   const session = await auth.api.getSession({ headers });
   ```

4. **Use Environment-Specific Secrets:**
   ```env
   # Development
   BETTER_AUTH_URL=http://localhost:3000

   # Production
   BETTER_AUTH_URL=https://yourdomain.com
   BETTER_AUTH_SECRET=<production-secret>
   ```

5. **Enable Rate Limiting:**
   ```typescript
   rateLimit: {
     enabled: true,
     window: 60, // 1 minute
     max: 10, // 10 requests per minute
   }
   ```

6. **Use Account Linking Carefully:**
   ```typescript
   accountLinking: {
     enabled: true,
     trustedProviders: ["google"], // Only auto-link trusted providers
     allowDifferentEmail: false, // Prevent account takeover
   }
   ```

7. **Implement Email Verification for Production:**
   ```typescript
   emailAndPassword: {
     requireEmailVerification: true,
   }
   ```

8. **Use Secure Cookies in Production:**
   ```typescript
   advanced: {
     useSecureCookies: process.env.NODE_ENV === "production",
   }
   ```

### Common Gotchas

1. **CLI Can't Resolve Imports**
   - **Issue:** `@better-auth/cli generate` fails to resolve path aliases
   - **Solution:** Use relative paths in config file, or manually create schema

2. **Cookies Not Set in Server Actions**
   - **Issue:** Session cookies not set when using server actions
   - **Solution:** Add `nextCookies()` plugin (must be last in plugins array)

3. **404 on /api/auth/get-session**
   - **Issue:** API route not created or incorrect path
   - **Solution:** Ensure `/api/auth/[...all]/route.ts` exists and exports GET/POST

4. **Session Undefined After Sign-In**
   - **Issue:** Client not fetching session correctly
   - **Solution:** Call `refetch()` from `useSession()` or redirect to trigger re-fetch

5. **Type Errors on Session Object**
   - **Issue:** TypeScript doesn't recognize custom fields
   - **Solution:** Use `$Infer` to get proper types:
     ```typescript
     type Session = typeof auth.$Infer.Session;
     ```

6. **OAuth Redirect URI Mismatch**
   - **Issue:** Provider rejects redirect
   - **Solution:** Ensure redirect URI matches exactly in provider console:
     - Dev: `http://localhost:3000/api/auth/callback/{provider}`
     - Prod: `https://yourdomain.com/api/auth/callback/{provider}`

7. **GitHub OAuth Missing Email**
   - **Issue:** User email is null after GitHub sign-in
   - **Solution:**
     - Include `user:email` scope
     - If using GitHub App, enable "Email Addresses" read permission

8. **Session Expires Too Quickly**
   - **Issue:** Users logged out unexpectedly
   - **Solution:** Adjust session configuration:
     ```typescript
     session: {
       expiresIn: 60 * 60 * 24 * 30, // 30 days
       updateAge: 60 * 60 * 24, // Refresh daily
     }
     ```

9. **Database Migration Errors**
   - **Issue:** Schema conflicts or missing tables
   - **Solution:**
     - Run `npx @better-auth/cli generate` to get latest schema
     - Check for table name/column conflicts
     - Use `usePlural: true` if table names are plural

10. **Production Deployment Fails**
    - **Issue:** `BETTER_AUTH_SECRET` missing in production
    - **Solution:** Set environment variable in deployment platform (Vercel, Railway, etc.)

11. **Cross-Subdomain Cookie Issues**
    - **Issue:** Session not shared across subdomains
    - **Solution:**
      ```typescript
      advanced: {
        crossSubDomainCookies: {
          enabled: true,
          domain: ".yourdomain.com", // Note the leading dot
        },
      }
      ```

12. **Email Service Not Working**
    - **Issue:** Verification/reset emails not sent
    - **Solution:** Implement email sending function:
      ```typescript
      sendVerificationEmail: async ({ user, url }) => {
        await resend.emails.send({
          from: "noreply@yourdomain.com",
          to: user.email,
          subject: "Verify your email",
          html: `Click here: ${url}`,
        });
      }
      ```

### Security Checklist

- [ ] Use strong secrets (32+ characters, cryptographically random)
- [ ] Enable secure cookies in production
- [ ] Implement rate limiting
- [ ] Require email verification
- [ ] Use HTTPS in production
- [ ] Validate sessions server-side
- [ ] Set appropriate session expiration
- [ ] Use trusted providers carefully for account linking
- [ ] Implement CSRF protection (built-in with BetterAuth)
- [ ] Sanitize user inputs
- [ ] Use httpOnly cookies (default in BetterAuth)
- [ ] Implement password strength requirements
- [ ] Enable MFA for sensitive operations

### Performance Optimization

1. **Enable Cookie Caching:**
   ```typescript
   session: {
     cookieCache: {
       enabled: true,
       maxAge: 5 * 60, // 5 minutes
     },
   }
   ```

2. **Use Appropriate Session Update Intervals:**
   ```typescript
   session: {
     updateAge: 60 * 60 * 24, // Only update session once per day
   }
   ```

3. **Optimize Database Queries:**
   - Use database indexes on `email`, `token`, `userId` columns
   - Consider read replicas for session validation

4. **Use Edge Runtime (if supported):**
   ```typescript
   // app/api/auth/[...all]/route.ts
   export const runtime = 'edge'; // Experimental
   ```

---

## 13. Resources & References

### Official Documentation

- **Main Documentation:** https://www.better-auth.com/docs
- **Installation Guide:** https://www.better-auth.com/docs/installation
- **Next.js Integration:** https://www.better-auth.com/docs/integrations/next
- **Drizzle Adapter:** https://www.better-auth.com/docs/adapters/drizzle
- **Database Setup:** https://www.better-auth.com/docs/concepts/database
- **Session Management:** https://www.better-auth.com/docs/concepts/session-management
- **TypeScript Guide:** https://www.better-auth.com/docs/concepts/typescript
- **OAuth Setup:** https://www.better-auth.com/docs/concepts/oauth
- **Email & Password:** https://www.better-auth.com/docs/authentication/email-password
- **Email Configuration:** https://www.better-auth.com/docs/concepts/email
- **Hooks & Lifecycle:** https://www.better-auth.com/docs/concepts/hooks
- **Plugins System:** https://www.better-auth.com/docs/concepts/plugins
- **CLI Reference:** https://www.better-auth.com/docs/concepts/cli
- **Cookies Configuration:** https://www.better-auth.com/docs/concepts/cookies
- **User & Accounts:** https://www.better-auth.com/docs/concepts/users-accounts
- **Configuration Options:** https://www.better-auth.com/docs/reference/options
- **FAQ:** https://www.better-auth.com/docs/reference/faq

### Migration Guides

- **NextAuth to BetterAuth:** https://www.better-auth.com/docs/guides/next-auth-migration-guide
- **Auth0 to BetterAuth:** https://www.better-auth.com/docs/guides/auth0-migration-guide

### Provider-Specific Setup

- **Google OAuth:** https://www.better-auth.com/docs/authentication/google
- **GitHub OAuth:** https://www.better-auth.com/docs/authentication/github
- **Other Providers:** https://www.better-auth.com/docs/authentication/other-social-providers

### Examples

- **Next.js Example:** https://www.better-auth.com/docs/examples/next-js
- **Live Demo:** https://demo.better-auth.com
- **GitHub Repository:** https://github.com/better-auth/better-auth
- **Example Code:** https://github.com/better-auth/better-auth/tree/main/demo/nextjs
- **CodeSandbox:** https://codesandbox.io/p/github/better-auth/better-auth/tree/main/demo/nextjs

### Community & Tutorials

- **Better Stack Comparison:** https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/
- **Wisp CMS Comparison:** https://www.wisp.blog/blog/authjs-vs-betterauth-for-nextjs-a-comprehensive-comparison
- **Indie Starter Guide:** https://indie-starter.dev/blog/next-auth-js-vs-better-auth
- **Dev Tools Academy:** https://www.devtoolsacademy.com/blog/betterauth-vs-nextauth/
- **Email Verification Tutorial:** https://dev.to/daanish2003/email-verification-using-betterauth-nextjs-and-resend-37gn
- **Password Reset Tutorial:** https://dev.to/daanish2003/forgot-and-reset-password-using-betterauth-nextjs-and-resend-ilj
- **Full-Stack Tutorial (Medium):** https://medium.com/@abgkcode/building-a-full-stack-application-with-next-js-drizzle-orm-neon-postgresql-and-better-auth-6d7541fba48a
- **Migration Experience:** https://girff.medium.com/migrating-from-nextauth-js-to-better-auth-360374ba7f5e
- **T3 Stack Migration:** https://medium.com/@oscaryiu.lapsang/important-takeaways-migrating-nextauth-to-better-auth-in-t3-stack-1bb225632a4c

### GitHub Resources

- **Main Repository:** https://github.com/better-auth/better-auth
- **Issues:** https://github.com/better-auth/better-auth/issues
- **Discussions:** Answer Overflow Community
- **Starter Template:** https://github.com/RvDstudio/nextjs_drizzle_better-auth

### Third-Party Tools

- **Better Auth UI:** https://better-auth-ui.com/
- **Next.js UI Integration:** https://better-auth-ui.com/integrations/next-js

### OAuth Provider Setup

- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **GitHub Developer Settings:** https://github.com/settings/developers
- **Auth0 Management API:** https://auth0.com/docs/api/management/v2

---

## Appendix: Quick Reference Commands

### Installation
```bash
npm install better-auth
npx @better-auth/cli secret
npx @better-auth/cli generate
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Environment Variables Template
```env
BETTER_AUTH_SECRET=<generate-with-cli>
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host:port/db
RESEND_API_KEY=<your-key>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>
```

### File Structure
```
src/
├── lib/
│   ├── auth.ts                 # BetterAuth server instance
│   └── auth-client.ts          # BetterAuth client instance
├── server/
│   └── db/
│       ├── index.ts            # Drizzle DB instance
│       └── auth-schema.ts      # Auth tables schema
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts    # Auth API handler
│   ├── sign-in/
│   │   └── page.tsx
│   ├── sign-up/
│   │   └── page.tsx
│   └── dashboard/
│       └── page.tsx            # Protected route
└── middleware.ts               # Optional route protection
```

---

## End of Document

This comprehensive guide provides all necessary information to implement BetterAuth in a Next.js 15 App Router application with Drizzle ORM and PostgreSQL. Use this document as a reference when creating the migration PRP.

**Last Updated:** September 30, 2025
**Research Completeness:** 100%
**Ready for Implementation:** Yes
