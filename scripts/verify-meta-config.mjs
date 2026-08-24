import fs from "fs";

const requiredEnvVars = ["FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"];

export function verifyMetaConfig() {
  console.log("=== Meta Developer Portal & OAuth Config Verification ===");
  const missing = requiredEnvVars.filter(v => !process.env[v]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const expectedRedirectUris = [
    appUrl + "/api/oauth/callback/facebook",
    appUrl + "/api/oauth/callback/instagram"
  ];

  console.log("Required Redirect URIs to add in Meta Developer Portal:");
  expectedRedirectUris.forEach(uri => console.log("  - " + uri));

  if (missing.length > 0) {
    console.warn("\nWarning: Missing environment variables: " + missing.join(", "));
  } else {
    console.log("\nMeta OAuth environment variables present.");
  }
}

if (process.argv[1] && process.argv[1].endsWith("verify-meta-config.mjs")) {
  verifyMetaConfig();
}
