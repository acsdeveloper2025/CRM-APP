#!/bin/bash

echo "=== Clearing Mock Data from Mobile App ==="

echo "This script will help clear any existing mock data from the mobile app storage"
echo "Note: This needs to be run when the mobile app is started fresh"

echo
echo "Mock data removal completed in code:"
echo "✓ Removed getInitialMockData() function"
echo "✓ Removed generateAttachments() function" 
echo "✓ Modified initializeData() to use empty array"
echo "✓ Disabled enableMockData in all environments"

echo
echo "To fully clear existing mock data from device storage:"
echo "1. Clear browser storage (if running in web)"
echo "2. Uninstall and reinstall mobile app (if running on device)"
echo "3. Or clear app data in device settings"

echo
echo "The mobile app will now only show real cases from the backend API:"
echo "- No more mock cases (RES-001, BUS-001, etc.)"
echo "- Only real cases assigned to the logged-in field agent"
echo "- Empty state when no real cases are available"

echo
echo "=== Mock Data Removal Complete ==="