import { createBlocksClient } from '@seliseblocks/client';
import { blocksConfig } from './config';

// The app's one Blocks client: every sign-in and data call goes through it, never a hand-written fetch.
// Sign-in uses IAM's session cookie, which the SDK sends on every call, so no token is kept here.
// Created on first use, so a build without Blocks settings still runs on its own copy of the record.
let client = null;

export function blocks() {
  client ??= createBlocksClient({
    apiUrl: blocksConfig.apiUrl,
    appDomain: blocksConfig.appDomain,
    oidc: { clientId: blocksConfig.oidcClientId, scope: 'openid profile', url: blocksConfig.oidcUrl },
    xBlocksKey: blocksConfig.xBlocksKey,
  });
  return client;
}
