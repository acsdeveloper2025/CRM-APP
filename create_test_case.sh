#!/bin/bash

echo "=== Creating Test Case for Mobile Assignment Testing ==="

# Admin token (valid)
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MGRjZjI0Ny03NTljLTQwNWQtYThmYi00Yzc4YjdiNzc3NDciLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiYXV0aE1ldGhvZCI6IlBBU1NXT1JEIiwiaWF0IjoxNzU1OTQ0OTA3LCJleHAiOjE3NTYwMzEzMDd9.LHrf4G598cq0kF1pVNbJsc8U_kwl78BoaHWEUoefhQM"

echo "Step 1: Getting available clients..."
CLIENT_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "Clients response: $CLIENT_RESPONSE"

# Extract first client ID
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Selected Client ID: $CLIENT_ID"

echo
echo "Step 2: Getting available users for assignment..."
USERS_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "Users response: $USERS_RESPONSE"

# Find a field agent or backend user for assignment - use known IDs from response
FIELD_AGENT_ID="bffea46e-57ab-4be8-b058-7557993af553"  # field_agent_test
BACKEND_USER_ID="bd1e7938-e676-4744-9136-6bfffb38ba4c"  # backend_user

echo "Field Agent ID: $FIELD_AGENT_ID"
echo "Backend User ID: $BACKEND_USER_ID"

# Use field agent if available, otherwise backend user
ASSIGN_TO_ID=${FIELD_AGENT_ID:-$BACKEND_USER_ID}
echo "Assigning to: $ASSIGN_TO_ID"

echo
echo "Step 3: Getting products for case creation..."
PRODUCTS_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/products" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "Products response: $PRODUCTS_RESPONSE"

# Extract first product ID
PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Selected Product ID: $PRODUCT_ID"

if [ -z "$CLIENT_ID" ] || [ -z "$ASSIGN_TO_ID" ] || [ -z "$PRODUCT_ID" ]; then
    echo "Missing required data for case creation:"
    echo "Client ID: $CLIENT_ID"
    echo "Assign To ID: $ASSIGN_TO_ID"
    echo "Product ID: $PRODUCT_ID"
    exit 1
fi

echo
echo "Step 4: Creating test case..."

CASE_DATA='{
  "clientId": "'$CLIENT_ID'",
  "productId": "'$PRODUCT_ID'",
  "customerName": "Test Customer",
  "customerPhone": "1234567890",
  "applicantType": "APPLICANT",
  "backendContactNumber": "9876543210",
  "address": "123 Test Street, Test City, Test State, 12345",
  "verificationTypeId": "1",
  "priority": 3,
  "assignedToId": "'$ASSIGN_TO_ID'",
  "description": "Test case for mobile assignment verification",
  "notes": "TRIGGER - Testing mobile assignment functionality"
}'

echo "Case data to be created:"
echo "$CASE_DATA"

echo
CASE_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/cases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$CASE_DATA")

echo "Case creation response:"
echo "$CASE_RESPONSE"

# Extract case ID from response
CASE_ID=$(echo "$CASE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo
echo "Created Case ID: $CASE_ID"

echo "=== Test Case Creation Complete ==="