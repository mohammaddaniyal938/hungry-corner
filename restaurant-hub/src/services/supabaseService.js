/**
 * Backward compatibility bridge: Redirects all supabaseService calls to the new Express REST API backend service.
 */
export * from "./apiService";
export { apiService as supabaseService } from "./apiService";
export { default } from "./apiService";
