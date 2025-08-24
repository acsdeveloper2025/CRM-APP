#!/usr/bin/env node

console.log('🔍 Testing Mobile App Sync and Display Logic...');

// Test if mobile app can successfully sync cases
async function testMobileSync() {
  try {
    const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZmZlYTQ2ZS01N2FiLTRiZTgtYjA1OC03NTU3OTkzYWY1NTMiLCJ1c2VybmFtZSI6ImZpZWxkX2FnZW50X3Rlc3QiLCJyb2xlIjoiRklFTERfQUdFTlQiLCJpYXQiOjE3NTU5NTQ4MDAsImV4cCI6MTc1NjA0MTIwMH0.zwdpy66vW9Un5SQ1zREl64XHQVwe2gN1UUHw0W_S9V0';
    
    console.log('📡 Testing mobile API connectivity...');
    
    // Test the direct cases endpoint
    const response = await fetch('http://localhost:3000/api/mobile/cases?assignedToMe=true&limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'X-App-Version': '4.0.0',
        'X-Platform': 'ios',
        'X-Device-ID': 'test-device-123',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Mobile API Response:');
    console.log(`  Success: ${data.success}`);
    console.log(`  Cases count: ${data.data?.cases?.length || 0}`);
    
    if (data.data?.cases?.length > 0) {
      console.log('\n📋 Assigned Cases Details:');
      data.data.cases.forEach((caseItem, index) => {
        console.log(`  ${index + 1}. ID: ${caseItem.id} | Customer: ${caseItem.customerName} | Status: ${caseItem.status}`);
      });
      
      // Test case filtering for different statuses
      const assignedCases = data.data.cases.filter(c => c.status === 'ASSIGNED');
      const inProgressCases = data.data.cases.filter(c => c.status === 'IN_PROGRESS');
      const completedCases = data.data.cases.filter(c => c.status === 'COMPLETED');
      
      console.log('\n📊 Case Status Breakdown:');
      console.log(`  Assigned: ${assignedCases.length}`);
      console.log(`  In Progress: ${inProgressCases.length}`);
      console.log(`  Completed: ${completedCases.length}`);
      
      // Test transformation logic
      console.log('\n🔄 Testing Case Transformation:');
      const sampleCase = data.data.cases[0];
      
      // Simulate the transformation that happens in mobile app
      const transformedCase = {
        id: sampleCase.id,
        caseId: sampleCase.caseId?.toString(),
        title: sampleCase.title || `Case ${sampleCase.caseId || sampleCase.id}`,
        description: sampleCase.description || '',
        customer: {
          name: sampleCase.customerName || '',
          contact: sampleCase.customerPhone || '',
        },
        status: sampleCase.status,
        isSaved: false,
        createdAt: sampleCase.assignedAt || new Date().toISOString(),
        updatedAt: sampleCase.updatedAt || new Date().toISOString(),
        completedAt: sampleCase.completedAt,
        priority: sampleCase.priority,
        verificationType: sampleCase.verificationType,
        verificationOutcome: sampleCase.verificationOutcome,
        clientName: sampleCase.client?.name,
        applicantType: sampleCase.applicantType,
        createdByBackendUser: sampleCase.createdByBackendUser,
        backendContactNumber: sampleCase.backendContactNumber,
        assignedToFieldUser: sampleCase.assignedToFieldUser,
        trigger: sampleCase.notes,
        customerCallingCode: sampleCase.customerCallingCode,
        product: sampleCase.product?.name,
        bankName: sampleCase.client?.name,
      };
      
      console.log('  ✅ Sample transformed case:');
      console.log(`     ID: ${transformedCase.id}`);
      console.log(`     Title: ${transformedCase.title}`);
      console.log(`     Customer: ${transformedCase.customer.name}`);
      console.log(`     Status: ${transformedCase.status}`);
      console.log(`     Bank: ${transformedCase.bankName}`);
      
    } else {
      console.log('⚠️  No cases returned - this could be the display issue!');
    }
    
    console.log('\n✅ Mobile sync test completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Mobile sync test failed:', error.message);
    return false;
  }
}

// Test the login status
async function testAuthStatus() {
  try {
    const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZmZlYTQ2ZS01N2FiLTRiZTgtYjA1OC03NTU3OTkzYWY1NTMiLCJ1c2VybmFtZSI6ImZpZWxkX2FnZW50X3Rlc3QiLCJyb2xlIjoiRklFTERfQUdFTlQiLCJpYXQiOjE3NTU5NTQ4MDAsImV4cCI6MTc1NjA0MTIwMH0.zwdpy66vW9Un5SQ1zREl64XHQVwe2gN1UUHw0W_S9V0';
    
    console.log('🔐 Testing authentication status...');
    
    const response = await fetch('http://localhost:3000/api/mobile/auth/config', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'X-App-Version': '4.0.0',
        'X-Platform': 'ios',
        'X-Device-ID': 'test-device-123',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const config = await response.json();
      console.log('✅ Authentication is valid');
      console.log(`   User authenticated for mobile API access`);
      return true;
    } else {
      console.log('❌ Authentication failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Auth test error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive mobile app tests...\n');
  
  const authTest = await testAuthStatus();
  console.log('');
  
  if (authTest) {
    const syncTest = await testMobileSync();
    
    if (syncTest) {
      console.log('\n🎉 All tests passed! Mobile API is working correctly.');
      console.log('💡 If cases are not showing in mobile app, the issue is likely in:');
      console.log('   1. React Native rendering/filtering logic');
      console.log('   2. Local storage caching');
      console.log('   3. Component re-rendering issues');
      console.log('   4. Authentication state in mobile app');
    }
  }
}

runAllTests();