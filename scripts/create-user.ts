import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import dotenv from "dotenv";
import { hashPassword } from "better-auth/crypto";

dotenv.config();

// Create direct database connection without env validation
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

interface UserOptions {
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  uploadPermission?: boolean;
  kindleEmail?: string;
}

async function createUser(options: UserOptions) {
  const { name, email, password, isAdmin = false, uploadPermission = false, kindleEmail = null } = options;

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (existingUser) {
    console.error(`User with email ${email} already exists`);
    process.exit(1);
  }

  // Hash the password using BetterAuth's built-in function
  const hashedPassword = await hashPassword(password);

  // Create the user
  const userId = crypto.randomUUID();

  await db.insert(schema.users).values({
    id: userId,
    name,
    email,
    emailVerified: true, // Auto-verify since admin is creating
    image: null,
    kindleEmail,
    uploadPermission,
    isAdmin,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create the account entry with the hashed password
  await db.insert(schema.accounts).values({
    id: crypto.randomUUID(),
    accountId: email, // Use email as accountId for email/password auth
    providerId: "credential", // BetterAuth uses "credential" for email/password
    userId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`✅ User created successfully:`);
  console.log(`   Name: ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   Admin: ${isAdmin}`);
  console.log(`   Upload Permission: ${uploadPermission}`);
  if (kindleEmail) {
    console.log(`   Kindle Email: ${kindleEmail}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error("Usage: npm run create-user -- <name> <email> <password> [--admin] [--upload] [--kindle=email@kindle.com]");
  console.error("\nExample:");
  console.error("  npm run create-user -- \"John Doe\" john@example.com mypassword123");
  console.error("  npm run create-user -- \"Admin User\" admin@example.com pass123 --admin --upload");
  console.error("  npm run create-user -- \"Reader\" reader@example.com pass123 --kindle=reader@kindle.com");
  process.exit(1);
}

const [name, email, password, ...flags] = args;
const isAdmin = flags.includes("--admin");
const uploadPermission = flags.includes("--upload");
const kindleArg = flags.find(arg => arg.startsWith("--kindle="));
const kindleEmail = kindleArg ? kindleArg.split("=")[1] : undefined;

createUser({
  name: name!,
  email: email!,
  password: password!,
  isAdmin,
  uploadPermission,
  kindleEmail,
})
  .then(async () => {
    console.log("\n✨ Done!");
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Error creating user:", error);
    await client.end();
    process.exit(1);
  });
