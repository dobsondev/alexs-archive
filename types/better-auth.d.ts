import type { Session as BetterAuthSession, User as BetterAuthUser } from "better-auth";

declare module "better-auth" {
  interface User extends BetterAuthUser {
    uploadPermission: boolean;
    kindleEmail: string | null;
    isAdmin: boolean;
  }

  interface Session extends BetterAuthSession {
    user: User;
  }
}
