import { blocks } from './client';

// Blocks hosted sign-in: IAM signs the person in on its own page, then returns to /login/callback,
// where the session cookie is set. The app never sees or stores a token.

export const CALLBACK_PATH = '/login/callback';
const RETURN_KEY = 'ibms-return-to';

export async function startSignIn() {
  try { sessionStorage.setItem(RETURN_KEY, window.location.hash || '#/'); } catch { /* storage unavailable */ }
  await blocks().auth.idp.redirectToProvider();
}

// Returns the hash to go back to, or throws with IAM's reason.
export async function completeSignIn() {
  const response = await blocks().auth.idp.callback(window.location.href);
  if (response?.error) throw new Error(response.error_description || response.error);
  let returnTo = '#/';
  try {
    returnTo = sessionStorage.getItem(RETURN_KEY) || '#/';
    sessionStorage.removeItem(RETURN_KEY);
  } catch { /* storage unavailable */ }
  return returnTo;
}

// The signed-in person's claims, or null when nobody is signed in. IAM is the only source of truth.
export async function currentUser() {
  try {
    return await blocks().auth.userInfo();
  } catch {
    return null;
  }
}

export async function signOut() {
  await blocks().auth.logout().catch(() => undefined);
}
