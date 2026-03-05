# Spotify Randomizer V2

This repository hosts the next major version of the Spotify Randomizer application. It combines the polished visual design created by Lovable with the proven Spotify integration, shuffle logic and backend API from the original app.

## Project structure

The project is organized into three top‑level directories:

- `client/` – Contains the frontend application built with Vite, React and TypeScript. Within this folder you'll find:
  - `src/components/` – Reusable UI components that implement the Lovable design system.
  - `src/pages/` – Top‑level pages/views wired to the router.
  - `src/hooks/` – Custom hooks for data fetching, session management and shuffle jobs.
  - `src/api/` – A strongly‑typed Spotify client and HTTP helpers that wrap the Spotify Web API.
  - `src/features/` – Business logic such as the Fisher‑Yates shuffle and playlist creation.
  - `public/` – Static assets and the HTML entry point for Vite.
  - Config files such as `vite.config.ts`, `tailwind.config.ts` and `postcss.config.js` used to build and style the app.

- `server/` – A small Fastify server responsible for exchanging authorization codes for access/refresh tokens and refreshing expired tokens. The server exports simple REST endpoints and can run behind a reverse proxy.

- `shared/` – Shared TypeScript types that are used by both the client and the server.

## Purpose

The goal of this integration is to:

1. Preserve the look and feel of the Lovable UI design, including typography, spacing, hover states and micro‑interactions.
2. Maintain the existing Spotify OAuth flow, playlist fetching, liked songs retrieval, shuffle logic and playlist creation implemented in the original randomizer.
3. Fix UX issues such as visual hierarchy, sidebar usability and interaction clarity that were identified in the critique.
4. Organize the codebase into a clean GitHub‑driven workflow that makes deployment and iteration straightforward.

## Development

To start the development server for the client, install dependencies and run the Vite dev server:

```bash
# install dependencies
npm install

# run the frontend dev server
tnpm run dev
```

To run the backend server in development:

```bash
# from the project root
cd server
npm install
npm run dev
```

## Deployment

The application is designed to be self‑hosted. The frontend build output (`client/dist`) can be served via Nginx behind a Cloudflare proxy. The backend runs as a systemd service in `/opt/spotify-randomizer` with atomic releases to `/opt/spotify-randomizer/releases/`.
