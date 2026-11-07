# Angels Home frontend

This directory contains the React and Vite web client for the Angels Home School Management System.

See the [root project README](../README.md) for the platform overview, architecture, setup instructions and deployment guidance.

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

## Quality checks

```bash
npm run lint
npm run build
```

Configure the backend API URL using the documented environment variables. Keep secrets in local environment files or the deployment provider's secret manager; never commit them.
