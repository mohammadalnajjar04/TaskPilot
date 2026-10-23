function getBackendOrigin() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (baseUrl) {
    try {
      return new URL(baseUrl).origin;
    } catch {
      // fall through to the window origin
    }
  }

  return window.location.origin;
}

export function resolveBackendUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const url = value.trim();

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (/^(javascript|data|vbscript):/i.test(url)) {
    return null;
  }

  if (url.startsWith("/uploads/")) {
    return new URL(url, getBackendOrigin()).toString();
  }

  return null;
}
