# Skywalkers' Team Website

This website was made using mainly Sveltekit and Firebase. 

## About Integrations

Discord bot integration runs seperately and is hosted on a seperate server, this serve then sends request to the Discord bot for anything it needs. Other integrations (Google Calendar, Notion, SMS, etc) are done here.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                                 |
| :------------------------ | :------------------------------------------------------|
| `npm install`             | Installs dependencies                                  |
| `npm run dev`             | Starts local dev server at `localhost:5173`            |
| `npm run build`           | Build the production site to `./build/`                |
| `npm run replace`         | Fixes predictable build errors.                        |
| `npm run preview`         | Preview the build locally, before deploying            |
| `npm run deploy`          | Deploy the website to firebase.                        |
| `npm run serve`           | Combination of build, deploy, and replace commands.    |
| `npm run check`           | Runs svelte debugger                                   |
| `npm run config-dev`      | Sets config for developement, included in npm run dev  |
| `npm run config-prod`     | Sets config for production, included in npm run prod   |