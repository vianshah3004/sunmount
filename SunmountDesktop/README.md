# Sunmount Desktop (Electron)

This is an Electron desktop wrapper for the Sunmount web app.

## Prerequisites

- Node.js installed
- Backend source available at:
  - /Users/vineetkumarshah/Hackathon/Sunmount /module 1
- Frontend source available at:
  - /Users/vineetkumarshah/Hackathon/Sunmount /Frontend/pvt

## Install

```bash
cd /Users/vineetkumarshah/Desktop/SunmountDesktop
npm install
```

## Run desktop app (backend already running)

```bash
npm run start:desktop
```

## Run backend + desktop together

```bash
npm run start:full
```

## Notes

- Desktop frontend build is generated into `web/`.
- Desktop app is wired to backend API and socket at `http://localhost:4000`.
- If backend is not running, login/data requests will fail until backend starts.
