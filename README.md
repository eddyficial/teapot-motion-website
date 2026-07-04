# Teapot Motion Website

A static Vite + TypeScript + Three.js motion website centered on a tactile animated teapot.

## Prerequisites

- Node.js 22 or newer
- npm

## Setup

```powershell
npm install
```

## Run Locally

```powershell
npm run dev
```

Open `http://127.0.0.1:5174`.

## Build

```powershell
npm run build
```

## Test

```powershell
npm run test:e2e
```

The Playwright suite verifies desktop and mobile layout, a nonblank teapot canvas, the Pour/Steam/Still controls, keyboard activation, screenshots, and reduced-motion behavior.

## GitHub Pages

Live site: `https://eddyficial.github.io/teapot-motion-website/`

Repository: `https://github.com/eddyficial/teapot-motion-website`

This project includes `.github/workflows/pages.yml` for GitHub Pages deployment. The workflow builds with `BASE_PATH=/<repo>/` so Vite asset paths work for a project Pages URL. Pushes to `main` deploy through GitHub Actions.

Verified deployment evidence:

- GitHub Actions run `28710572451` completed successfully.
- Live smoke check returned HTTP 200 and the page body contained `Teapot Motion`.
