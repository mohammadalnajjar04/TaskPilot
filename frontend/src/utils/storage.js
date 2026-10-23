import { STORAGE_KEYS } from "./constants";

function readItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode / quota) — fail silently.
  }
}

function removeItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable — fail silently.
  }
}

export function getAccessToken() {
  return readItem(STORAGE_KEYS.accessToken);
}

export function setAccessToken(token) {
  writeItem(STORAGE_KEYS.accessToken, token);
}

export function removeAccessToken() {
  removeItem(STORAGE_KEYS.accessToken);
}

export function getStoredUser() {
  const raw = readItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    removeItem(STORAGE_KEYS.user);
    return null;
  }
}

export function setStoredUser(user) {
  writeItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function removeStoredUser() {
  removeItem(STORAGE_KEYS.user);
}

export function clearAuthStorage() {
  removeAccessToken();
  removeStoredUser();
}
