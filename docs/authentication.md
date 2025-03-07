# Authentication with Auth0

This app leverages [Auth0](https://auth0.com/) which has a generous free tier for Authentication. Also note that we are using the v5 beta of NextAuth.js - which is now known simply as Auth.js. You can find the Auth.js documentation here:

- https://authjs.dev/getting-started

## Authentication Setup

1. Sign up for an account at [Auth0](https://auth0.com/)
2. Create your application
3. Add `http://localhost:3000/api/auth/callback` and `http://localhost:3000/` to your "Callback URLs"
4. Add `http://localhost:3000/` to your "Logout URLs"
5. Add required environment variables to `.env.local`
6. Configure any users in Auth0 that you need, and then login

Note: when you deploy to production you will need to add your production URLs to the "Callback URLs" and "Logout URLs".

### Authentication Environment Variables

```bash
AUTH_SECRET=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_ISSUER=...
AUTH_TRUST_HOST=true # Only needed for Production deployments
```

You may need to add in the `AUTH_TRUST_HOST` environment variable to your deployment platform if they use a reverse proxy or not. From the Auth.js documentation:

> When deploying your application behind a reverse proxy, you’ll need to set `AUTH_TRUST_HOST` equal to `true`. This tells Auth.js to trust the `X-Forwarded-Host` header from the reverse proxy. Auth.js will automatically infer this to be true if we detect the environment variable indicating that your application is running on one of the supported hosting providers.

### Netlify Preview URLs

If you want to allow Netlify preview URLs to work with your authentication, then you will want to add some wildcard domains to your "Callback URLs" and "Logout URLs" settings of your Auth0 application.

"Callback URLs":

```
http://localhost:3000/api/auth/callback/auth0, 
http://localhost:3000/api/auth/callback,
https://*-<NETLIFY_PROJECT>.netlify.app/api/auth/callback/auth0,
https://*-<NETLIFY_PROJECT>.netlify.app/api/auth/callback
```

"Logout URLs":

```
http://localhost:3000, 
https://*-<NETLIFY_PROJECT>.netlify.app
```

Where `<NETLIFY_PROJECT>` would be replaced with your actual project slug. You will see what this part of the URL is when you deploy on Netlify.

### More Authentication Documentation

Auth.js documentation on deployments:

- https://authjs.dev/getting-started/deployment

Auth0 documentation can be found here:

- https://auth0.com/docs

T3 Stack documentation regarding Authentication can be found here (remember to look under the "App Router" section):

- https://create.t3.gg/en/usage/next-auth