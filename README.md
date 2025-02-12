# Alex's Archive

This application is a storage solution for my own eBook files.

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

## TODOs

- [x] Deployments via Coolify
- [x] Containterize it for local development
- [x] Health Endpoint
- [ ] Setup Coolify Postgres database
- [ ] Attach database to UI
- [ ] Add authentication
- [ ] Add book uploading
- [ ] Error management
- [ ] Add routing / book page (parallel route)
- [ ] Delete button (w/ Server Actions)

### Create T3 App

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
