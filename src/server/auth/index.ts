import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    autoSignIn: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  user: {
    additionalFields: {
      uploadPermission: {
        type: "boolean",
        defaultValue: false,
        required: false,
      },
      isAdmin: {
        type: "boolean",
        defaultValue: false,
        required: false,
      },
      kindleEmail: {
        type: "string",
        required: false,
      },
    },
  },

  advanced: {
    cookiePrefix: "alexs-archive",
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  trustedOrigins: async (request: Request) => {
    const url = new URL(request.url);
    const origin = url.origin;

    // Local development
    if (origin === "http://localhost:3000") return [origin];

    // Production URL
    if (process.env.BETTER_AUTH_URL && origin === process.env.BETTER_AUTH_URL) {
      return [origin];
    }

    // Netlify preview deployments: *-alexs-archive.netlify.app
    if (origin.endsWith("-alexs-archive.netlify.app")) {
      return [origin];
    }

    return [];
  },
});

// Export types for TypeScript
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
