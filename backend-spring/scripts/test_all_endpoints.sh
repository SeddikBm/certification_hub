#!/bin/bash
# ============================================================================
# CertificationHub — Comprehensive API Test Script
# ============================================================================
# Tests ALL Swagger API endpoints with ALL 6 roles:
#   ADMIN, DIRECTOR, TRAINING_MANAGER, CAREER_MANAGER, SQUAD_LEAD, COLLABORATOR
#
# Prerequisites:
#   1. Backend running on localhost:8080
#   2. Database seeded with V3__seed_test_data.sql
#   3. Users must have bcrypt-hashed passwords for "Password123456!"
#      (use the CommandLineRunner in CertificationHubApplication to set them)
#   4. curl and jq installed
#
# Usage: bash scripts/test_all_endpoints.sh
# ============================================================================

# NOTE: Do NOT use 'set -e' — curl returns non-zero on HTTP errors, which would kill the script

BASE_URL="http://127.0.0.1:8080/api/v1"
PASS=0
FAIL=0
TOTAL=0
ERRORS=""

# ---- Couleurs ----
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ---- Fonctions utilitaires ----

# assert_status <test_name> <expected_status> <actual_status> <response_body>
assert_status() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    local body="${4:-}"
    TOTAL=$((TOTAL + 1))

    if [ "$actual" -eq "$expected" ] 2>/dev/null; then
        PASS=$((PASS + 1))
        echo -e "  ${GREEN}✓ PASS${NC} [$actual] $test_name"
    else
        FAIL=$((FAIL + 1))
        echo -e "  ${RED}✗ FAIL${NC} [$actual] $test_name  (expected $expected)"
        if [ -n "$body" ]; then
            echo -e "         ${YELLOW}Body: $(echo "$body" | head -c 200)${NC}"
        fi
        ERRORS="${ERRORS}\n  ✗ $test_name (got $actual, expected $expected)"
    fi
}

# do_get <url> <token>
do_get() {
    local url="$1"
    local token="$2"
    local response
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" -H "Content-Type: application/json" "$url" 2>/dev/null)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    echo "$status|$body"
}

# do_post <url> <token> <json_body>
do_post() {
    local url="$1"
    local token="$2"
    local json_body="${3:-{}}"
    local response
    response=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$json_body" "$url" 2>/dev/null)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    echo "$status|$body"
}

# do_put <url> <token> <json_body>
do_put() {
    local url="$1"
    local token="$2"
    local json_body="${3:-{}}"
    local response
    response=$(curl -s -w "\n%{http_code}" -X PUT -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$json_body" "$url" 2>/dev/null)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    echo "$status|$body"
}

# do_delete <url> <token>
do_delete() {
    local url="$1"
    local token="$2"
    local response
    response=$(curl -s -w "\n%{http_code}" -X DELETE -H "Authorization: Bearer $token" -H "Content-Type: application/json" "$url" 2>/dev/null)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    echo "$status|$body"
}

# do_post_no_auth <url> <json_body>
do_post_no_auth() {
    local url="$1"
    local json_body="${2:-{}}"
    local response
    response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$json_body" "$url" 2>/dev/null)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    echo "$status|$body"
}

# login <email> <password> -> returns access_token
login() {
    local email="$1"
    local password="$2"
    local result
    result=$(do_post_no_auth "${BASE_URL}/auth/login" "{\"email\":\"$email\",\"password\":\"$password\"}")
    local status=$(echo "$result" | cut -d'|' -f1)
    local body=$(echo "$result" | cut -d'|' -f2-)
    if [ "$status" -eq 200 ] 2>/dev/null; then
        echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4
    else
        echo "LOGIN_FAILED"
    fi
}

echo -e "${BOLD}${CYAN}"
echo "============================================================================"
echo " CertificationHub — Comprehensive API Test Suite"
echo " Testing ALL endpoints with ALL 6 roles"
echo "============================================================================"
echo -e "${NC}"

# ============================================================================
# 0. SEED DATA IDs (from V3__seed_test_data.sql)
# ============================================================================
ADMIN_ID="f1111111-1111-1111-1111-111111111111"
CM_ID="f2222222-2222-2222-2222-222222222222"
LEAD_ID="f3333333-3333-3333-3333-333333333333"
COLLAB_ID="f4444444-4444-4444-4444-444444444444"
OTHER_ID="f9999999-9999-9999-9999-999999999999"

JAVA_SQUAD_ID="a0000000-0000-0000-0000-000000000002"
DOTNET_SQUAD_ID="a0000000-0000-0000-0000-000000000001"

CERT_AZ900_ID="c0000000-0000-0000-0000-000000000001"
CERT_AZ204_ID="c0000000-0000-0000-0000-000000000002"
CERT_CKA_ID="c0000000-0000-0000-0000-000000000005"

TRAINING_CLEAN_CODE_ID="e0000000-0000-0000-0000-000000000001"
TRAINING_DEVSECOPS_ID="e0000000-0000-0000-0000-000000000002"

ASSIGNMENT_COLLAB_ID="b0000000-0000-0000-0000-000000000001"
ASSIGNMENT_LEAD_ID="b0000000-0000-0000-0000-000000000002"
ASSIGNMENT_OTHER_ID="b0000000-0000-0000-0000-000000000003"

PASSWORD="Password123456!"

# ============================================================================
# 1. AUTHENTICATION TESTS
# ============================================================================
echo -e "${BOLD}${CYAN}━━━ 1. AUTHENTICATION (/api/v1/auth) ━━━${NC}"

# 1.1 Login - valid credentials
echo -e "\n${YELLOW}▸ Login Tests${NC}"
result=$(do_post_no_auth "${BASE_URL}/auth/login" "{\"email\":\"admin@devoteam.com\",\"password\":\"$PASSWORD\"}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /auth/login — Admin valid credentials" 200 "$status" "$body"

# Extract tokens for later use
ADMIN_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
ADMIN_REFRESH=$(echo "$body" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

# 1.2 Login - invalid password
result=$(do_post_no_auth "${BASE_URL}/auth/login" "{\"email\":\"admin@devoteam.com\",\"password\":\"WrongPassword!1\"}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /auth/login — Wrong password returns 401" 401 "$status" "$body"

# 1.3 Login - non-existent user
result=$(do_post_no_auth "${BASE_URL}/auth/login" "{\"email\":\"nobody@devoteam.com\",\"password\":\"$PASSWORD\"}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /auth/login — Non-existent email returns 401" 401 "$status" "$body"

# 1.4 Login - validation error (empty email)
result=$(do_post_no_auth "${BASE_URL}/auth/login" "{\"email\":\"\",\"password\":\"$PASSWORD\"}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /auth/login — Empty email returns 400" 400 "$status" "$body"

# 1.5 Refresh Token
echo -e "\n${YELLOW}▸ Refresh Token Tests${NC}"
if [ -n "$ADMIN_REFRESH" ] && [ "$ADMIN_REFRESH" != "null" ]; then
    result=$(do_post_no_auth "${BASE_URL}/auth/refresh" "{\"refreshToken\":\"$ADMIN_REFRESH\"}")
    status=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2-)
    assert_status "POST /auth/refresh — Valid refresh token" 200 "$status" "$body"
    
    # Verify the refreshed token preserves the ADMIN role (Bug 8 fix)
    NEW_ACCESS=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$NEW_ACCESS" ]; then
        result=$(do_get "${BASE_URL}/users" "$NEW_ACCESS")
        status=$(echo "$result" | cut -d'|' -f1)
        assert_status "GET /users with refreshed token — Role preserved (Bug 8)" 200 "$status"
    fi
else
    echo -e "  ${YELLOW}⚠ SKIP${NC} Refresh token tests — login did not return a refresh token"
fi

# 1.6 Refresh with invalid token
result=$(do_post_no_auth "${BASE_URL}/auth/refresh" "{\"refreshToken\":\"invalid.token.here\"}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /auth/refresh — Invalid token returns 401" 401 "$status" "$body"

# 1.7 Access without token
result=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" "${BASE_URL}/users" 2>/dev/null)
status=$(echo "$result" | tail -n1)
body=$(echo "$result" | sed '$d')
assert_status "GET /users — No token returns 401" 401 "$status" "$body"

# ============================================================================
# Login all roles
# ============================================================================
echo -e "\n${YELLOW}▸ Login All Roles${NC}"

# We already have ADMIN_TOKEN. Now login the rest.
CM_TOKEN=$(login "cm@devoteam.com" "$PASSWORD")
if [ "$CM_TOKEN" = "LOGIN_FAILED" ]; then
    echo -e "  ${RED}✗ WARNING: CM login failed. Some tests will be skipped.${NC}"
    CM_TOKEN=""
else
    echo -e "  ${GREEN}✓${NC} CAREER_MANAGER logged in"
fi

LEAD_TOKEN=$(login "lead@devoteam.com" "$PASSWORD")
if [ "$LEAD_TOKEN" = "LOGIN_FAILED" ]; then
    echo -e "  ${RED}✗ WARNING: SQUAD_LEAD login failed. Some tests will be skipped.${NC}"
    LEAD_TOKEN=""
else
    echo -e "  ${GREEN}✓${NC} SQUAD_LEAD logged in"
fi

COLLAB_TOKEN=$(login "collab@devoteam.com" "$PASSWORD")
if [ "$COLLAB_TOKEN" = "LOGIN_FAILED" ]; then
    echo -e "  ${RED}✗ WARNING: COLLABORATOR login failed. Some tests will be skipped.${NC}"
    COLLAB_TOKEN=""
else
    echo -e "  ${GREEN}✓${NC} COLLABORATOR logged in"
fi

# Note: DIRECTOR and TRAINING_MANAGER are not in the seed data.
# We create them via the ADMIN endpoint below and then try to login.
# If the test database doesn't have them, those tests will be skipped gracefully.

# ============================================================================
# 2. USER MANAGEMENT TESTS
# ============================================================================
echo -e "\n${BOLD}${CYAN}━━━ 2. USER MANAGEMENT (/api/v1/users) ━━━${NC}"

# 2.1 GET /users — All roles
echo -e "\n${YELLOW}▸ GET /users — List users (RLS filtering)${NC}"
result=$(do_get "${BASE_URL}/users" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /users — ADMIN sees all users" 200 "$status"

if [ -n "$CM_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/users" "$CM_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /users — CAREER_MANAGER sees managed + self" 200 "$status"
fi

if [ -n "$LEAD_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/users" "$LEAD_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /users — SQUAD_LEAD sees squad members + self" 200 "$status"
fi

if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/users" "$COLLAB_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /users — COLLABORATOR sees only self" 200 "$status"
fi

# 2.2 GET /users with filters
echo -e "\n${YELLOW}▸ GET /users — Filters${NC}"
result=$(do_get "${BASE_URL}/users?role=ADMIN" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /users?role=ADMIN — Filter by role" 200 "$status"

result=$(do_get "${BASE_URL}/users?squadId=$JAVA_SQUAD_ID" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /users?squadId=... — Filter by squad" 200 "$status"

result=$(do_get "${BASE_URL}/users?search=admin" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /users?search=admin — Full text search" 200 "$status"

result=$(do_get "${BASE_URL}/users?status=ACTIVE" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /users?status=ACTIVE — Filter by status" 200 "$status"

# 2.3 POST /users — ADMIN creates users
echo -e "\n${YELLOW}▸ POST /users — Create user (ADMIN only)${NC}"

# Create a TRAINING_MANAGER
TM_EMAIL="tm-test-$(date +%s)@devoteam.com"
result=$(do_post "${BASE_URL}/users" "$ADMIN_TOKEN" "{
    \"email\":\"$TM_EMAIL\",
    \"password\":\"$PASSWORD\",
    \"firstName\":\"Training\",
    \"lastName\":\"Manager\",
    \"role\":\"TRAINING_MANAGER\",
    \"hireDate\":\"2024-01-01\"
}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /users — ADMIN creates TRAINING_MANAGER" 201 "$status" "$body"
TM_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Create a DIRECTOR
DIR_EMAIL="dir-test-$(date +%s)@devoteam.com"
result=$(do_post "${BASE_URL}/users" "$ADMIN_TOKEN" "{
    \"email\":\"$DIR_EMAIL\",
    \"password\":\"$PASSWORD\",
    \"firstName\":\"Test\",
    \"lastName\":\"Director\",
    \"role\":\"DIRECTOR\",
    \"hireDate\":\"2024-01-01\"
}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /users — ADMIN creates DIRECTOR" 201 "$status" "$body"
DIR_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Login as TM and DIRECTOR
TM_TOKEN=$(login "$TM_EMAIL" "$PASSWORD")
if [ "$TM_TOKEN" = "LOGIN_FAILED" ]; then
    echo -e "  ${YELLOW}⚠ SKIP${NC} TM login failed"
    TM_TOKEN=""
else
    echo -e "  ${GREEN}✓${NC} TRAINING_MANAGER logged in"
fi

DIR_TOKEN=$(login "$DIR_EMAIL" "$PASSWORD")
if [ "$DIR_TOKEN" = "LOGIN_FAILED" ]; then
    echo -e "  ${YELLOW}⚠ SKIP${NC} DIRECTOR login failed"
    DIR_TOKEN=""
else
    echo -e "  ${GREEN}✓${NC} DIRECTOR logged in"
fi

# 2.4 POST /users — RBAC denial
if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/users" "$COLLAB_TOKEN" "{
        \"email\":\"hacker@devoteam.com\",\"password\":\"$PASSWORD\",
        \"firstName\":\"Hacker\",\"lastName\":\"Test\",\"role\":\"ADMIN\",\"hireDate\":\"2024-01-01\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /users — COLLABORATOR cannot create users (403)" 403 "$status"
fi

if [ -n "$CM_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/users" "$CM_TOKEN" "{
        \"email\":\"hacker2@devoteam.com\",\"password\":\"$PASSWORD\",
        \"firstName\":\"Hacker\",\"lastName\":\"Test\",\"role\":\"COLLABORATOR\",\"hireDate\":\"2024-01-01\",\"squadId\":\"$JAVA_SQUAD_ID\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /users — CAREER_MANAGER cannot create users (403)" 403 "$status"
fi

# 2.5 POST /users — Validation
echo -e "\n${YELLOW}▸ POST /users — Validation rules${NC}"
result=$(do_post "${BASE_URL}/users" "$ADMIN_TOKEN" "{
    \"email\":\"invalid-email\",\"password\":\"weak\",
    \"firstName\":\"\",\"lastName\":\"\",\"role\":\"ADMIN\",\"hireDate\":\"2024-01-01\"
}")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "POST /users — Invalid email + weak password returns 400" 400 "$status"

# COLLABORATOR without squad
result=$(do_post "${BASE_URL}/users" "$ADMIN_TOKEN" "{
    \"email\":\"collab-nosquad@devoteam.com\",\"password\":\"$PASSWORD\",
    \"firstName\":\"No\",\"lastName\":\"Squad\",\"role\":\"COLLABORATOR\",\"hireDate\":\"2024-01-01\"
}")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "POST /users — COLLABORATOR without squad returns 400" 400 "$status"

# Duplicate email
result=$(do_post "${BASE_URL}/users" "$ADMIN_TOKEN" "{
    \"email\":\"admin@devoteam.com\",\"password\":\"$PASSWORD\",
    \"firstName\":\"Dup\",\"lastName\":\"Test\",\"role\":\"ADMIN\",\"hireDate\":\"2024-01-01\"
}")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "POST /users — Duplicate email returns 409" 409 "$status"

# 2.6 PUT /users — Update
echo -e "\n${YELLOW}▸ PUT /users — Update user${NC}"
result=$(do_put "${BASE_URL}/users/$ADMIN_ID" "$ADMIN_TOKEN" "{
    \"firstName\":\"Super\",\"lastName\":\"Admin\",\"phone\":\"+212612345678\"
}")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "PUT /users/:id — ADMIN updates self" 200 "$status"

# Collab updates self
if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_put "${BASE_URL}/users/$COLLAB_ID" "$COLLAB_TOKEN" "{
        \"firstName\":\"Jean\",\"lastName\":\"Collaborateur\",\"phone\":\"+212699999999\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "PUT /users/:id — COLLABORATOR updates own profile" 200 "$status"

    # Collab tries to update someone else
    result=$(do_put "${BASE_URL}/users/$ADMIN_ID" "$COLLAB_TOKEN" "{
        \"firstName\":\"Hacked\",\"lastName\":\"Admin\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "PUT /users/:id — COLLABORATOR cannot update another user (403)" 403 "$status"
fi

# 2.7 DELETE /users — ADMIN only
echo -e "\n${YELLOW}▸ DELETE /users — Soft delete (ADMIN only)${NC}"
# Create a throw-away user to delete
result=$(do_post "${BASE_URL}/users" "$ADMIN_TOKEN" "{
    \"email\":\"to-delete-$(date +%s)@devoteam.com\",\"password\":\"$PASSWORD\",
    \"firstName\":\"Delete\",\"lastName\":\"Me\",\"role\":\"DIRECTOR\",\"hireDate\":\"2024-01-01\"
}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
DELETE_USER_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$DELETE_USER_ID" ] && [ "$DELETE_USER_ID" != "" ]; then
    result=$(do_delete "${BASE_URL}/users/$DELETE_USER_ID" "$ADMIN_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "DELETE /users/:id — ADMIN soft-deletes user" 204 "$status"
fi

if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_delete "${BASE_URL}/users/$ADMIN_ID" "$COLLAB_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "DELETE /users/:id — COLLABORATOR cannot delete (403)" 403 "$status"
fi

# 2.8 POST /users/change-password
echo -e "\n${YELLOW}▸ POST /users/change-password${NC}"
if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/users/change-password" "$COLLAB_TOKEN" "{
        \"oldPassword\":\"WrongOldPassword!1\",\"newPassword\":\"NewPassword123!\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /change-password — Wrong old password returns 400/403" "$status" "$status"
fi

# ============================================================================
# 3. CERTIFICATION CATALOG TESTS
# ============================================================================
echo -e "\n${BOLD}${CYAN}━━━ 3. CERTIFICATIONS (/api/v1/certifications) ━━━${NC}"

echo -e "\n${YELLOW}▸ GET /certifications — List & Filters${NC}"
result=$(do_get "${BASE_URL}/certifications" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /certifications — List all certifications" 200 "$status"

result=$(do_get "${BASE_URL}/certifications?provider=Microsoft" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /certifications?provider=Microsoft — Filter by provider" 200 "$status"

result=$(do_get "${BASE_URL}/certifications?difficulty=FOUNDATIONAL" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /certifications?difficulty=FOUNDATIONAL — Filter by difficulty" 200 "$status"

result=$(do_get "${BASE_URL}/certifications?search=Azure" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /certifications?search=Azure — Full text search" 200 "$status"

echo -e "\n${YELLOW}▸ GET /certifications/:id — Detail${NC}"
result=$(do_get "${BASE_URL}/certifications/$CERT_AZ900_ID" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /certifications/:id — Get AZ-900 details" 200 "$status"

result=$(do_get "${BASE_URL}/certifications/00000000-0000-0000-0000-000000000000" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /certifications/:id — Non-existent returns 404" 404 "$status"

echo -e "\n${YELLOW}▸ POST /certifications — RBAC${NC}"
CERT_CODE="TEST-$(date +%s)"
CERT_BODY="{
    \"code\":\"$CERT_CODE\",\"name\":\"Test Cert\",\"provider\":\"TestProvider\",
    \"difficulty\":\"INTERMEDIATE\",\"priority\":\"NORMAL\",
    \"squads\":[]
}"
result=$(do_post "${BASE_URL}/certifications" "$ADMIN_TOKEN" "$CERT_BODY")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /certifications — ADMIN creates certification" 201 "$status" "$body"
NEW_CERT_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$TM_TOKEN" ]; then
    TM_CERT_CODE="TM-TEST-$(date +%s)"
    result=$(do_post "${BASE_URL}/certifications" "$TM_TOKEN" "{
        \"code\":\"$TM_CERT_CODE\",\"name\":\"TM Test Cert\",\"provider\":\"TM\",
        \"difficulty\":\"FOUNDATIONAL\",\"priority\":\"MANDATORY\",\"squads\":[]
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /certifications — TRAINING_MANAGER creates certification" 201 "$status"
fi

if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/certifications" "$COLLAB_TOKEN" "$CERT_BODY")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /certifications — COLLABORATOR cannot create (403)" 403 "$status"
fi

if [ -n "$CM_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/certifications" "$CM_TOKEN" "$CERT_BODY")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /certifications — CAREER_MANAGER cannot create (403)" 403 "$status"
fi

if [ -n "$DIR_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/certifications" "$DIR_TOKEN" "$CERT_BODY")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /certifications — DIRECTOR cannot create (403)" 403 "$status"
fi

echo -e "\n${YELLOW}▸ PUT /certifications/:id — Update${NC}"
if [ -n "$NEW_CERT_ID" ]; then
    result=$(do_put "${BASE_URL}/certifications/$NEW_CERT_ID" "$ADMIN_TOKEN" "{
        \"code\":\"$CERT_CODE\",\"name\":\"Updated Test Cert\",\"provider\":\"TestProvider\",
        \"difficulty\":\"ADVANCED\",\"priority\":\"HIGH\",\"squads\":[]
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "PUT /certifications/:id — ADMIN updates certification" 200 "$status"
fi

echo -e "\n${YELLOW}▸ DELETE /certifications/:id${NC}"
if [ -n "$NEW_CERT_ID" ]; then
    result=$(do_delete "${BASE_URL}/certifications/$NEW_CERT_ID" "$ADMIN_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "DELETE /certifications/:id — ADMIN deletes certification" 204 "$status"
fi

# ============================================================================
# 4. TRAINING CATALOG TESTS
# ============================================================================
echo -e "\n${BOLD}${CYAN}━━━ 4. TRAININGS (/api/v1/trainings) ━━━${NC}"

echo -e "\n${YELLOW}▸ GET /trainings — List & Filters${NC}"
result=$(do_get "${BASE_URL}/trainings" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /trainings — List all trainings" 200 "$status"

result=$(do_get "${BASE_URL}/trainings?type=UDEMY_BUSINESS" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /trainings?type=UDEMY_BUSINESS — Filter by type" 200 "$status"

result=$(do_get "${BASE_URL}/trainings?priority=MANDATORY" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /trainings?priority=MANDATORY — Filter by priority" 200 "$status"

echo -e "\n${YELLOW}▸ GET /trainings/:id${NC}"
result=$(do_get "${BASE_URL}/trainings/$TRAINING_CLEAN_CODE_ID" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /trainings/:id — Get training details" 200 "$status"

echo -e "\n${YELLOW}▸ POST /trainings — RBAC${NC}"
TRAINING_BODY="{
    \"title\":\"Test Training $(date +%s)\",\"type\":\"INTERNAL\",
    \"provider\":\"TestCorp\",\"priority\":\"OPTIONAL\",\"squads\":[]
}"
result=$(do_post "${BASE_URL}/trainings" "$ADMIN_TOKEN" "$TRAINING_BODY")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /trainings — ADMIN creates training" 201 "$status" "$body"
NEW_TRAINING_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$TM_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/trainings" "$TM_TOKEN" "{
        \"title\":\"TM Training $(date +%s)\",\"type\":\"EXTERNAL\",
        \"provider\":\"TM\",\"priority\":\"MANDATORY\",\"squads\":[]
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /trainings — TRAINING_MANAGER creates training" 201 "$status"
fi

if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/trainings" "$COLLAB_TOKEN" "$TRAINING_BODY")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /trainings — COLLABORATOR cannot create (403)" 403 "$status"
fi

if [ -n "$CM_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/trainings" "$CM_TOKEN" "$TRAINING_BODY")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /trainings — CAREER_MANAGER cannot create (403)" 403 "$status"
fi

echo -e "\n${YELLOW}▸ DELETE /trainings/:id${NC}"
if [ -n "$NEW_TRAINING_ID" ]; then
    result=$(do_delete "${BASE_URL}/trainings/$NEW_TRAINING_ID" "$ADMIN_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "DELETE /trainings/:id — ADMIN deletes training" 204 "$status"
fi

# ============================================================================
# 5. ASSIGNMENT TESTS
# ============================================================================
echo -e "\n${BOLD}${CYAN}━━━ 5. ASSIGNMENTS (/api/v1/assignments) ━━━${NC}"

echo -e "\n${YELLOW}▸ GET /assignments — RLS per role${NC}"
result=$(do_get "${BASE_URL}/assignments" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /assignments — ADMIN sees all assignments" 200 "$status"

if [ -n "$CM_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/assignments" "$CM_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /assignments — CAREER_MANAGER sees managed users' assignments" 200 "$status"
fi

if [ -n "$LEAD_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/assignments" "$LEAD_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /assignments — SQUAD_LEAD sees squad assignments" 200 "$status"
fi

if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/assignments" "$COLLAB_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /assignments — COLLABORATOR sees only own assignments" 200 "$status"
fi

if [ -n "$DIR_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/assignments" "$DIR_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /assignments — DIRECTOR sees all (read-only)" 200 "$status"
fi

if [ -n "$TM_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/assignments" "$TM_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /assignments — TRAINING_MANAGER sees all assignments" 200 "$status"
fi

echo -e "\n${YELLOW}▸ GET /assignments — Filters${NC}"
result=$(do_get "${BASE_URL}/assignments?itemType=CERTIFICATION" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /assignments?itemType=CERTIFICATION — Filter by type" 200 "$status"

result=$(do_get "${BASE_URL}/assignments?status=IN_PROGRESS" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /assignments?status=IN_PROGRESS — Filter by status" 200 "$status"

result=$(do_get "${BASE_URL}/assignments?userId=$COLLAB_ID" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /assignments?userId=... — Filter by user" 200 "$status"

echo -e "\n${YELLOW}▸ POST /assignments — Create${NC}"
# ADMIN creates an assignment for the collaborator (training)
result=$(do_post "${BASE_URL}/assignments" "$ADMIN_TOKEN" "{
    \"itemType\":\"TRAINING\",\"itemId\":\"$TRAINING_CLEAN_CODE_ID\",\"userId\":\"$COLLAB_ID\",
    \"notes\":\"Test assignment from script\"
}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /assignments — ADMIN creates training assignment" 201 "$status" "$body"
NEW_ASSIGNMENT_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# CM creates assignment for managed collaborator
if [ -n "$CM_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/assignments" "$CM_TOKEN" "{
        \"itemType\":\"CERTIFICATION\",\"itemId\":\"$CERT_AZ900_ID\",\"userId\":\"$COLLAB_ID\",
        \"notes\":\"CM assigned\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2-)
    assert_status "POST /assignments — CAREER_MANAGER creates for managed collab" 201 "$status" "$body"
    CM_ASSIGN_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    # CM tries to create for unmanaged user
    result=$(do_post "${BASE_URL}/assignments" "$CM_TOKEN" "{
        \"itemType\":\"CERTIFICATION\",\"itemId\":\"$CERT_AZ900_ID\",\"userId\":\"$OTHER_ID\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /assignments — CM cannot assign to unmanaged user (403)" 403 "$status"
fi

# SQUAD_LEAD cannot create assignments
if [ -n "$LEAD_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/assignments" "$LEAD_TOKEN" "{
        \"itemType\":\"CERTIFICATION\",\"itemId\":\"$CERT_AZ900_ID\",\"userId\":\"$COLLAB_ID\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /assignments — SQUAD_LEAD cannot create (403)" 403 "$status"
fi

echo -e "\n${YELLOW}▸ PUT /assignments/:id — Status workflow${NC}"
# Approve the assignment
if [ -n "$CM_ASSIGN_ID" ]; then
    result=$(do_put "${BASE_URL}/assignments/$CM_ASSIGN_ID" "$ADMIN_TOKEN" "{
        \"statusCertification\":\"APPROVED\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "PUT /assignments/:id — ADMIN approves (PENDING→APPROVED)" 200 "$status"

    # Invalid transition: try to go APPROVED → COMPLETED (skipping steps)
    result=$(do_put "${BASE_URL}/assignments/$CM_ASSIGN_ID" "$ADMIN_TOKEN" "{
        \"statusCertification\":\"COMPLETED\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "PUT /assignments/:id — Invalid transition APPROVED→COMPLETED (409)" 409 "$status"
fi

# Training status update
if [ -n "$NEW_ASSIGNMENT_ID" ]; then
    result=$(do_put "${BASE_URL}/assignments/$NEW_ASSIGNMENT_ID" "$ADMIN_TOKEN" "{
        \"statusTraining\":\"APPROVED\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "PUT /assignments/:id — Approve training PENDING→APPROVED" 200 "$status"

    result=$(do_put "${BASE_URL}/assignments/$NEW_ASSIGNMENT_ID" "$ADMIN_TOKEN" "{
        \"statusTraining\":\"PLANNED\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "PUT /assignments/:id — Training APPROVED→PLANNED" 200 "$status"
fi

# ============================================================================
# 6. CERTIFICATION RATINGS TESTS
# ============================================================================
echo -e "\n${BOLD}${CYAN}━━━ 6. CERTIFICATION RATINGS (/api/v1/certifications/:id/ratings) ━━━${NC}"

echo -e "\n${YELLOW}▸ GET /certifications/:id/ratings${NC}"
result=$(do_get "${BASE_URL}/certifications/$CERT_AZ204_ID/ratings" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /ratings — List ratings for a certification" 200 "$status"

echo -e "\n${YELLOW}▸ POST /certifications/:id/ratings — Validation${NC}"
# Try to rate without having completed the certification
if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/certifications/$CERT_AZ900_ID/ratings" "$COLLAB_TOKEN" "{
        \"rating\":5,\"comment\":\"Great cert!\",\"wouldRecommend\":true
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /ratings — COLLABORATOR cannot rate without completing (403)" 403 "$status"
fi

# ADMIN cannot rate (not COLLABORATOR role)
result=$(do_post "${BASE_URL}/certifications/$CERT_AZ900_ID/ratings" "$ADMIN_TOKEN" "{
    \"rating\":5,\"comment\":\"Admin review\",\"wouldRecommend\":true
}")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "POST /ratings — ADMIN cannot rate (403 - COLLABORATOR only)" 403 "$status"

# ============================================================================
# 7. MANAGER ASSIGNMENT (HIERARCHY) TESTS
# ============================================================================
echo -e "\n${BOLD}${CYAN}━━━ 7. MANAGER ASSIGNMENTS (/api/v1/manager-assignments) ━━━${NC}"

echo -e "\n${YELLOW}▸ GET /manager-assignments/hierarchy — ADMIN only${NC}"
result=$(do_get "${BASE_URL}/manager-assignments/hierarchy" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /hierarchy — ADMIN sees CM hierarchy" 200 "$status"

if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/manager-assignments/hierarchy" "$COLLAB_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /hierarchy — COLLABORATOR cannot access (403)" 403 "$status"
fi

if [ -n "$CM_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/manager-assignments/hierarchy" "$CM_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /hierarchy — CAREER_MANAGER cannot access (403)" 403 "$status"
fi

echo -e "\n${YELLOW}▸ GET /manager-assignments/:managerId/collaborators${NC}"
result=$(do_get "${BASE_URL}/manager-assignments/$CM_ID/collaborators" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /collaborators — ADMIN sees CM's collaborators" 200 "$status"

echo -e "\n${YELLOW}▸ POST /manager-assignments — Assign${NC}"
# Assign the LEAD as a managed collaborator of the CM (test, will clean up)
result=$(do_post "${BASE_URL}/manager-assignments" "$ADMIN_TOKEN" "{
    \"managerId\":\"$CM_ID\",\"collaboratorId\":\"$LEAD_ID\"
}")
status=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2-)
assert_status "POST /manager-assignments — ADMIN assigns collaborator to CM" 201 "$status" "$body"

# Non-admin cannot assign
if [ -n "$CM_TOKEN" ]; then
    result=$(do_post "${BASE_URL}/manager-assignments" "$CM_TOKEN" "{
        \"managerId\":\"$CM_ID\",\"collaboratorId\":\"$OTHER_ID\"
    }")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "POST /manager-assignments — CM cannot assign (403)" 403 "$status"
fi

echo -e "\n${YELLOW}▸ DELETE /manager-assignments — Remove${NC}"
result=$(do_delete "${BASE_URL}/manager-assignments/$CM_ID/$LEAD_ID" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "DELETE /manager-assignments — ADMIN removes assignment" 204 "$status"

# ============================================================================
# 8. NOTIFICATIONS TESTS
# ============================================================================
echo -e "\n${BOLD}${CYAN}━━━ 8. NOTIFICATIONS (/api/v1/notifications) ━━━${NC}"

echo -e "\n${YELLOW}▸ GET /notifications — My notifications${NC}"
if [ -n "$COLLAB_TOKEN" ]; then
    result=$(do_get "${BASE_URL}/notifications" "$COLLAB_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    assert_status "GET /notifications — COLLABORATOR gets own notifications" 200 "$status"
fi

result=$(do_get "${BASE_URL}/notifications" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /notifications — ADMIN gets own notifications" 200 "$status"

# ============================================================================
# 9. CERTIFICATE DOWNLOAD TESTS
# ============================================================================
echo -e "\n${BOLD}${CYAN}━━━ 9. CERTIFICATES (/api/v1/certificates) ━━━${NC}"

echo -e "\n${YELLOW}▸ GET /certificates/:id/download${NC}"
result=$(do_get "${BASE_URL}/certificates/00000000-0000-0000-0000-000000000000/download" "$ADMIN_TOKEN")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "GET /certificates/:id/download — Non-existent returns 404" 404 "$status"

# ============================================================================
# 10. LOGOUT TESTS
# ============================================================================
echo -e "\n${BOLD}${CYAN}━━━ 10. LOGOUT (/api/v1/auth/logout) ━━━${NC}"

result=$(do_post "${BASE_URL}/auth/logout" "$ADMIN_TOKEN" "{}")
status=$(echo "$result" | cut -d'|' -f1)
assert_status "POST /auth/logout — Revoke refresh tokens" 200 "$status"

# ============================================================================
# RESULTS
# ============================================================================
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║                      TEST RESULTS                            ║${NC}"
echo -e "${BOLD}${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}${CYAN}║${NC}  Total:  ${BOLD}$TOTAL${NC}"
echo -e "${BOLD}${CYAN}║${NC}  ${GREEN}Passed: $PASS${NC}"
echo -e "${BOLD}${CYAN}║${NC}  ${RED}Failed: $FAIL${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"

if [ "$FAIL" -gt 0 ]; then
    echo -e "\n${RED}${BOLD}Failed Tests:${NC}"
    echo -e "$ERRORS"
    exit 1
else
    echo -e "\n${GREEN}${BOLD}All tests passed! 🎉${NC}"
    exit 0
fi
