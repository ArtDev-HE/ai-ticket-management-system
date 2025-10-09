## Devops and dev-only scripts

All temporary development scripts (seeders, smoke tests, mock servers) were moved to the `devops/` folder and are gated.

To run any dev script:

- Set the appropriate env guard (e.g., `ALLOW_DEV_SEEDS=true` or `ALLOW_DEV_TESTS=true`).
- Run the script from the repository root with `node devops/<script>.js`.

Example (PowerShell):

```powershell
$Env:ALLOW_DEV_SEEDS='true'; node devops/seed_emp_test.js
```

This ensures the scripts won't accidentally run in production or in CI without explicit opt-in.

