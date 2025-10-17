param(
    [switch]$TearDown
)

Set-StrictMode -Version Latest

if ($TearDown) {
    Write-Host "Tearing down local Postgres..."
    docker-compose -f ..\docker-compose.yml down -v
    exit 0
}

Write-Host "Starting local Postgres via docker-compose..."
Push-Location ..
docker-compose up -d db
Pop-Location

Write-Host "Waiting for Postgres to be ready on port 55432..."
$max = 60
for ($i = 0; $i -lt $max; $i++) {
    try {
        $out = docker exec local_postgres pg_isready -U postgres -d postgres 2>&1
        if ($out -like '*accepting connections*') { break }
    }
    catch {
        Start-Sleep -Seconds 1
    }
    Start-Sleep -Seconds 1
}

Write-Host "Applying schema and seed (idempotent)..."
$env:PGPASSWORD = 'localpassword'
$psql = 'psql'
$cmdSchema = "$psql -h localhost -p 55432 -U postgres -d postgres -f devops/schema.sql"
$cmdSeed = "$psql -h localhost -p 55432 -U postgres -d postgres -f devops/seed.sql"
Write-Host $cmdSchema
Invoke-Expression $cmdSchema
Write-Host $cmdSeed
Invoke-Expression $cmdSeed

Write-Host "Local Postgres ready. Connection: postgres://postgres:localpassword@localhost:55432/postgres"
