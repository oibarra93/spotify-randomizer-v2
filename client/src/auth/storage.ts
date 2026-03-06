const KEY = "sr_v2_auth";

export type AuthState = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
  scope?: string;
  token_type?: string;
};

export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function saveAuth(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
