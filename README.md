# Alex's Archive

This application is a storage solution for my own eBook files.

## Services

I have leveraged the following services for this application:

1. [Netlify](https://www.netlify.com/) (Free Tier) for deployments
2. [Neon](https://neon.tech/) (Free Tier) for database hosting
3. [BetterAuth](https://www.better-auth.com/) for authentication
4. [uploadthing](https://uploadthing.com/) (Free Tier) for file uploads
5. [Resend](https://resend.com/) (Free Tier) for emailing

The application is built to use [BetterAuth](https://www.better-auth.com/), [uploadthing](https://uploadthing.com/), and [Resend](https://resend.com/). You can easily use any deployment service and database provider that you wish though as there is no built in logic/code for those aspects of the application. If you are planning to setup this application yourself, you can refer to the following documentation for more detailed setup instructions:

- [Emailing with Resend](./docs/emailing.md)
- [Uploading with uploadthing](./docs/uploading.md)

## AI Workflow

I am leveraging the following PRP workflow for any AI work:

- https://github.com/Wirasm/PRPs-agentic-eng

Follow the README in that repo to see the basic workflow and how to use it.

## TODOs

MVP:
- [x] Deployments via Coolify
- [x] Containterize it for local development
- [x] Health Endpoint
- [x] Setup Coolify Postgres database
- [x] Mock data
- [x] UI with mock data
- [x] Attach database to UI
- [x] Add authentication
- [x] Add Good Reads scraper
- [x] Add epub uploading (UploadThing)
- [x] Add emailing epub to Kindle (Resend)

Nice to Have:
- [x] Uploading only to select users
- [x] Admin users
- [x] User creation script for manual user management
- [x] Password change functionality
- [x] Help page for how to setup Send-to-Kindle Emails and Approved Emails
- [ ] Automatic Drizzle migrations via GitHub CI
- [x] Searching
- [ ] Pagination
- [ ] Ratings (from our users)
- [ ] Reviews
- [x] Admin user ability to send emails to any user's Kindle email
- [x] Migration from Auth0 to BetterAuth

## Local Development

Note: you will need to setup your `.env` on your local before running `docker-compose up -d` or `npm run dev`.

The best way to run the project locally is to use the `docker-compose.yml` file:

```bash
docker compose up -d
```

This will connect to the database defined in your `.env` file with the key `DATABASE_URL`. Ideally, this should be a remote Neon database that is a branch of your main database for development purposes. See Neon's documentation on branching for more information:
- https://neon.com/docs/introduction/branching

You can also run a local Postgres database by running:

```bash
docker compose -f docker-compose.local-db.yml up -d
```

This will create a local Postgres database for you to use, and will spin up your Next.js application on port 3000 using `npm run dev`. I like using a local Postgres database so I can mess it up as much as I want before actually working on the real database.

Alternatively, you can of course just run `npm run dev` directly on your machine.

If you want to have a UI into the database, you can use Drizzle Studio by running:

```bash
npm run db:studio
```

### Drizzle

When running any Drille Kit commands such as `npm run db:studio` or `npm run db:push`, the command will connect to whatever database is defined in your `.env` file with the key `DATABASE_URL`. This means you can switch this out between your local Postgres database from Docker and the actual production database if you need to make changes.

You can get your development database URL from Neon and put it in the `.env` file. Ideally, this should be a branch of your main database. This is especially useful since you can update the branch from the main database to get an up-to-date version of the application in terms of what books are stored on it.

See Neon's documentation on branching for more information:
- https://neon.com/docs/introduction/branching

The local database URL setup for the `.env` will be:

```bash
DATABASE_URL=postgresql://postgres:devpass@localhost:5432/postgres
```

The actual production one should be kept secret and will depend on what service you choose to use to host your database.

#### Drizzle Documentation

- https://orm.drizzle.team/docs/overview

### Docker Postgres Database

Please note that the Postgres database created by the `docker-compose.local-db.yml` file uses a volume to mount it's data so that it is not lost between different runs of the `docker-compose.local-db.yml` file. To completely remove this volume and start the database from fresh, use the following command to delete volumes:

```bash
docker compose -f docker-compose.local-db.yml down -v
```

To create a database dump which can be picked up by Docker automatically, use the following command:

```bash
docker exec -t alexs-archive-db-1 pg_dump -U postgres postgres > docker/initdb/init.sql
```

This will then be used as the base of the database when you spin up the containers using
`docker compose -f docker-compose.local-db.yml up`.

## Authentication

This application uses [BetterAuth](https://www.better-auth.com/) for authentication with email/password login.

### User Management

Users are created manually by administrators using environment-specific scripts. You must explicitly choose which environment (local or production) to create the user in:

```bash
# Create a regular user in local environment
npm run create-user:local -- "User Name" user@example.com password123

# Create an admin user with upload permissions in production
npm run create-user:prod -- "Admin User" admin@example.com securepass --admin --upload

# Create a user with a Kindle email in local environment
npm run create-user:local -- "Reader" reader@example.com pass123 --kindle=reader@kindle.com

# Combine all options for production
npm run create-user:prod -- "Super Admin" admin@example.com pass --admin --upload --kindle=admin@kindle.com
```

**Available commands:**
- `npm run create-user:local` - Creates user in `.env` database
- `npm run create-user:prod` - Creates user in `.env.prod` database

**Note:** The `--` separator is required to pass arguments through npm correctly.

### Custom User Fields

- `uploadPermission` - Allows user to upload books
- `isAdmin` - Grants admin privileges (can send books to other users' Kindle emails)
- `kindleEmail` - User's Kindle email address for receiving books

### Password Management

Users can change their passwords through the Profile Settings page (`/user/profile`).

### Data Management Scripts

The application includes scripts for exporting and importing book data across environments:

**Export books:**
```bash
# Export from local database
npm run export-books:local > books-backup.sql

# Export from production database
npm run export-books:prod > books-backup-prod.sql
```

**Import books:**
```bash
# Import to local database
npm run import-books:local -- books-backup.sql

# Import to production database
npm run import-books:prod -- books-backup.sql
```

These scripts are useful for:
- Backing up book data
- Migrating data between environments
- Restoring data after database resets

## Deploying

When deploying this application, ensure you have the following environment variables configured:

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Secret for BetterAuth (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Your production URL (e.g., `https://yourapp.com`)
- `UPLOADTHING_TOKEN` - UploadThing API token
- `RESEND_API_KEY` - Resend API key

Other than that, deploying the application will mostly depend on which platform you choose to use to deploy.

On Netlify, pay special attention to false positives on secret detection especially for the `BETTER_AUTH_URL`:
- https://docs.netlify.com/manage/security/secret-scanning/

Also make sure to add the `NEXT_PUBLIC_BETTER_AUTH_URL` on Netlify. You can use the `${DEPLOY_URL}` for dynamic deployment URLs.

## Create T3 App

This is a proud [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`. The [T3 Stack](https://create.t3.gg/) is awesome and I highly recommend you check it out and consider using it for your fullstack development needs.

### Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available)

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — feedback and contributions are welcome!
