// Guarded placeholder: use devops/seed_emp_test.js instead
// This file intentionally exits to prevent accidental execution from scripts/
console.error('This script has been moved to devops/seed_emp_test.js and will not run from scripts/ by default.');
console.error('To run the dev seed, set ALLOW_DEV_SEEDS=true and run:');
console.error("$Env:ALLOW_DEV_SEEDS='true'; node devops/seed_emp_test.js");
process.exit(1);
