# KarachiBites Restaurant Hub

Restaurant ordering and management application with a React frontend and Express backend.

## Development

Install dependencies in the workspace and frontend folders, then start the services:

```sh
npm install
npm --prefix restaurant-hub install
npm run dev:backend
npm run dev:frontend
```

See the backend and frontend package manifests for available scripts.

## GitHub Pages deployment

The frontend is statically prerendered and deployed from `restaurant-hub/dist/client`
by `.github/workflows/deploy-pages.yml`. In the repository's **Settings → Pages**,
set **Build and deployment → Source** to **GitHub Actions**. The project site URL is
`https://mohammaddaniyal938.github.io/hungry-corner/`.

The Pages site hosts only the frontend; GitHub Pages cannot run the Express server
or MongoDB. To enable API-backed login, ordering, and administration, deploy the
backend separately, configure its database and secrets on that host, and allow the
Pages origin in its `CLIENT_URL` setting. Then add the public API base URL
(including `/api`, for example `https://api.example.com/api`) as the repository
Actions variable `VITE_API_URL`. Do not put backend credentials or `.env` files in
the frontend or GitHub repository.
