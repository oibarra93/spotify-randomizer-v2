import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppError } from "../api/errors";

/**
 * Centralized guard: if auth is missing/expired, redirect to /login.
 * Keeps auth redirects out of every component.
 */
export function useSessionGuard(error: AppError | null) {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!error) return;

    if (error.kind === "AUTH_REQUIRED" || error.kind === "AUTH_EXPIRED") {
      // Preserve where the user was trying to go (optional, for future UX).
      // Your /login route can ignore or later use this.
      const from = loc.pathname + loc.search + loc.hash;
      nav("/login", { replace: true, state: { from } });
    }
  }, [error, nav, loc]);
}
