# Project Instructions

This repository contains a Django backend and React/Vite frontend deployed on Render.

## Before changing code

- Inspect the relevant frontend, backend, and Render configuration.
- Diagnose the root cause before editing.
- Preserve unrelated uncommitted changes.
- Do not expose passwords, access tokens, API keys, or database URLs.
- On Windows, use `curl.exe` for live HTTP checks with a maximum wait of 90 seconds.

## When fixing an issue

- Keep changes focused on the requested behavior.
- Run focused tests, lint, and production builds when applicable.
- Test relevant live endpoints only when credentials are explicitly provided.
- Never print credentials, JWTs, API keys, or full secret-bearing responses.
- Commit only related changes.
- Push to the current Git branch only when the user explicitly approves it.
- Report the cause, files changed, validation performed, deployment status, and remaining uncertainty.

## Project commands

- Frontend build: `npm --prefix frontend run build`
- Frontend lint: `npm --prefix frontend run lint`
- Backend tests: `python backend/manage.py test`
- Frontend API client: `frontend/src/api/client.js`
- Backend API routes: `backend/core/urls.py`
- Backend settings: `backend/backend/settings.py`
- Render configuration: `render.yaml`

## Deployment notes

- The frontend is a Vite static site under `frontend/`.
- The backend is a Django service under `backend/`.
- The production API URL is configured through `VITE_API_URL` and should point to the deployed backend.
- Render free-tier cold starts are possible; handle them deliberately without masking authentication or server errors.
