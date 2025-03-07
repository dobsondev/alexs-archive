# Neon

> Neon is Serverless Postgres built for the cloud

I am leveraging [Neon](https://neon.tech/) (Free Tier) for hosting my Postgres databases for this project. Neon has a number of cool benefits that are fun to take advantage of:

1. Free Tier!
2. Branching which enables preview builds to use a separate database
3. Postgres - I already know how to use it so why not keep using it!

## Creating a Branch for Netlify Previews

On Neon:

1. Navigate to your project dashboard
2. Select "Branches" in the left hand menu
3. Press the "Create branch" button
4. Give it a name (like `previews`)
5. Select the `main` branch as the parent to get a copy of the current database
6. "Include data up to" should be set to "Current point in time" if you want to include the current database data
7. Press "Create new branch"
8. Copy the branch connection URL

On Netlify:

1. Go to your site
2. Go to "Site configuration"
3. Select "Environment variables"
4. Edit the `DATABASE_URL` by selecting "Options" -> "Edit"
5. Select "Different value for each deploy context"
6. Update the "Deploy previews" value to your new branch URL
7. "Save Variable"

Netlify preview deployments should now use that database instead of your production one, so you can more freely test things out on the previews without worries about breaking anything.

## Neon Documentation

- https://neon.tech/docs/introduction
- https://neon.tech/docs/introduction/branching#branching-workflows