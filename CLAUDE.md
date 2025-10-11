# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Nature

This is a Next.js application that hosts epub book files. The books can be uploaded by privileged users and then other users can download them or directly email them to their own Kindle's via a Kindle email address. Admin users are also able to pose as other users in order to send those users books via email.

## Architecture Overview

This is a Next.js 15 eBook storage application built with the T3 Stack, featuring:

### Tech Stack

The tech stack was made using the T3 App stack, which packages together a bunch of different web development tools together into a stack. The stack is focused on simplicity, modularity, and full-stack typesafety.

- **Framework**: Next.js 15 with App Router
  - Documentation: https://nextjs.org/docs
- **Database**: PostgreSQL with Drizzle ORM
  - Documentation: https://www.postgresql.org/docs/
  - Documentation: https://orm.drizzle.team/docs/overview, https://orm.drizzle.team/docs/get-started-postgresql, 
- **Authentication**: BetterAuth v1.3.27 with email/password
  - Documentation: https://www.better-auth.com/docs
- **Styling**: Tailwind CSS with Flowbite React components
  - Documentation: https://v2.tailwindcss.com/docs
- **File Storage**: UploadThing for ePub file uploads
  - Documentation: https://docs.uploadthing.com/
- **Email**: Resend for sending books to Kindle
  - Documentation: https://resend.com/docs/introduction
- **Type Safety**: TypeScript with strict configuration
  - Documenation: https://www.typescriptlang.org/docs/
- **Environment**: T3 env validation with Zod
  - Documentation: https://create.t3.gg/en/introduction

### Core Features
1. **Book Management**: Upload ePub files with Goodreads metadata scraping
2. **Authentication**: BetterAuth email/password authentication with custom user fields
3. **Send to Kindle**: Email ePub files to users' Kindle devices
4. **User Permissions**: Upload permission and admin system for controlling access
5. **User Management**: Manual user creation via CLI script
6. **Password Management**: Users can change passwords via profile settings

### Directory Structure
- `src/app/` - Next.js App Router pages and components
  - `_components/` - Shared React components (BookCard, TopBar, etc.)
  - `_actions/` - Server actions for profile and Kindle sending
  - `_utils/` - Utilities for email, file upload, and Goodreads scraping
  - `api/` - API routes for auth, file upload, and Goodreads integration
- `src/server/` - Server-side code
  - `auth/` - BetterAuth configuration
  - `db/` - Drizzle database configuration and schema
- `drizzle/` - Database migrations
- `scripts/` - Utility scripts for user management and data migration
- `docs/` - Setup documentation for Resend and UploadThing

### Database Schema
- `users` - User accounts with custom fields (uploadPermission, isAdmin, kindleEmail)
- `accounts` - BetterAuth account credentials (password hashes)
- `sessions` - BetterAuth session management
- `verifications` - BetterAuth email verification tokens
- `books` - Book metadata with Goodreads data and UploadThing URLs

### Key Integrations
- **Goodreads Scraping**: Automatic metadata extraction using book IDs (Apollo state JSON parsing)
- **UploadThing**: Secure file uploads with middleware validation
- **BetterAuth**: Email/password authentication with scrypt password hashing
- **Resend**: Email service for Kindle delivery

### Environment Variables
Required variables are validated through `src/env.js`:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - BetterAuth secret for session signing (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Application URL (production only)
- `UPLOADTHING_TOKEN` - File upload service
- `RESEND_API_KEY` - Email service

### Path Aliases
- `~/` maps to `src/` directory for cleaner imports

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbo (port 3000)
- `npm run build` - Build the Next.js application
- `npm run start` - Start production server
- `npm run preview` - Build and start production server

### Code Quality
- `npm run check` - Run both linting and type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking
- `npm run format:write` - Format code with Prettier
- `npm run format:check` - Check code formatting

### User Management
- `npm run create-user -- <name> <email> <password> [--admin] [--upload] [--kindle=email]` - Create a new user
  - Example: `npm run create-user -- "John Doe" john@example.com password123 --admin --upload`
  - Uses BetterAuth's `hashPassword` for secure password storage

### Database Management
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run Drizzle migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio database UI

### Docker Development
- `docker compose up -d` - Start local development environment with remote Neon development Postgres database
- `docker compose -f docker-compose.local.yml up -d` - Start local development environment with local Docker Postgres database
- `docker compose [-f docker-compose.local.yml] down -v` - Stop containers and remove volumes
- Local database URL: `postgresql://postgres:devpass@localhost:5432/postgres`

### Development Notes
- Database schema uses `alexs-archive_` table prefix
- File uploads expect format: `{goodreads-id}.epub`
- Docker provides local Postgres database for development
- Drizzle Studio provides database GUI on local development

### Authentication Notes
- BetterAuth uses scrypt for password hashing with parameters: N=16384, r=16, p=1, dkLen=64
- Sessions are cookie-based with 7-day expiry
- Custom user fields are included in session via `user.additionalFields` configuration
- No public sign-up page - users must be created by admins using the `create-user` script
- Password changes are handled through `/user/profile` page

### Goodreads Scraping Notes
- Goodreads now uses Apollo GraphQL state embedded in JSON script tags
- Book data is extracted from objects with keys starting with `Book:`
- Author and series data use `__ref` references that must be resolved from Apollo state
- The scraper parses this JSON structure instead of HTML selectors
