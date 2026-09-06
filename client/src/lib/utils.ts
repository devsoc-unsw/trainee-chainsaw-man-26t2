
/**
 * Get the backend URL for this deployment.
 */
export function backendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
}

/**
 * Get the frontend URL for this deployment.
 */
export function frontendUrl(): string {
  return process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3000";
}