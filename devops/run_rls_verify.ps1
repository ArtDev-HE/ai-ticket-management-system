# devops/run_rls_verify.ps1
# PowerShell helper to run the RLS verification SQL against a Postgres database using psql.
# Usage (PowerShell):
# $Env:PGHOST='localhost'; $Env:PGUSER='postgres'; $Env:PGPASSWORD='yourpw'; $Env:PGDATABASE='ticket_management_system'; .\devops\run_rls_verify.ps1

$psql = "psql"
$sqlFile = Join-Path -Path $PSScriptRoot -ChildPath 'rls_verify_v2.sql'

if (-not (Test-Path $sqlFile)) {
    Write-Error "SQL file not found: $sqlFile"
    exit 1
}

Write-Host "Running RLS verification script: $sqlFile"
& $psql -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "RLS verification script executed successfully." -ForegroundColor Green
} else {
    Write-Error "RLS verification script failed with exit code $LASTEXITCODE"
}
