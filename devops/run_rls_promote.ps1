<#
.SYNOPSIS
  Run the RLS promotion migration with safety prompts and optional rollback generation.

This script will:
 - Prompt the user to confirm they're targeting a non-production DB.
 - Run `devops/rls_promote_v2_to_canonical.sql` via psql using environment variables for connection.
 - After success, it will attempt to generate a rollback SQL from the `devops.rls_policy_backups` table.

Environment variables expected (or set before calling):
 - PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

Usage:
  .\run_rls_promote.ps1
#>

Param()

Write-Host 'WARNING: This script should be run against a staging database only.' -ForegroundColor Yellow
$confirm = Read-Host 'Type STAGE and press Enter to continue'
if ($confirm -ne 'STAGE') {
  Write-Host 'Aborting: confirmation not provided.' -ForegroundColor Red
  exit 1
}

$sqlFile = Join-Path $PSScriptRoot 'rls_promote_v2_to_canonical.sql'
if (-not (Test-Path $sqlFile)) {
  Write-Host "Cannot find $sqlFile" -ForegroundColor Red
  exit 1
}

Write-Host "Running promotion script: $sqlFile" -ForegroundColor Cyan

$envVars = @('PGHOST','PGPORT','PGDATABASE','PGUSER')
foreach ($v in $envVars) {
  if (-not $env:$v) { Write-Host "WARNING: environment variable $v is not set." -ForegroundColor Yellow }
}

$psqlCmd = "psql -v ON_ERROR_STOP=1 -f `"$sqlFile`""
Write-Host "Executing: $psqlCmd"

# Run psql (this will prompt for password if PGPASSWORD is not set)
& psql -v ON_ERROR_STOP=1 -f $sqlFile
$exitCode = $LastExitCode
if ($exitCode -ne 0) {
  Write-Host "psql exited with code $exitCode" -ForegroundColor Red
  exit $exitCode
}

Write-Host 'Promotion completed. Attempting to generate rollback SQL into devops/rls_promotion_rollback.sql' -ForegroundColor Green

# Generate rollback SQL from backups (best-effort). This requires the backups to exist in devops.rls_policy_backups.
$rollbackFile = Join-Path $PSScriptRoot 'rls_promotion_rollback.sql'
try {
  # We'll attempt to extract policy_def entries and write them to the rollback file.
  & psql -At -c "SELECT policy_def FROM devops.rls_policy_backups ORDER BY created_at DESC;" | Out-File -FilePath $rollbackFile -Encoding utf8
  Write-Host "Rollback SQL saved to $rollbackFile" -ForegroundColor Green
} catch {
  Write-Host 'Failed to generate rollback automatically. You can inspect devops.rls_policy_backups table manually.' -ForegroundColor Yellow
}

Write-Host 'Done.' -ForegroundColor Cyan
