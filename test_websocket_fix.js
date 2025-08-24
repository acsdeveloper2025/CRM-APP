#!/usr/bin/env node

// Change to mobile app directory to use its node_modules
process.chdir('/Users/mayurkulkarni/Downloads/CRM-APP/caseflow-mobile');

const { io } = require('socket.io-client');

console.log('=== Testing WebSocket Connection Fix ===');

// Field agent credentials (same as used throughout testing)
const FIELD_AGENT_USERNAME = "field_agent_test";
const FIELD_AGENT_PASSWORD = "password123";

async function testWebSocketConnection() {
  console.log('Step 1: Authenticating field agent...');
  
  // First authenticate to get the token
  const fetch = (await import('node-fetch')).default;
  
  const authResponse = await fetch('http://localhost:3000/api/mobile/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: FIELD_AGENT_USERNAME,
      password: FIELD_AGENT_PASSWORD
    })
  });

  const authData = await authResponse.json();
  
  if (!authData.accessToken) {
    console.error('❌ Authentication failed:', authData);
    process.exit(1);
  }
  
  console.log('✅ Authentication successful');
  const token = authData.accessToken;

  console.log('\nStep 2: Testing WebSocket connection with corrected URL...');
  console.log('Connecting to: ws://localhost:3000');

  return new Promise((resolve, reject) => {
    const socket = io('ws://localhost:3000', {
      auth: {
        token: token,
        platform: 'mobile',
        deviceId: 'test-device-websocket-fix'
      },
      transports: ['websocket'],
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connection successful!');
      console.log(`Socket ID: ${socket.id}`);
      
      // Test receiving the connected event
      socket.on('connected', (data) => {
        console.log('✅ Received connected event:', data);
      });

      // Clean up and resolve
      setTimeout(() => {
        socket.disconnect();
        console.log('✅ WebSocket test completed successfully');
        resolve();
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection failed:', error.message);
      console.error('Error details:', error);
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    // Timeout fallback
    setTimeout(() => {
      if (!socket.connected) {
        console.error('❌ WebSocket connection timeout');
        socket.disconnect();
        reject(new Error('Connection timeout'));
      }
    }, 15000);
  });
}

// Run the test
testWebSocketConnection()
  .then(() => {
    console.log('\n🎉 WebSocket fix verification successful!');
    console.log('The mobile app should now connect properly to WebSocket');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 WebSocket fix verification failed:', error.message);
    process.exit(1);
  });