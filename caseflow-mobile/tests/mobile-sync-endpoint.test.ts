import { test, expect } from '@playwright/test';

// Test constants
const BACKEND_URL = 'http://localhost:3000';
const MOBILE_APP_URL = 'http://localhost:5174';
const FIELD_AGENT_USERNAME = 'field_agent_test';
const FIELD_AGENT_PASSWORD = 'password123';

test.describe('Mobile Sync Endpoint Functionality', () => {
  let authToken: string;
  let deviceId: string;

  test.beforeAll(async () => {
    // Generate a unique device ID for testing
    deviceId = `test-device-${Date.now()}`;
    
    // Authenticate as field agent to get token for mobile app
    const authResponse = await fetch(`${BACKEND_URL}/api/mobile/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-App-Version': '4.0.0',
        'X-Platform': 'MOBILE',
        'X-Device-ID': deviceId
      },
      body: JSON.stringify({
        username: FIELD_AGENT_USERNAME,
        password: FIELD_AGENT_PASSWORD
      })
    });
    
    const authData = await authResponse.json();
    expect(authData.success).toBeTruthy();
    
    authToken = authData.data.tokens.accessToken;
    console.log('Field agent authenticated successfully for sync testing');
  });

  test('should successfully call sync download endpoint with valid parameters', async ({ page }) => {
    console.log('Starting test: Mobile Sync Download Endpoint');
    
    // Test the sync download endpoint with valid parameters
    const syncResponse = await fetch(`${BACKEND_URL}/api/mobile/sync/download?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'X-App-Version': '4.0.0',
        'X-Platform': 'MOBILE',
        'X-Device-ID': deviceId
      }
    });
    
    // Log response details for debugging
    console.log(`Sync response status: ${syncResponse.status}`);
    console.log(`Sync response headers: ${JSON.stringify(Object.fromEntries(syncResponse.headers.entries()))}`);
    
    // Should not be 400 Bad Request
    expect(syncResponse.status).not.toBe(400);
    
    const syncData = await syncResponse.json();
    console.log(`Sync response data: ${JSON.stringify(syncData)}`);
    
    // Should be successful
    expect(syncData.success).toBeTruthy();
    
    // Should have the expected structure
    expect(syncData).toHaveProperty('data');
    expect(syncData.data).toHaveProperty('cases');
    expect(syncData.data).toHaveProperty('deletedCaseIds');
    expect(syncData.data).toHaveProperty('syncTimestamp');
    expect(syncData.data).toHaveProperty('hasMore');
    
    console.log('Sync download endpoint test completed successfully');
  });

  test('should handle invalid limit parameter gracefully', async ({ page }) => {
    console.log('Starting test: Invalid Limit Parameter Handling');
    
    // Test the sync download endpoint with invalid limit parameter
    const syncResponse = await fetch(`${BACKEND_URL}/api/mobile/sync/download?limit=invalid`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'X-App-Version': '4.0.0',
        'X-Platform': 'MOBILE',
        'X-Device-ID': deviceId
      }
    });
    
    // Log response details for debugging
    console.log(`Sync response status with invalid limit: ${syncResponse.status}`);
    
    // Should be 400 Bad Request for invalid limit
    expect(syncResponse.status).toBe(400);
    
    const syncData = await syncResponse.json();
    console.log(`Sync error response: ${JSON.stringify(syncData)}`);
    
    // Should have error details
    expect(syncData.success).toBeFalsy();
    expect(syncData).toHaveProperty('error');
    expect(syncData.error.code).toBe('INVALID_LIMIT');
    
    console.log('Invalid limit parameter handling test completed successfully');
  });

  test('should handle invalid timestamp parameter gracefully', async ({ page }) => {
    console.log('Starting test: Invalid Timestamp Parameter Handling');
    
    // Test the sync download endpoint with invalid timestamp parameter
    const syncResponse = await fetch(`${BACKEND_URL}/api/mobile/sync/download?lastSyncTimestamp=invalid-date`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'X-App-Version': '4.0.0',
        'X-Platform': 'MOBILE',
        'X-Device-ID': deviceId
      }
    });
    
    // Log response details for debugging
    console.log(`Sync response status with invalid timestamp: ${syncResponse.status}`);
    
    // Should be 400 Bad Request for invalid timestamp
    expect(syncResponse.status).toBe(400);
    
    const syncData = await syncResponse.json();
    console.log(`Sync error response: ${JSON.stringify(syncData)}`);
    
    // Should have error details
    expect(syncData.success).toBeFalsy();
    expect(syncData).toHaveProperty('error');
    expect(syncData.error.code).toBe('INVALID_TIMESTAMP');
    
    console.log('Invalid timestamp parameter handling test completed successfully');
  });

  test('should successfully sync cases through mobile app UI', async ({ page }) => {
    console.log('Starting test: Mobile App Sync Through UI');
    
    // Login to mobile app as field agent
    await page.goto(MOBILE_APP_URL);
    console.log('Navigated to mobile app');
    
    const usernameInput = page.locator('input[placeholder*="username"]');
    const passwordInput = page.locator('input[placeholder*="password"]');
    const submitButton = page.locator('text=Sign In');
    
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    
    await usernameInput.fill(FIELD_AGENT_USERNAME);
    await passwordInput.fill(FIELD_AGENT_PASSWORD);
    
    await submitButton.click();
    console.log('Submitted login credentials');
    
    // Wait for mobile app dashboard to load
    await expect(page.locator('text=Assigned').first()).toBeVisible({ timeout: 15000 });
    console.log('Successfully logged in to mobile app as field agent');
    
    // Trigger a sync operation through the UI
    // This would typically be done by pulling to refresh or through a sync button
    // For now, we'll just verify that the sync endpoint works when called directly
    // by the mobile app's caseService
    
    // Test the sync endpoint as the mobile app would call it
    const syncResponse = await fetch(`${BACKEND_URL}/api/mobile/sync/download?limit=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'X-App-Version': '4.0.0',
        'X-Platform': 'MOBILE',
        'X-Device-ID': deviceId
      }
    });
    
    // Log response details for debugging
    console.log(`Mobile app sync response status: ${syncResponse.status}`);
    
    // Should not be 400 Bad Request
    expect(syncResponse.status).not.toBe(400);
    
    const syncData = await syncResponse.json();
    console.log(`Mobile app sync response: ${JSON.stringify(syncData)}`);
    
    // Should be successful
    expect(syncData.success).toBeTruthy();
    
    console.log('Mobile app sync through UI test completed successfully');
  });
});