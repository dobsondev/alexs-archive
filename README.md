# Alex's Archive

This application is a storage solution for my own eBook files.

## Authentication

This app leverages [Auth0](https://auth0.com/) which has a generous free tier for Authentication. Also note that we are using the v5 beta of NextAuth.js - which is now known simply as Auth.js. You can find the Auth.js documentation here:

- https://authjs.dev/getting-started

### Required Environment Variables

```
AUTH_SECRET
AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET
AUTH0_ISSUER
```

Auth0 documentation can be found here:

- https://auth0.com/docs

T3 Stack documentation regarding Authentication can be found here (remember to look under the "App Router" section):

- https://create.t3.gg/en/usage/next-auth

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

- [x] Deployments via Coolify
- [x] Containterize it for local development
- [x] Health Endpoint
- [x] Setup Coolify Postgres database
- [x] Mock data
- [x] UI with mock data
- [x] Attach database to UI
- [ ] Add authentication
- [ ] Add book uploading
- [ ] Error management
- [ ] Add routing / book page (parallel route)
- [ ] Delete button (w/ Server Actions)

## Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

### What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

### Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!
