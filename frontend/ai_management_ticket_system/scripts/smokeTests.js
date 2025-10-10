// Guarded placeholder - the canonical smoke test script lives under devops/
// Run the dev smoke tests from repo root with an explicit guard:
//  $Env:ALLOW_DEV_TESTS='true'; node devops/smokeTests_frontend.js
// This frontend script is intentionally a stub to avoid accidental execution in CI or by users.
console.error('This script has been moved to devops/smokeTests_frontend.js and will not run from frontend/scripts by default.');
console.error("To run the dev smoke tests, set ALLOW_DEV_TESTS=true and run from repo root:");
console.error("$Env:ALLOW_DEV_TESTS='true'; node devops/smokeTests_frontend.js");
process.exit(1);
