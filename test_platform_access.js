(async () => {
  const { default: fetch } = await import('node-fetch');

  // Test configuration
  const BASE_URL = 'http://localhost:3000/api';

  // Test users - these should exist in your database
  const TEST_USERS = {
    fieldAgent: {
      username: 'field_agent_test',
      password: 'password123'
    },
    backendUser: {
      username: 'backend_user',
      password: 'backend123'
    }
  };

  async function testPlatformAccess() {
    console.log('Testing Platform Access Control...\n');

    // Test 1: Field agent trying to login via web (should be blocked)
    console.log('Test 1: Field agent trying to login via web (should be blocked)');
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: TEST_USERS.fieldAgent.username,
          password: TEST_USERS.fieldAgent.password
        })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      console.log('Status:', response.status);
      console.log('Expected: 403 Forbidden\n');
    } catch (error) {
      console.error('Error:', error.message);
    }

    // Test 2: Field agent trying to login via mobile (should be allowed)
    console.log('Test 2: Field agent trying to login via mobile (should be allowed)');
    try {
      const response = await fetch(`${BASE_URL}/mobile/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': '4.0.0',
          'X-Platform': 'MOBILE',
          'X-Device-ID': 'test-device-123'
        },
        body: JSON.stringify({
          username: TEST_USERS.fieldAgent.username,
          password: TEST_USERS.fieldAgent.password
        })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      console.log('Status:', response.status);
      console.log('Expected: 200 OK\n');
    } catch (error) {
      console.error('Error:', error.message);
    }

    // Test 3: Backend user trying to login via web (should be allowed)
    console.log('Test 3: Backend user trying to login via web (should be allowed)');
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: TEST_USERS.backendUser.username,
          password: TEST_USERS.backendUser.password
        })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      console.log('Status:', response.status);
      console.log('Expected: 200 OK\n');
    } catch (error) {
      console.error('Error:', error.message);
    }

    // Test 4: Backend user trying to login via mobile (should be blocked)
    console.log('Test 4: Backend user trying to login via mobile (should be blocked)');
    try {
      const response = await fetch(`${BASE_URL}/mobile/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': '4.0.0',
          'X-Platform': 'MOBILE',
          'X-Device-ID': 'test-device-123'
        },
        body: JSON.stringify({
          username: TEST_USERS.backendUser.username,
          password: TEST_USERS.backendUser.password
        })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      console.log('Status:', response.status);
      console.log('Expected: 403 Forbidden\n');
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  // Run the tests
  await testPlatformAccess();
})();