# Alex's Archive

This application is a storage solution for my own eBook files.

## Services

I have leveraged the following services for this application:

1. [Netlify](https://www.netlify.com/) (Free Tier) for deployments
2. [Neon](https://neon.tech/) (Free Tier) for database hosting
3. [Auth0](https://auth0.com/) (Free Tier) for authentication
4. [uploadthing](https://uploadthing.com/) (Free Tier) for file uploads
5. [Resend](https://resend.com/) (Free Tier) for emailing

The application is built to use [Auth0](https://auth0.com/), [uploadthing](https://uploadthing.com/), and [Resend](https://resend.com/). You can easily use any deployment service and database provider that you wish though as there is no built in logic/code for those aspects of the application. If you are planning to setup this application yourself, you can refer to the following documentation for more detailed setup instructions on these three services:

- [Authentication with Auth0](./docs/authentication.md)
- [Emailing with Resend](./docs/emailing.md)
- [Uploading with uploadthing](./docs/uploading.md)

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
- [ ] Admin user interface to give users ability to upload
- [x] Help page for how to setup Send-to-Kindle Emails and Approved Emails
- [ ] Automatic Drizzle migrations via GitHub CI
- [x] Searching
- [ ] Pagination
- [ ] Ratings (from our users)
- [ ] Reviews
- [x] Admin user ability to send emails to any user's Kindle email

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

## Deploying

The only real note on deploying this application is that you may need to add in the following environment variable to your deployment platform of choice depending on if they use a reverse proxy or not:

```bash
AUTH_TRUST_HOST=true
```

> When deploying your application behind a reverse proxy, you’ll need to set `AUTH_TRUST_HOST` equal to `true`. This tells Auth.js to trust the `X-Forwarded-Host` header from the reverse proxy. Auth.js will automatically infer this to be true if we detect the environment variable indicating that your application is running on one of the supported hosting providers.

Other than that, deploying the application will mostly depend on which platform you choose to use to deploy.

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
