import { validateInstagramBypassConfig } from "../src/lib/oauth/instagram-fallback.js";

console.log("=== Instagram OAuth Bypass Check ===");
const config = validateInstagramBypassConfig();

if (config.hasPageAccessToken && config.isValid) {
  console.log("Instagram Page Access Token bypass is active and configured.");
} else {
  console.log("Instagram Page Access Token bypass is not configured. Standard OAuth flow will be required.");
}
