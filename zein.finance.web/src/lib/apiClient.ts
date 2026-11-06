import { config } from "./../config";

let accessToken: string | null = localStorage.getItem('accessToken');
const apiBaseUrl = config.apiUrl;

async function refreshSession() {
  // For JWT, refresh is not implemented yet, so just return false
  return false;
}

function resolveApiUrl(input: RequestInfo | URL) {
  if (typeof input !== 'string' && !(input instanceof URL)) {
    return input;
  }

  const rawUrl = input.toString();

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  if (!apiBaseUrl) {
    return rawUrl;
  }

  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;
  return new URL(rawUrl.replace(/^\//, ''), baseUrl).toString();
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOnUnauthorized = true
) {
  const requestUrl = resolveApiUrl(input);
  const headers = new Headers(init.headers || {});
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  const response = await fetch(requestUrl, {
    ...init,
    headers,
  });

  if (response.status !== 401 || !retryOnUnauthorized) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    console.log("Not refreshed, can't retry API request. ", response);
    
    return response;
  }
  console.log('Retrying API request after refreshing session ...', requestUrl);
  return fetch(requestUrl, {
    ...init,
    headers,
  });
}

export function getAccessToken(){
  return localStorage.getItem('accessToken');
}

export function setAccessToken(token: string) {
  accessToken = token.replace(/"/g, "");
  localStorage.setItem('accessToken', accessToken);
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem('accessToken');
}
