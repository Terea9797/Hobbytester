<#  Bootstrap Mafia Game (dev)
    - Spins up Postgres (Docker) or reuses it
    - Ensures backend/ frontend env files (no secrets committed)
    - Installs deps
    - Starts backend + frontend (each in its own terminal)
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\bootstrap-dev.ps1

    - Performs basic health checks
#>

param(
  [string]$ApiBase      = "http://127.0.0.1:8000",
  [string]$FrontendURL  = "http://127.0.0.1:5173",
  [string]$PgContainer  = "mafia-pg",
  [string]$PgImage      = "postgres:16",
  [string]$PgUser       = "mafia",
  [string]$PgPassword   = "mafia",
  [string]$PgDb         = "mafia",
  [int]   $PgPort       = 5432,
  [string]$SendGridKey  = $env:SENDGRID_API_KEY,     # pass via env var or param
  [string]$FromEmail    = "no-reply@example.com",    # set to your verified sender (e.g. your SendGrid Single Sender)
  [string]$FromName     = "City of Shadows"
)

$ErrorActionPreference = "Stop"

function Info($msg){ Write-Host "• $msg" -ForegroundColor Cyan }
function Ok($msg){ Write-Host "✔ $msg" -ForegroundColor Green }
function Warn($msg){ Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Fail($msg){ Write-Host "✖ $msg" -ForegroundColor Red }

# --- 0) Sanity: repo layout
if (!(Test-Path "game-backend") -or !(Test-Path "game-frontend")) {
  Fail "Run this from the repo root (should contain game-backend and game-frontend)."
  exit 1
}

# --- 1) Ensure Docker Desktop is running
try {
  docker info | Out-Null
} catch {
  Warn "Docker not reachable. Start Docker Desktop, then re-run."
  exit 1
}

# --- 2) Start (or reuse) Postgres container
$pgRunning = (docker ps --format "{{.Names}}" | Where-Object { $_ -eq $PgContainer })
if (-not $pgRunning) {
  $pgExists = (docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq $PgContainer })
  if ($pgExists) {
    Info "Starting existing Postgres container '$PgContainer'..."
    docker start $PgContainer | Out-Null
  } else {
    Info "Creating Postgres container '$PgContainer' on port $PgPort ..."
    docker run --name $PgContainer `
      -e "POSTGRES_PASSWORD=$PgPassword" `
      -e "POSTGRES_DB=$PgDb" `
      -p "$PgPort:5432" -d $PgImage | Out-Null
  }
} else {
  Info "Postgres container '$PgContainer' already running."
}

# quick health check
Start-Sleep -Seconds 2
try {
  docker exec $PgContainer pg_isready -U $PgUser | Out-Null
  Ok "Postgres is ready."
} catch {
  Warn "Could not run pg_isready; continuing anyway."
}

# --- 3) Backend .env (idempotent)
$backendEnv = "game-backend\.env"
if (!(Test-Path $backendEnv)) {
  Info "Creating game-backend/.env ..."
  @"
SECRET_KEY=change_me_dev_secret
JWT_ALG=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=postgresql+asyncpg://$PgUser:$PgPassword@localhost:$PgPort/$PgDb
DEBUG=true

SENDGRID_API_KEY=$SendGridKey
FROM_EMAIL=$FromEmail
FROM_NAME=$FromName
CORS_ORIGINS=["http://localhost:5173","$FrontendURL"]

BASE_URL=$ApiBase
FRONTEND_URL=$FrontendURL
"@ | Set-Content -Encoding UTF8 $backendEnv
  Ok "Wrote $backendEnv"
} else {
  Info "Found existing $backendEnv (leaving as-is)."
}

# --- 4) Frontend .env.local (idempotent)
$frontendEnv = "game-frontend\.env.local"
if (!(Test-Path $frontendEnv)) {
  Info "Creating game-frontend/.env.local ..."
  @"
VITE_API_BASE_URL=$ApiBase
"@ | Set-Content -Encoding UTF8 $frontendEnv
  Ok "Wrote $frontendEnv"
} else {
  Info "Found existing $frontendEnv (leaving as-is)."
}

# --- 5) Harden .gitignore (make sure envs stay out of git)
$gitignore = ".gitignore"
if (!(Test-Path $gitignore)) { New-Item -ItemType File -Path $gitignore | Out-Null }
$lines = Get-Content $gitignore -Raw
$ensure = @(
  "game-backend/.env",
  "game-frontend/.env",
  "game-frontend/.env.local",
  ".venv",
  "game-backend/.venv",
  "game-frontend/node_modules",
  "game-frontend/dist",
  "game-frontend/.vite"
)
$changed = $false
foreach($p in $ensure){
  if ($lines -notmatch [regex]::Escape($p)) {
    Add-Content $gitignore $p
    $changed = $true
  }
}
if ($changed) { Ok "Updated .gitignore" } else { Info ".gitignore already ok" }

# --- 6) Backend deps + venv (idempotent)
Push-Location game-backend
if (!(Test-Path ".venv")) {
  Info "Creating Python venv ..."
  python -m venv .venv
}
& .\.venv\Scripts\python.exe -m pip install --upgrade pip > $null
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
Pop-Location
Ok "Backend deps ready."

# --- 7) Frontend deps (idempotent)
Push-Location game-frontend
if (!(Test-Path "node_modules")) {
  Info "Installing frontend deps ..."
  npm install
} else {
  Info "Frontend deps already present (npm ci recommended for clean builds)."
}
Pop-Location

# --- 8) Start backend + frontend in separate terminals
Info "Starting backend (uvicorn) in new terminal..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$PWD\game-backend`"; .\.venv\Scripts\activate; uvicorn app.main:app --reload"

Info "Starting frontend (vite) in new terminal..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$PWD\game-frontend`"; npm run dev"

# --- 9) Health checks
Start-Sleep -Seconds 3
try {
  $health = Invoke-WebRequest -UseBasicParsing "$ApiBase/" -TimeoutSec 5
  if ($health.StatusCode -eq 200 -and $health.Content -match '"ok"') {
    Ok "Backend health OK at $ApiBase/"
  } else {
    Warn "Backend responded but not OK. Check logs in the backend terminal."
  }
} catch {
  Warn "Backend health check failed: $($_.Exception.Message)"
}

# --- 10) Final hints
if (-not $SendGridKey) {
  Warn "SENDGRID_API_KEY is empty. Registration emails won't send until you set it in game-backend/.env."
} else {
  Ok "SendGrid API key present in local env. Verify Single Sender or Domain Auth in your SendGrid account."
}

Ok "Bootstrap complete. Open $FrontendURL and test registration."
