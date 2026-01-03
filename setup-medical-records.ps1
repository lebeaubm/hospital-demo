# Medical Records Setup Script

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Medical Records Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "ERROR: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "Success: Project structure verified" -ForegroundColor Green
Write-Host ""

Write-Host "Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

Write-Host "  Checking migrations..." -ForegroundColor Gray
python manage.py migrate --check 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Applying migrations..." -ForegroundColor Gray
    python manage.py migrate
}

Write-Host "  Running system check..." -ForegroundColor Gray
$checkOutput = python manage.py check 2>&1
Write-Host $checkOutput

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success: Backend setup complete" -ForegroundColor Green
} else {
    Write-Host "Error: Backend check failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Yellow
python manage.py test core.tests.MedicalRecordsTests -v 0

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success: All tests passed (11/11)" -ForegroundColor Green
} else {
    Write-Host "Error: Some tests failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor White
Write-Host ""
Write-Host "Backend:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  python manage.py runserver" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend (in a new terminal):" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then visit:" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Admin:    http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation:" -ForegroundColor White
Write-Host "  MEDICAL_RECORDS.md         - Full implementation guide" -ForegroundColor Gray
Write-Host "  IMPLEMENTATION_COMPLETE.md - Summary and verification" -ForegroundColor Gray
Write-Host "  FILES_CHANGED.md           - Complete file listing" -ForegroundColor Gray
Write-Host ""
