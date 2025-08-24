#!/usr/bin/env node

import { io } from 'socket.io-client';

console.log('=== Testing WebSocket Case Assignment Notifications ===');

// Field agent credentials
const FIELD_AGENT_USERNAME = "field_agent_test";
const FIELD_AGENT_PASSWORD = "password123";

// Admin credentials for creating cases
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

let fieldAgentSocket = null;

async function testEndToEndWebSocket() {
  console.log('Step 1: Authenticating field agent...');
  
  const fieldAgentAuth = await fetch('http://localhost:3000/api/mobile/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: FIELD_AGENT_USERNAME,
      password: FIELD_AGENT_PASSWORD
    })
  });

  const fieldAgentData = await fieldAgentAuth.json();
  const fieldAgentToken = fieldAgentData.data.tokens.accessToken;
  const fieldAgentId = fieldAgentData.data.user.id;
  
  console.log('✅ Field agent authenticated');

  console.log('\nStep 2: Connecting field agent to WebSocket...');
  
  return new Promise((resolve, reject) => {
    fieldAgentSocket = io('ws://localhost:3000', {
      auth: {
        token: fieldAgentToken,
        platform: 'mobile',
        deviceId: 'test-mobile-device'
      },
      transports: ['websocket']
    });

    fieldAgentSocket.on('connect', async () => {
      console.log('✅ Field agent WebSocket connected');
      console.log(`Socket ID: ${fieldAgentSocket.id}`);
      
      // Listen for case assignment notifications
      fieldAgentSocket.on('mobile:case:assigned', (notification) => {
        console.log('🎉 Received case assignment notification!');
        console.log('Notification data:', JSON.stringify(notification, null, 2));
        
        // Clean up and resolve
        setTimeout(() => {
          fieldAgentSocket.disconnect();
          console.log('✅ End-to-end WebSocket test completed successfully!');
          resolve(notification);
        }, 1000);
      });

      // Now create a test case to trigger the notification
      console.log('\nStep 3: Creating test case to trigger WebSocket notification...');
      
      try {
        const adminAuth = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
          })
        });

        const adminData = await adminAuth.json();
        const adminToken = adminData.accessToken;

        // Create a new case assigned to the field agent
        const caseData = {
          applicantType: "APPLICANT",
          applicantName: "WebSocket Test Case",
          contactNumber: "9876543210",
          email: "websocket@test.com",
          address: "Test Address",
          city: "Test City",
          state: "Test State",
          pincode: "123456",
          verificationType: "RESIDENCE",
          priority: 3,
          assignedTo: fieldAgentId,
          latitude: 19.0760,
          longitude: 72.8777
        };

        const caseResponse = await fetch('http://localhost:3000/api/cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(caseData)
        });

        const createdCase = await caseResponse.json();
        
        if (caseResponse.ok) {
          console.log(`✅ Test case created with ID: ${createdCase.case?.caseId || createdCase.caseId}`);
          console.log('⏳ Waiting for WebSocket notification...');
        } else {
          console.error('❌ Failed to create test case:', createdCase);
          fieldAgentSocket.disconnect();
          reject(new Error('Failed to create test case'));
        }
        
      } catch (error) {
        console.error('❌ Error creating test case:', error);
        fieldAgentSocket.disconnect();
        reject(error);
      }
    });

    fieldAgentSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection failed:', error.message);
      reject(error);
    });

    // Timeout if no notification received
    setTimeout(() => {
      if (fieldAgentSocket && fieldAgentSocket.connected) {
        console.log('⚠️  Timeout waiting for case assignment notification');
        fieldAgentSocket.disconnect();
        reject(new Error('Timeout waiting for notification'));
      }
    }, 15000);
  });
}

// Run the test
testEndToEndWebSocket()
  .then((notification) => {
    console.log('\n🎉 End-to-end WebSocket test successful!');
    console.log('✅ WebSocket connection fix verified');
    console.log('✅ Case assignment notifications working');
    console.log('✅ Mobile app will now receive real-time updates');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 End-to-end test failed:', error.message);
    if (fieldAgentSocket) {
      fieldAgentSocket.disconnect();
    }
    process.exit(1);
  });