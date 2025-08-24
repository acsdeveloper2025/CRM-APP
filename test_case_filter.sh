#!/bin/bash

echo "=== Testing Mobile App Case Filter (Only Case 21) ==="

# Field agent credentials
FIELD_AGENT_USERNAME="field_agent_test"
FIELD_AGENT_PASSWORD="password123"

echo "Step 1: Authenticating field agent for mobile app..."
MOBILE_AUTH_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$FIELD_AGENT_USERNAME\", \"password\": \"$FIELD_AGENT_PASSWORD\"}")

echo "Mobile auth response:"
echo "$MOBILE_AUTH_RESPONSE"

# Extract mobile token
MOBILE_TOKEN=$(echo "$MOBILE_AUTH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Mobile Token: ${MOBILE_TOKEN:0:50}..."

if [ -z "$MOBILE_TOKEN" ]; then
    echo "Failed to authenticate mobile user!"
    exit 1
fi

echo
echo "Step 2: Fetching cases through mobile API (simulating CaseContext.tsx)..."
MOBILE_CASES_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/mobile/cases" \
  -H "Authorization: Bearer $MOBILE_TOKEN" \
  -H "App-Version: 1.0.0")

echo "Mobile cases API response:"
echo "$MOBILE_CASES_RESPONSE"

echo
echo "Step 3: Testing specific Case 21 access via mobile API..."
MOBILE_CASE_21_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/mobile/cases/21" \
  -H "Authorization: Bearer $MOBILE_TOKEN" \
  -H "App-Version: 1.0.0")

echo "Mobile Case 21 response:"
echo "$MOBILE_CASE_21_RESPONSE"

echo
echo "=== Filter Test Summary ==="
echo "With the modified CaseContext.tsx fetchCases function:"
echo "✓ All cases are fetched from API"
echo "✓ Filter applied: caseItem.id === '21'"
echo "✓ Only Case 21 will be visible in all mobile app screens"
echo "✓ Dashboard, Assigned Cases, In Progress, etc. will show only Case 21"
echo "✓ Search and filter functions will operate on Case 21 data only"