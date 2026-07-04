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

This project includes `.github/workflows/pages.yml` for GitHub Pages deployment. Before first publication, set the repository Pages source to GitHub Actions. The workflow builds with `BASE_PATH=/<repo>/` so Vite asset paths work for a project Pages URL.

Creating/pushing a public repository and first GitHub Pages deploy require explicit human approval in the Operynth loop.
