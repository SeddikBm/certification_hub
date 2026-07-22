# ============================================================================
# CertificationHub - Comprehensive API Test Script (PowerShell)
# ============================================================================
# Tests ALL Swagger API endpoints with ALL 6 roles:
#   ADMIN, DIRECTOR, TRAINING_MANAGER, CAREER_MANAGER, SQUAD_LEAD, COLLABORATOR
#
# Prerequisites:
#   1. Backend running on localhost:8080
#   2. Database seeded with V3__seed_test_data.sql
#   3. Users must have bcrypt-hashed passwords
#   4. Docker compose up (PostgreSQL + RabbitMQ)
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts/test_all_endpoints.ps1
# ============================================================================

$ErrorActionPreference = "Continue"
$BASE_URL = "http://localhost:8080/api/v1"
$PASS = 0
$FAIL = 0
$TOTAL = 0
$ERRORS = @()

# ---- Seed Data IDs ----
$ADMIN_ID      = "f1111111-1111-1111-1111-111111111111"
$CM_ID         = "f2222222-2222-2222-2222-222222222222"
$LEAD_ID       = "f3333333-3333-3333-3333-333333333333"
$COLLAB_ID     = "f4444444-4444-4444-4444-444444444444"
$OTHER_ID      = "f9999999-9999-9999-9999-999999999999"
$JAVA_SQUAD_ID = "a0000000-0000-0000-0000-000000000002"
$CERT_AZ900_ID = "c0000000-0000-0000-0000-000000000001"
$CERT_AZ204_ID = "c0000000-0000-0000-0000-000000000002"
$CERT_CKA_ID   = "c0000000-0000-0000-0000-000000000005"
$TRAINING_CC_ID = "e0000000-0000-0000-0000-000000000001"
$ASSIGN_1_ID   = "b0000000-0000-0000-0000-000000000001"
$ASSIGN_2_ID   = "b0000000-0000-0000-0000-000000000002"
$ASSIGN_3_ID   = "b0000000-0000-0000-0000-000000000003"

$PASSWORD = "Password123!"

# ---- Helper Functions ----
function Assert-Status {
    param([string]$TestName, [int]$Expected, [int]$Actual, [string]$Body = "")
    $script:TOTAL++
    if ($Actual -eq $Expected) {
        $script:PASS++
        Write-Host "  [PASS] [$Actual] $TestName" -ForegroundColor Green
    } else {
        $script:FAIL++
        Write-Host "  [FAIL] [$Actual] $TestName  (expected $Expected)" -ForegroundColor Red
        if ($Body) {
            $short = if ($Body.Length -gt 200) { $Body.Substring(0, 200) + "..." } else { $Body }
            Write-Host "         Body: $short" -ForegroundColor Yellow
        }
        $script:ERRORS += "  FAIL: $TestName (got $Actual, expected $Expected)"
    }
}

function Do-Request {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Token = "",
        [string]$JsonBody = ""
    )
    try {
        $headers = @{ "Content-Type" = "application/json" }
        if ($Token) { $headers["Authorization"] = "Bearer $Token" }

        $params = @{
            Uri     = $Url
            Method  = $Method
            Headers = $headers
            ErrorAction = "Stop"
        }
        if ($JsonBody -and ($Method -ne "GET") -and ($Method -ne "DELETE")) {
            $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes($JsonBody)
        }

        $response = Invoke-WebRequest @params -UseBasicParsing
        return @{ Status = [int]$response.StatusCode; Body = $response.Content }
    } catch {
        $statusCode = 0
        $body = ""
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $reader.ReadToEnd()
                $reader.Close()
            } catch {
                $body = $_.Exception.Message
            }
        }
        return @{ Status = $statusCode; Body = $body }
    }
}

function Login-User {
    param([string]$Email, [string]$Password)
    $body = @{ email = $Email; password = $Password } | ConvertTo-Json
    $result = Do-Request -Method "POST" -Url "$BASE_URL/auth/login" -JsonBody $body
    if ($result.Status -eq 200) {
        $json = $result.Body | ConvertFrom-Json
        return $json.accessToken
    }
    return $null
}

# ============================================================================
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host " CertificationHub - Comprehensive API Test Suite (PowerShell)" -ForegroundColor Cyan
Write-Host " Testing ALL endpoints with ALL 6 roles" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. AUTHENTICATION
# ============================================================================
Write-Host "--- 1. AUTHENTICATION (/api/v1/auth) ---" -ForegroundColor Cyan

Write-Host "`n> Login Tests" -ForegroundColor Yellow

# 1.1 Admin login
$body = @{ email = "admin@devoteam.com"; password = $PASSWORD } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/auth/login" -JsonBody $body
Assert-Status "POST /auth/login - Admin valid credentials" 200 $r.Status $r.Body
$ADMIN_TOKEN = $null
$ADMIN_REFRESH = $null
if ($r.Status -eq 200) {
    $json = $r.Body | ConvertFrom-Json
    $ADMIN_TOKEN = $json.accessToken
    $ADMIN_REFRESH = $json.refreshToken
}

# 1.2 Wrong password
$body = @{ email = "admin@devoteam.com"; password = "WrongPassword!1" } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/auth/login" -JsonBody $body
Assert-Status "POST /auth/login - Wrong password returns 401" 401 $r.Status

# 1.3 Non-existent user
$body = @{ email = "nobody@devoteam.com"; password = $PASSWORD } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/auth/login" -JsonBody $body
Assert-Status "POST /auth/login - Non-existent email returns 401" 401 $r.Status

# 1.4 Refresh Token
Write-Host "`n> Refresh Token Tests" -ForegroundColor Yellow
if ($ADMIN_REFRESH) {
    $body = @{ refreshToken = $ADMIN_REFRESH } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/auth/refresh" -JsonBody $body
    Assert-Status "POST /auth/refresh - Valid refresh token" 200 $r.Status

    # Verify role preserved after refresh (Bug 8 fix)
    if ($r.Status -eq 200) {
        $newToken = ($r.Body | ConvertFrom-Json).accessToken
        $r2 = Do-Request -Method "GET" -Url "$BASE_URL/users" -Token $newToken
        Assert-Status "GET /users with refreshed token - Role preserved (Bug 8)" 200 $r2.Status
    }
} else {
    Write-Host "  [SKIP] Refresh token tests - login did not return a refresh token" -ForegroundColor Yellow
}

# 1.5 Invalid refresh token
$body = @{ refreshToken = "invalid.token.here" } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/auth/refresh" -JsonBody $body
Assert-Status "POST /auth/refresh - Invalid token returns 401" 401 $r.Status

# 1.6 No auth header
$r = Do-Request -Method "GET" -Url "$BASE_URL/users"
Assert-Status "GET /users - No token returns 401" 401 $r.Status

# ============================================================================
# Login all roles
# ============================================================================
Write-Host "`n> Login All Roles" -ForegroundColor Yellow
$CM_TOKEN = Login-User "cm@devoteam.com" $PASSWORD
if ($CM_TOKEN) { Write-Host "  [OK] CAREER_MANAGER logged in" -ForegroundColor Green } else { Write-Host "  [WARN] CM login failed" -ForegroundColor Red }

$LEAD_TOKEN = Login-User "lead@devoteam.com" $PASSWORD
if ($LEAD_TOKEN) { Write-Host "  [OK] SQUAD_LEAD logged in" -ForegroundColor Green } else { Write-Host "  [WARN] LEAD login failed" -ForegroundColor Red }

$COLLAB_TOKEN = Login-User "collab@devoteam.com" $PASSWORD
if ($COLLAB_TOKEN) { Write-Host "  [OK] COLLABORATOR logged in" -ForegroundColor Green } else { Write-Host "  [WARN] COLLAB login failed" -ForegroundColor Red }

# ============================================================================
# 2. USER MANAGEMENT
# ============================================================================
Write-Host "`n--- 2. USER MANAGEMENT (/api/v1/users) ---" -ForegroundColor Cyan

Write-Host "`n> GET /users - RLS per role" -ForegroundColor Yellow
$r = Do-Request -Method "GET" -Url "$BASE_URL/users" -Token $ADMIN_TOKEN
Assert-Status "GET /users - ADMIN sees all users" 200 $r.Status

if ($CM_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/users" -Token $CM_TOKEN
    Assert-Status "GET /users - CAREER_MANAGER sees managed + self" 200 $r.Status
}
if ($LEAD_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/users" -Token $LEAD_TOKEN
    Assert-Status "GET /users - SQUAD_LEAD sees squad + self" 200 $r.Status
}
if ($COLLAB_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/users" -Token $COLLAB_TOKEN
    Assert-Status "GET /users - COLLABORATOR sees only self" 200 $r.Status
}

# Filters
Write-Host "`n> GET /users - Filters" -ForegroundColor Yellow
$r = Do-Request -Method "GET" -Url "$BASE_URL/users?role=ADMIN" -Token $ADMIN_TOKEN
Assert-Status "GET /users?role=ADMIN - Filter by role" 200 $r.Status

$r = Do-Request -Method "GET" -Url "$BASE_URL/users?squadId=$JAVA_SQUAD_ID" -Token $ADMIN_TOKEN
Assert-Status "GET /users?squadId=... - Filter by squad" 200 $r.Status

$r = Do-Request -Method "GET" -Url "$BASE_URL/users?search=admin" -Token $ADMIN_TOKEN
Assert-Status "GET /users?search=admin - Full text search" 200 $r.Status

# Create users
Write-Host "`n> POST /users - Create (ADMIN only)" -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

# Create TRAINING_MANAGER
$tmEmail = "tm-test-$timestamp@devoteam.com"
$body = @{ email = $tmEmail; password = $PASSWORD; firstName = "Training"; lastName = "Manager"; role = "TRAINING_MANAGER"; hireDate = "2024-01-01" } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "POST /users - ADMIN creates TRAINING_MANAGER" 201 $r.Status $r.Body
$TM_ID = $null
if ($r.Status -eq 201) { $TM_ID = ($r.Body | ConvertFrom-Json).id }

# Create DIRECTOR
$dirEmail = "dir-test-$timestamp@devoteam.com"
$body = @{ email = $dirEmail; password = $PASSWORD; firstName = "Test"; lastName = "Director"; role = "DIRECTOR"; hireDate = "2024-01-01" } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "POST /users - ADMIN creates DIRECTOR" 201 $r.Status $r.Body
$DIR_ID = $null
if ($r.Status -eq 201) { $DIR_ID = ($r.Body | ConvertFrom-Json).id }

# Login as TM and DIR
$TM_TOKEN = Login-User $tmEmail $PASSWORD
if ($TM_TOKEN) { Write-Host "  [OK] TRAINING_MANAGER logged in" -ForegroundColor Green }
$DIR_TOKEN = Login-User $dirEmail $PASSWORD
if ($DIR_TOKEN) { Write-Host "  [OK] DIRECTOR logged in" -ForegroundColor Green }

# RBAC: Collab cannot create
Write-Host "`n> POST /users - RBAC denial" -ForegroundColor Yellow
if ($COLLAB_TOKEN) {
    $body = @{ email = "hacker@devoteam.com"; password = $PASSWORD; firstName = "Hacker"; lastName = "Test"; role = "ADMIN"; hireDate = "2024-01-01" } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $COLLAB_TOKEN -JsonBody $body
    Assert-Status "POST /users - COLLABORATOR cannot create users (403)" 403 $r.Status
}
if ($CM_TOKEN) {
    $body = @{ email = "hacker2@devoteam.com"; password = $PASSWORD; firstName = "Hacker"; lastName = "Test"; role = "COLLABORATOR"; hireDate = "2024-01-01"; squadId = $JAVA_SQUAD_ID } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $CM_TOKEN -JsonBody $body
    Assert-Status "POST /users - CAREER_MANAGER cannot create users (403)" 403 $r.Status
}

# Validation
Write-Host "`n> POST /users - Validation" -ForegroundColor Yellow
$body = @{ email = "invalid"; password = "weak"; firstName = ""; lastName = ""; role = "ADMIN"; hireDate = "2024-01-01" } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "POST /users - Invalid email + weak password returns 400" 400 $r.Status

# Duplicate email
$body = @{ email = "admin@devoteam.com"; password = $PASSWORD; firstName = "Dup"; lastName = "Test"; role = "ADMIN"; hireDate = "2024-01-01" } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "POST /users - Duplicate email returns 409" 409 $r.Status

# COLLAB without squad
$body = @{ email = "nosquad@devoteam.com"; password = $PASSWORD; firstName = "No"; lastName = "Squad"; role = "COLLABORATOR"; hireDate = "2024-01-01" } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "POST /users - COLLABORATOR without squad returns 400" 400 $r.Status

# Update
Write-Host "`n> PUT /users - Update" -ForegroundColor Yellow
$body = @{ firstName = "Super"; lastName = "Admin"; phone = "+212612345678" } | ConvertTo-Json
$r = Do-Request -Method "PUT" -Url "$BASE_URL/users/$ADMIN_ID" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "PUT /users/:id - ADMIN updates self" 200 $r.Status

if ($COLLAB_TOKEN) {
    $body = @{ firstName = "Jean"; lastName = "Collaborateur"; phone = "+212699999999" } | ConvertTo-Json
    $r = Do-Request -Method "PUT" -Url "$BASE_URL/users/$COLLAB_ID" -Token $COLLAB_TOKEN -JsonBody $body
    Assert-Status "PUT /users/:id - COLLABORATOR updates own profile" 200 $r.Status

    $body = @{ firstName = "Hacked"; lastName = "Admin" } | ConvertTo-Json
    $r = Do-Request -Method "PUT" -Url "$BASE_URL/users/$ADMIN_ID" -Token $COLLAB_TOKEN -JsonBody $body
    Assert-Status "PUT /users/:id - COLLABORATOR cannot update another (403)" 403 $r.Status
}

# Delete
Write-Host "`n> DELETE /users - Soft delete (ADMIN only)" -ForegroundColor Yellow
$delEmail = "to-delete-$timestamp@devoteam.com"
$body = @{ email = $delEmail; password = $PASSWORD; firstName = "Delete"; lastName = "Me"; role = "DIRECTOR"; hireDate = "2024-01-01" } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $ADMIN_TOKEN -JsonBody $body
$DEL_ID = $null
if ($r.Status -eq 201) { $DEL_ID = ($r.Body | ConvertFrom-Json).id }

if ($DEL_ID) {
    $r = Do-Request -Method "DELETE" -Url "$BASE_URL/users/$DEL_ID" -Token $ADMIN_TOKEN
    Assert-Status "DELETE /users/:id - ADMIN soft-deletes user" 204 $r.Status
}
if ($COLLAB_TOKEN) {
    $r = Do-Request -Method "DELETE" -Url "$BASE_URL/users/$ADMIN_ID" -Token $COLLAB_TOKEN
    Assert-Status "DELETE /users/:id - COLLABORATOR cannot delete (403)" 403 $r.Status
}

# ============================================================================
# 3. CERTIFICATIONS
# ============================================================================
Write-Host "`n--- 3. CERTIFICATIONS (/api/v1/certifications) ---" -ForegroundColor Cyan

Write-Host "`n> GET /certifications - List & Filters" -ForegroundColor Yellow
$r = Do-Request -Method "GET" -Url "$BASE_URL/certifications" -Token $ADMIN_TOKEN
Assert-Status "GET /certifications - List all" 200 $r.Status

$r = Do-Request -Method "GET" -Url "$BASE_URL/certifications?provider=Microsoft" -Token $ADMIN_TOKEN
Assert-Status "GET /certifications?provider=Microsoft" 200 $r.Status

$r = Do-Request -Method "GET" -Url "$BASE_URL/certifications?search=Azure" -Token $ADMIN_TOKEN
Assert-Status "GET /certifications?search=Azure" 200 $r.Status

$r = Do-Request -Method "GET" -Url "$BASE_URL/certifications/$CERT_AZ900_ID" -Token $ADMIN_TOKEN
Assert-Status "GET /certifications/:id - AZ-900 details" 200 $r.Status

$r = Do-Request -Method "GET" -Url "$BASE_URL/certifications/00000000-0000-0000-0000-000000000000" -Token $ADMIN_TOKEN
Assert-Status "GET /certifications/:id - Non-existent returns 404" 404 $r.Status

Write-Host "`n> POST /certifications - RBAC" -ForegroundColor Yellow
$certCode = "TEST-$timestamp"
$body = @{ code = $certCode; name = "Test Cert"; provider = "TestProvider"; difficulty = "INTERMEDIATE"; priority = "NORMAL"; squads = @() } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/certifications" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "POST /certifications - ADMIN creates" 201 $r.Status $r.Body
$NEW_CERT_ID = $null
if ($r.Status -eq 201) { $NEW_CERT_ID = ($r.Body | ConvertFrom-Json).id }

if ($TM_TOKEN) {
    $body = @{ code = "TM-$timestamp"; name = "TM Cert"; provider = "TM"; difficulty = "FOUNDATIONAL"; priority = "MANDATORY"; squads = @() } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/certifications" -Token $TM_TOKEN -JsonBody $body
    Assert-Status "POST /certifications - TRAINING_MANAGER creates" 201 $r.Status
}
if ($COLLAB_TOKEN) {
    $body = @{ code = "FAIL"; name = "Fail"; provider = "X"; difficulty = "FOUNDATIONAL"; priority = "NORMAL"; squads = @() } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/certifications" -Token $COLLAB_TOKEN -JsonBody $body
    Assert-Status "POST /certifications - COLLABORATOR cannot create (403)" 403 $r.Status
}
if ($CM_TOKEN) {
    $body = @{ code = "FAIL2"; name = "Fail2"; provider = "X"; difficulty = "FOUNDATIONAL"; priority = "NORMAL"; squads = @() } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/certifications" -Token $CM_TOKEN -JsonBody $body
    Assert-Status "POST /certifications - CAREER_MANAGER cannot create (403)" 403 $r.Status
}
if ($DIR_TOKEN) {
    $body = @{ code = "FAIL3"; name = "Fail3"; provider = "X"; difficulty = "FOUNDATIONAL"; priority = "NORMAL"; squads = @() } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/certifications" -Token $DIR_TOKEN -JsonBody $body
    Assert-Status "POST /certifications - DIRECTOR cannot create (403)" 403 $r.Status
}

if ($NEW_CERT_ID) {
    Write-Host "`n> PUT /certifications/:id" -ForegroundColor Yellow
    $body = @{ code = $certCode; name = "Updated Test Cert"; provider = "TestProvider"; difficulty = "ADVANCED"; priority = "HIGH"; squads = @() } | ConvertTo-Json
    $r = Do-Request -Method "PUT" -Url "$BASE_URL/certifications/$NEW_CERT_ID" -Token $ADMIN_TOKEN -JsonBody $body
    Assert-Status "PUT /certifications/:id - ADMIN updates" 200 $r.Status

    Write-Host "`n> DELETE /certifications/:id" -ForegroundColor Yellow
    $r = Do-Request -Method "DELETE" -Url "$BASE_URL/certifications/$NEW_CERT_ID" -Token $ADMIN_TOKEN
    Assert-Status "DELETE /certifications/:id - ADMIN deletes" 204 $r.Status
}

# ============================================================================
# 4. TRAININGS
# ============================================================================
Write-Host "`n--- 4. TRAININGS (/api/v1/trainings) ---" -ForegroundColor Cyan

$r = Do-Request -Method "GET" -Url "$BASE_URL/trainings" -Token $ADMIN_TOKEN
Assert-Status "GET /trainings - List all" 200 $r.Status

$r = Do-Request -Method "GET" -Url "$BASE_URL/trainings?type=UDEMY_BUSINESS" -Token $ADMIN_TOKEN
Assert-Status "GET /trainings?type=UDEMY_BUSINESS" 200 $r.Status

$r = Do-Request -Method "GET" -Url "$BASE_URL/trainings/$TRAINING_CC_ID" -Token $ADMIN_TOKEN
Assert-Status "GET /trainings/:id - Details" 200 $r.Status

$body = @{ title = "Test Training $timestamp"; type = "INTERNAL"; provider = "TestCorp"; priority = "OPTIONAL"; squads = @() } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/trainings" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "POST /trainings - ADMIN creates" 201 $r.Status $r.Body
$NEW_TRAINING_ID = $null
if ($r.Status -eq 201) { $NEW_TRAINING_ID = ($r.Body | ConvertFrom-Json).id }

if ($COLLAB_TOKEN) {
    $body = @{ title = "Fail Training"; type = "INTERNAL"; provider = "X"; priority = "OPTIONAL"; squads = @() } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/trainings" -Token $COLLAB_TOKEN -JsonBody $body
    Assert-Status "POST /trainings - COLLABORATOR cannot create (403)" 403 $r.Status
}

if ($NEW_TRAINING_ID) {
    $r = Do-Request -Method "DELETE" -Url "$BASE_URL/trainings/$NEW_TRAINING_ID" -Token $ADMIN_TOKEN
    Assert-Status "DELETE /trainings/:id - ADMIN deletes" 204 $r.Status
}

# ============================================================================
# 5. ASSIGNMENTS
# ============================================================================
Write-Host "`n--- 5. ASSIGNMENTS (/api/v1/assignments) ---" -ForegroundColor Cyan

Write-Host "`n> GET /assignments - RLS per role" -ForegroundColor Yellow
$r = Do-Request -Method "GET" -Url "$BASE_URL/assignments" -Token $ADMIN_TOKEN
Assert-Status "GET /assignments - ADMIN sees all" 200 $r.Status

if ($CM_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/assignments" -Token $CM_TOKEN
    Assert-Status "GET /assignments - CM sees managed users" 200 $r.Status
}
if ($LEAD_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/assignments" -Token $LEAD_TOKEN
    Assert-Status "GET /assignments - SQUAD_LEAD sees squad" 200 $r.Status
}
if ($COLLAB_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/assignments" -Token $COLLAB_TOKEN
    Assert-Status "GET /assignments - COLLABORATOR sees own only" 200 $r.Status
}
if ($DIR_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/assignments" -Token $DIR_TOKEN
    Assert-Status "GET /assignments - DIRECTOR sees all (read-only)" 200 $r.Status
}
if ($TM_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/assignments" -Token $TM_TOKEN
    Assert-Status "GET /assignments - TRAINING_MANAGER sees all" 200 $r.Status
}

# Filters
$r = Do-Request -Method "GET" -Url "$BASE_URL/assignments?itemType=CERTIFICATION" -Token $ADMIN_TOKEN
Assert-Status "GET /assignments?itemType=CERTIFICATION" 200 $r.Status

$r = Do-Request -Method "GET" -Url "$BASE_URL/assignments?userId=$COLLAB_ID" -Token $ADMIN_TOKEN
Assert-Status "GET /assignments?userId=..." 200 $r.Status

Write-Host "`n> POST /assignments - Create" -ForegroundColor Yellow

$body = @{ email = "assigncollab_$timestamp@devoteam.com"; password = $PASSWORD; firstName = "Assign"; lastName = "Collab"; role = "COLLABORATOR"; hireDate = "2024-01-01"; squadId = $JAVA_SQUAD_ID } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $ADMIN_TOKEN -JsonBody $body
$ASSIGN_COLLAB_ID = $null
if ($r.Status -eq 201) { $ASSIGN_COLLAB_ID = ($r.Body | ConvertFrom-Json).id }

$body = @{ managerId = $CM_ID; collaboratorId = $ASSIGN_COLLAB_ID } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/manager-assignments" -Token $ADMIN_TOKEN -JsonBody $body

$body = @{ itemType = "TRAINING"; itemId = $TRAINING_CC_ID; userId = $ASSIGN_COLLAB_ID; notes = "Test assignment" } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/assignments" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "POST /assignments - ADMIN creates training assignment" 201 $r.Status $r.Body
$NEW_ASSIGN_ID = $null
if ($r.Status -eq 201) { $NEW_ASSIGN_ID = ($r.Body | ConvertFrom-Json).id }

if ($CM_TOKEN) {
    $body = @{ itemType = "CERTIFICATION"; itemId = $CERT_AZ900_ID; userId = $ASSIGN_COLLAB_ID; notes = "CM assigned" } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/assignments" -Token $CM_TOKEN -JsonBody $body
    Assert-Status "POST /assignments - CM creates for managed collab" 201 $r.Status $r.Body
    $CM_ASSIGN_ID = $null
    if ($r.Status -eq 201) { $CM_ASSIGN_ID = ($r.Body | ConvertFrom-Json).id }

    # CM cannot assign to unmanaged
    $body = @{ itemType = "CERTIFICATION"; itemId = $CERT_AZ900_ID; userId = $OTHER_ID } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/assignments" -Token $CM_TOKEN -JsonBody $body
    Assert-Status "POST /assignments - CM cannot assign to unmanaged (403)" 403 $r.Status
}

if ($LEAD_TOKEN) {
    $body = @{ itemType = "CERTIFICATION"; itemId = $CERT_AZ900_ID; userId = $COLLAB_ID } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/assignments" -Token $LEAD_TOKEN -JsonBody $body
    Assert-Status "POST /assignments - SQUAD_LEAD cannot create (403)" 403 $r.Status
}

# Status workflow
Write-Host "`n> PUT /assignments - Workflow" -ForegroundColor Yellow
if ($CM_ASSIGN_ID) {
    $body = @{ statusCertification = "APPROVED" } | ConvertTo-Json
    $r = Do-Request -Method "PUT" -Url "$BASE_URL/assignments/$CM_ASSIGN_ID" -Token $ADMIN_TOKEN -JsonBody $body
    Assert-Status "PUT /assignments - PENDING->APPROVED" 200 $r.Status

    # Invalid: APPROVED->COMPLETED (skipping steps)
    $body = @{ statusCertification = "COMPLETED" } | ConvertTo-Json
    $r = Do-Request -Method "PUT" -Url "$BASE_URL/assignments/$CM_ASSIGN_ID" -Token $ADMIN_TOKEN -JsonBody $body
    Assert-Status "PUT /assignments - Invalid APPROVED->COMPLETED (409)" 409 $r.Status
}

if ($NEW_ASSIGN_ID) {
    $body = @{ statusTraining = "APPROVED" } | ConvertTo-Json
    $r = Do-Request -Method "PUT" -Url "$BASE_URL/assignments/$NEW_ASSIGN_ID" -Token $ADMIN_TOKEN -JsonBody $body
    Assert-Status "PUT /assignments - Training PENDING->APPROVED" 200 $r.Status

    $body = @{ statusTraining = "PLANNED" } | ConvertTo-Json
    $r = Do-Request -Method "PUT" -Url "$BASE_URL/assignments/$NEW_ASSIGN_ID" -Token $ADMIN_TOKEN -JsonBody $body
    Assert-Status "PUT /assignments - Training APPROVED->PLANNED" 200 $r.Status
}

# ============================================================================
# 6. RATINGS
# ============================================================================
Write-Host "`n--- 6. RATINGS (/api/v1/certifications/:id/ratings) ---" -ForegroundColor Cyan

$r = Do-Request -Method "GET" -Url "$BASE_URL/certifications/$CERT_AZ204_ID/ratings" -Token $ADMIN_TOKEN
Assert-Status "GET /ratings - List ratings" 200 $r.Status

if ($COLLAB_TOKEN) {
    $body = @{ rating = 5; comment = "Great!"; wouldRecommend = $true } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/certifications/$CERT_AZ900_ID/ratings" -Token $COLLAB_TOKEN -JsonBody $body
    Assert-Status "POST /ratings - COLLABORATOR cannot rate without completing (403)" 403 $r.Status
}

$body = @{ rating = 5; comment = "Admin review"; wouldRecommend = $true } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/certifications/$CERT_AZ900_ID/ratings" -Token $ADMIN_TOKEN -JsonBody $body
Assert-Status "POST /ratings - ADMIN cannot rate (403)" 403 $r.Status

# ============================================================================
# 7. MANAGER ASSIGNMENTS
# ============================================================================
Write-Host "`n--- 7. MANAGER ASSIGNMENTS (/api/v1/manager-assignments) ---" -ForegroundColor Cyan

$r = Do-Request -Method "GET" -Url "$BASE_URL/manager-assignments/hierarchy" -Token $ADMIN_TOKEN
Assert-Status "GET /hierarchy - ADMIN sees CMs" 200 $r.Status

if ($COLLAB_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/manager-assignments/hierarchy" -Token $COLLAB_TOKEN
    Assert-Status "GET /hierarchy - COLLABORATOR cannot access (403)" 403 $r.Status
}

$r = Do-Request -Method "GET" -Url "$BASE_URL/manager-assignments/$CM_ID/collaborators" -Token $ADMIN_TOKEN
Assert-Status "GET /collaborators - ADMIN sees CM's collabs" 200 $r.Status

$body = @{ email = "newcollab_$timestamp@devoteam.com"; password = $PASSWORD; firstName = "New"; lastName = "Collab"; role = "COLLABORATOR"; hireDate = "2024-01-01"; squadId = $JAVA_SQUAD_ID } | ConvertTo-Json
$r = Do-Request -Method "POST" -Url "$BASE_URL/users" -Token $ADMIN_TOKEN -JsonBody $body
$NEW_COLLAB_ID = $null
if ($r.Status -eq 201) { $NEW_COLLAB_ID = ($r.Body | ConvertFrom-Json).id }

if ($NEW_COLLAB_ID) {
    $body = @{ managerId = $CM_ID; collaboratorId = $NEW_COLLAB_ID } | ConvertTo-Json
    $r = Do-Request -Method "POST" -Url "$BASE_URL/manager-assignments" -Token $ADMIN_TOKEN -JsonBody $body
    Assert-Status "POST /manager-assignments - ADMIN assigns" 201 $r.Status

    $r = Do-Request -Method "DELETE" -Url "$BASE_URL/manager-assignments/$CM_ID/$NEW_COLLAB_ID" -Token $ADMIN_TOKEN
    Assert-Status "DELETE /manager-assignments - ADMIN removes" 204 $r.Status
} else {
    Write-Host "  [FAIL] Could not create NEW_COLLAB_ID for manager tests" -ForegroundColor Red
}

# ============================================================================
# 8. NOTIFICATIONS
# ============================================================================
Write-Host "`n--- 8. NOTIFICATIONS (/api/v1/notifications) ---" -ForegroundColor Cyan

if ($COLLAB_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/notifications" -Token $COLLAB_TOKEN
    Assert-Status "GET /notifications - COLLABORATOR gets own" 200 $r.Status
}

$r = Do-Request -Method "GET" -Url "$BASE_URL/notifications" -Token $ADMIN_TOKEN
Assert-Status "GET /notifications - ADMIN gets own" 200 $r.Status

# ============================================================================
# 9. CERTIFICATES
# ============================================================================
Write-Host "`n--- 9. CERTIFICATES (/api/v1/certificates) ---" -ForegroundColor Cyan

$r = Do-Request -Method "GET" -Url "$BASE_URL/certificates/00000000-0000-0000-0000-000000000000/download" -Token $ADMIN_TOKEN
Assert-Status "GET /certificates/:id/download - Non-existent (404)" 404 $r.Status

# ============================================================================
# 10. LOGOUT
# ============================================================================
Write-Host "`n--- 10. LOGOUT (/api/v1/auth/logout) ---" -ForegroundColor Cyan

$r = Do-Request -Method "POST" -Url "$BASE_URL/auth/logout" -Token $ADMIN_TOKEN
Assert-Status "POST /auth/logout - Revoke refresh tokens" 200 $r.Status

# ============================================================================
# 11. DASHBOARD / STATISTICS
# ============================================================================
Write-Host "`n--- 11. DASHBOARD / STATISTICS (/api/v1/dashboard/stats) ---" -ForegroundColor Cyan

$r = Do-Request -Method "GET" -Url "$BASE_URL/dashboard/stats" -Token $ADMIN_TOKEN
Assert-Status "GET /dashboard/stats - ADMIN accesses" 200 $r.Status

if ($TM_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/dashboard/stats" -Token $TM_TOKEN
    Assert-Status "GET /dashboard/stats - TRAINING_MANAGER accesses" 200 $r.Status
}

if ($COLLAB_TOKEN) {
    $r = Do-Request -Method "GET" -Url "$BASE_URL/dashboard/stats" -Token $COLLAB_TOKEN
    Assert-Status "GET /dashboard/stats - COLLABORATOR denied (403)" 403 $r.Status
}

# ============================================================================
# RESULTS
# ============================================================================
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                         TEST RESULTS" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Total:  $TOTAL"
Write-Host "  Passed: $PASS" -ForegroundColor Green
Write-Host "  Failed: $FAIL" -ForegroundColor Red
Write-Host "============================================================================" -ForegroundColor Cyan

if ($FAIL -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    foreach ($err in $ERRORS) { Write-Host $err -ForegroundColor Red }
    exit 1
} else {
    Write-Host "`nAll tests passed!" -ForegroundColor Green
    exit 0
}
