import { STORAGE_TOKEN } from "../auth/storageKeys";

/**
 * fetch con Authorization Bearer usando el token en sessionStorage.
 */
export async function authFetch(path, options = {}) {
  const token = sessionStorage.getItem(STORAGE_TOKEN);
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    options.body != null &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...options, headers });
}
