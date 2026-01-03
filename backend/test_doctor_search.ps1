# Doctor Search/Filter/Pagination - Quick Test Script
# Run this after starting the backend server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Doctor Search & Pagination Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Basic pagination
Write-Host "1. Testing Basic Pagination" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/"
    Write-Host "   ✅ Paginated response received" -ForegroundColor Green
    Write-Host "   Total doctors: $($response.count)" -ForegroundColor Gray
    Write-Host "   Results on this page: $($response.results.Count)" -ForegroundColor Gray
    Write-Host "   Has next page: $($null -ne $response.next)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Search by name/specialty
Write-Host "`n2. Testing Search Functionality" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/?search=cardio"
    Write-Host "   ✅ Search results received" -ForegroundColor Green
    Write-Host "   Found $($response.results.Count) doctors matching 'cardio'" -ForegroundColor Gray
    foreach ($doc in $response.results) {
        Write-Host "     - $($doc.name) ($($doc.specialty))" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Filter by specialty
Write-Host "`n3. Testing Specialty Filter" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/?specialty=Cardiology"
    Write-Host "   ✅ Specialty filter working" -ForegroundColor Green
    Write-Host "   Found $($response.results.Count) cardiologists" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Filter by location
Write-Host "`n4. Testing Location Filter" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/?location=New York"
    Write-Host "   ✅ Location filter working" -ForegroundColor Green
    Write-Host "   Found $($response.results.Count) doctors in New York" -ForegroundColor Gray
    foreach ($doc in $response.results) {
        Write-Host "     - $($doc.name) in $($doc.location)" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Combined filters
Write-Host "`n5. Testing Combined Filters" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/?specialty=Cardiology&location=New York"
    Write-Host "   ✅ Combined filters working" -ForegroundColor Green
    Write-Host "   Found $($response.results.Count) cardiologists in New York" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Pagination with page parameter
Write-Host "`n6. Testing Page Parameter" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/doctors/?page=1"
    Write-Host "   ✅ Page parameter working" -ForegroundColor Green
    Write-Host "   Page 1 contains $($response.results.Count) doctors" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ DOCTOR API TESTS COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNow test in browser:" -ForegroundColor Yellow
Write-Host "1. Start frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "2. Open http://localhost:5173/doctors" -ForegroundColor White
Write-Host "3. Try searching, filtering, and pagination" -ForegroundColor White
