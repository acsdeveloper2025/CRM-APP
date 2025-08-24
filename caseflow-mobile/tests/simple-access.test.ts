import { test, expect } from '@playwright/test';

test('should access mobile app login page', async ({ page }) => {
  await page.goto('http://localhost:5174');
  
  // Check that we can see the login page
  await expect(page).toHaveTitle(/CaseFlow/);
  
  // For React Native Web, we need to use different selectors
  // Let's try to find the username and password inputs by their placeholders
  const usernameInput = page.locator('input[placeholder*="username"]');
  const passwordInput = page.locator('input[placeholder*="password"]');
  
  // The submit button is a TouchableOpacity with text "Sign In"
  const submitButton = page.locator('text=Sign In');
  
  // Wait for elements to be visible
  await expect(usernameInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });
  await expect(submitButton).toBeVisible({ timeout: 10000 });
  
  console.log('Successfully accessed mobile app login page');
  
  // Additional verification - check that we can interact with the inputs
  await usernameInput.fill('testuser');
  await passwordInput.fill('testpassword');
  
  const usernameValue = await usernameInput.inputValue();
  const passwordValue = await passwordInput.inputValue();
  
  expect(usernameValue).toBe('testuser');
  expect(passwordValue).toBe('testpassword');
  
  console.log('Successfully interacted with login form inputs');
});