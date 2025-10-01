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
- **Authentication**: NextAuth.js with Auth0
  - https://next-auth.js.org/getting-started/introduction
  - https://auth0.com/docs
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
2. **Authentication**: Auth0 integration with user permissions
3. **Send to Kindle**: Email ePub files to users' Kindle devices
4. **User Permissions**: Upload permission system for controlling access

### Directory Structure
- `src/app/` - Next.js App Router pages and components
  - `_components/` - Shared React components (BookCard, TopBar, etc.)
  - `_actions/` - Server actions for profile and Kindle sending
  - `_utils/` - Utilities for email, file upload, and Goodreads scraping
  - `api/` - API routes for auth, file upload, and Goodreads integration
- `src/server/` - Server-side code
  - `auth/` - NextAuth.js configuration with Auth0
  - `db/` - Drizzle database configuration and schema
- `drizzle/` - Database migrations
- `docs/` - Setup documentation for Auth0, Resend, and UploadThing

### Database Schema
- `users` - User accounts with upload permissions and Kindle email
- `books` - Book metadata with Goodreads data and UploadThing URLs
- `accounts/sessions` - NextAuth.js authentication tables

### Key Integrations
- **Goodreads Scraping**: Automatic metadata extraction using book IDs
- **UploadThing**: Secure file uploads with middleware validation
- **Auth0**: OAuth authentication with custom profile mapping
- **Resend**: Email service for Kindle delivery

### Environment Variables
Required variables are validated through `src/env.js`:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER` - Auth0 config
- `UPLOADTHING_TOKEN` - File upload service
- `RESEND_API_KEY` - Email service
- `AUTH_SECRET` - NextAuth.js secret (production only)

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
