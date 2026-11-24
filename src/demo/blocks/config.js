// Blocks settings come from VITE_BLOCKS_* in .env. All of them are public identifiers
// (project key, sign-in client id, URLs): they are compiled into the browser bundle by design.

export const blocksConfig = {
  apiUrl: import.meta.env.VITE_BLOCKS_API_URL ?? '',
  appDomain: import.meta.env.VITE_BLOCKS_APP_DOMAIN ?? '',
  oidcUrl: import.meta.env.VITE_BLOCKS_OIDC_URL ?? '',
  oidcClientId: import.meta.env.VITE_BLOCKS_OIDC_CLIENT_ID ?? '',
  xBlocksKey: import.meta.env.VITE_BLOCKS_X_BLOCKS_KEY ?? '',
};

// The shared port lives in Blocks only on the hosted site. Blocks accepts calls and its sign-in cookie
// only from the registered domain, so anywhere else (the local dev server) the record stays in this
// browser, as it always has.
export function usesBlocks() {
  if (!blocksConfig.appDomain || !blocksConfig.xBlocksKey) return false;
  try {
    return window.location.origin === new URL(blocksConfig.appDomain).origin;
  } catch {
    return false;
  }
}
