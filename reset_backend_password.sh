#!/bin/bash

# Reset backend user password using admin API
echo "=== Backend User Password Reset ==="

# Admin token (from previous login)
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MGRjZjI0Ny03NTljLTQwNWQtYThmYi00Yzc4YjdiNzc3NDciLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiYXV0aE1ldGhvZCI6IlBBU1NXT1JEIiwiaWF0IjoxNzU1OTQyODMzLCJleHAiOjE3NTYwMjkyMzN9.G0huCwGsZLBjlWmxQyL_5hknGoqw7-UbNFMPZZ7hyhI"

# Backend user ID (from users list)
BACKEND_USER_ID="bd1e7938-e676-4744-9136-6bfffb38ba4c"

echo "Resetting password for backend user: $BACKEND_USER_ID"
echo

# Call admin password reset API
curl -s -X POST "http://localhost:3000/api/users/$BACKEND_USER_ID/admin-reset-display" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo
echo "=== Password Reset Complete ==="