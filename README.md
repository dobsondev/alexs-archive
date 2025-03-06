# Alex's Archive

This application is a storage solution for my own eBook files.

## Authentication

This app leverages [Auth0](https://auth0.com/) which has a generous free tier for Authentication. Also note that we are using the v5 beta of NextAuth.js - which is now known simply as Auth.js. You can find the Auth.js documentation here:

- https://authjs.dev/getting-started

### Authentication Setup

1. Sign up for an account at [Auth0](https://auth0.com/)
2. Create your application
3. Add `http://localhost:3000/api/auth/callback` and `http://localhost:3000/` to your "Callback URLs"
4. Add `http://localhost:3000/` to your "Logout URLs"
5. Add required environment variables to `.env.local`
6. Configure any users in Auth0 that you need, and then login

### Authentication Environment Variables

```bash
AUTH_SECRET=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_ISSUER=...
```

### More Authentication Documentation

Auth0 documentation can be found here:

- https://auth0.com/docs

T3 Stack documentation regarding Authentication can be found here (remember to look under the "App Router" section):

- https://create.t3.gg/en/usage/next-auth

## Uploading

We are leveraging [UploadThing](https://uploadthing.com/) for uploading and storing our ePub files. UploadThing is awesome and makes everything a lot easier.

Note: I also realize that the name of `uploadthing` is `uploadthing` with all lower-case letters, but the logo with the two colours makes it much more readable. So I will be using camel-case (`UploadThing`) to denote it in this README. Please don't hate me!

### UploadThing Setup

1. Create an account at [UploadThing](https://uploadthing.com/)
2. Setup a new application
3. Add the required environment variables to `.env.local`

### UploadThing Environment Variables

```bash
UPLOADTHING_TOKEN=...
```

## Emailing

We are leveraging [Resend](https://resend.com/) for email sending. Emails are used to send the ePub files directly to your Kindle email for the easiest method of getting the books onto your Kindle.

### Resend Setup

1. Sign up for an account at [Resend](https://resend.com/)
2. [Create an API key](https://resend.com/api-keys)
3. [Add a domain](https://resend.com/domains)
4. Setup DNS records for your domain to use Resend

## Local Development

The best way to run the project locally is to use the `docker-compose.yml` file:

```bash
docker compose up -d
```

This will create a Postgres database for you to use on your local, and will spin up your Next.js application on port 3000 using `npm run dev`.

Alternatively, you can of course just run `npm run dev` directly on your machine.

If you want to have a UI into the database, you can use Drizzle Studio by running:

```bash
npm run db:studio
```

### Postgres database

Please note that the Postgres database created by the `docker-compose.yml` file uses a volume to mount it's data so that it is not lost between different runs of the `docker-compose.yml` file. To completely remove this volume and start the database from fresh, use the following command to delete volumes:

```bash
docker compose down -v
```

To create a database dump which can be picked up by Docker automatically, use the following command:

```bash
docker exec -t alexs-archive-db-1 pg_dump -U postgres postgres > docker/initdb/init.sql
```

This will then be used as the base of the database when you spin up the containers using `docker compose up`.

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
- [ ] Add emailing epub to Kindle (Resend)

Nice to Have:
- [ ] Uploading only to select users
- [ ] Help page for how to setup Send-to-Kindle Emails and Approved Emails
- [ ] Searching
- [ ] Pagination
- [ ] Ratings (from our users)
- [ ] Reviews

## Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

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
