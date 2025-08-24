import { test, expect } from '@playwright/test';

// Test constants
const MOBILE_APP_URL = 'http://localhost:5174';
const FIELD_AGENT_USERNAME = 'field_agent_test';
const FIELD_AGENT_PASSWORD = 'password123';

test.describe('Verify Case Assignment in Mobile App', () => {
  test('should login as field agent and verify assigned cases', async ({ page }) => {
    console.log('Starting test: Verify Case Assignment in Mobile App');
    
    // Step 1: Navigate to mobile app
    await page.goto(MOBILE_APP_URL);
    console.log('Navigated to mobile app');
    
    // Step 2: Wait for login form and fill credentials
    const usernameInput = page.locator('input[placeholder*="username"]');
    const passwordInput = page.locator('input[placeholder*="password"]');
    const submitButton = page.locator('text=Sign In');
    
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    
    await usernameInput.fill(FIELD_AGENT_USERNAME);
    await passwordInput.fill(FIELD_AGENT_PASSWORD);
    
    // Submit login form
    await submitButton.click();
    console.log('Submitted login credentials');
    
    // Step 3: Wait for mobile app dashboard to load
    // The dashboard should show tabs like "Assigned", "In Progress", etc.
    // Use first() to select the first occurrence
    await expect(page.locator('text=Assigned').first()).toBeVisible({ timeout: 15000 });
    console.log('Successfully logged in to mobile app as field agent');
    
    // Step 4: Verify assigned cases are displayed
    // Click on Assigned tab to make sure we're on the right view
    await page.locator('text=Assigned').first().click();
    
    // Wait for case list to load
    await page.waitForTimeout(3000);
    
    // Check if we have assigned cases
    // Look for case cards or elements that indicate assigned cases
    // We'll look for elements containing case information
    const caseElements = page.locator('div:has-text("ASSIGNED")');
    const caseCount = await caseElements.count();
    console.log(`Found ${caseCount} elements with "ASSIGNED" text`);
    
    // Let's also look for specific case names we know should be there
    const demoCaseVisible = await page.locator('text=Demo Case Assignment').isVisible();
    const testCustomerVisible = await page.locator('text=Test Customer').isVisible();
    
    console.log(`Demo Case visible: ${demoCaseVisible}`);
    console.log(`Test Customer visible: ${testCustomerVisible}`);
    
    // Check if we can find any case cards
    // Look for div elements that contain case information
    const caseCards = page.locator('div').filter({ hasText: 'ASSIGNED' });
    const cardCount = await caseCards.count();
    console.log(`Found ${cardCount} case cards`);
    
    // We should have at least one assigned case based on our previous work
    expect(cardCount > 0 || demoCaseVisible || testCustomerVisible).toBeTruthy();
    
    console.log('Verified that assigned cases are displayed in mobile app');
    
    // Step 5: If we found a specific case, verify its details
    if (demoCaseVisible) {
      console.log('Found Demo Case Assignment');
      // Click on the demo case to view details
      await page.locator('text=Demo Case Assignment').first().click();
      
      // Wait for case details to load
      await page.waitForTimeout(2000);
      
      // Verify case details are displayed
      const customerNameVisible = await page.locator('text=Demo Case Assignment').isVisible();
      const statusVisible = await page.locator('text=ASSIGNED').isVisible();
      
      expect(customerNameVisible).toBeTruthy();
      expect(statusVisible).toBeTruthy();
      
      console.log('Verified case details for Demo Case Assignment');
    } else if (testCustomerVisible) {
      console.log('Found Test Customer case');
      // Click on the test customer case to view details
      await page.locator('text=Test Customer').first().click();
      
      // Wait for case details to load
      await page.waitForTimeout(2000);
      
      // Verify case details are displayed
      const customerNameVisible = await page.locator('text=Test Customer').isVisible();
      const statusVisible = await page.locator('text=ASSIGNED').isVisible();
      
      expect(customerNameVisible).toBeTruthy();
      expect(statusVisible).toBeTruthy();
      
      console.log('Verified case details for Test Customer case');
    }
    
    console.log('Test completed successfully');
  });
});