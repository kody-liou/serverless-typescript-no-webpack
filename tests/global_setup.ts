import { setup as setupDevServer } from 'jest-dev-server';

export default async function globalSetup() {
  await setupDevServer({
    command: `kill-port 7070 && cross-env SKIP_AUTH=true serverless offline --httpPort=7070`,
    launchTimeout: 50000,
    port: 7070,
  });
}
