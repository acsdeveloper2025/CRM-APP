#!/usr/bin/env node

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZmZlYTQ2ZS01N2FiLTRiZTgtYjA1OC03NTU3OTkzYWY1NTMiLCJ1c2VybmFtZSI6ImZpZWxkX2FnZW50X3Rlc3QiLCJyb2xlIjoiRklFTERfQUdFTlQiLCJpYXQiOjE3NTU5NTQ4MDAsImV4cCI6MTc1NjA0MTIwMH0.zwdpy66vW9Un5SQ1zREl64XHQVwe2gN1UUHw0W_S9V0';

console.log('🔍 Testing Mobile App Case Fetching...');

async function testMobileCases() {
  try {
    console.log('📡 Fetching cases from mobile API...');
    
    const response = await fetch('http://localhost:3000/api/mobile/cases?limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'X-App-Version': '4.0.0',
        'X-Platform': 'ios',
        'X-Device-ID': 'test-device',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log('📊 Response details:');
    console.log(`  Success: ${data.success}`);
    console.log(`  Message: ${data.message}`);
    
    if (data.data && data.data.cases) {
      const cases = data.data.cases;
      console.log(`📋 Cases found: ${cases.length}`);
      
      if (cases.length > 0) {
        console.log('\n📝 Case details:');
        cases.forEach((caseItem, index) => {
          console.log(`  ${index + 1}. Case ID: ${caseItem.id}`);
          console.log(`     Customer: ${caseItem.customerName}`);
          console.log(`     Status: ${caseItem.status}`);
          console.log(`     Type: ${caseItem.verificationType}`);
          console.log(`     Assigned to: ${caseItem.assignedToFieldUser}`);
          console.log('');
        });
        
        // Test case transformation
        console.log('🔄 Testing case transformation...');
        const sampleCase = cases[0];
        console.log('📄 Sample case structure:');
        console.log(JSON.stringify(sampleCase, null, 2));
        
      } else {
        console.log('⚠️  No cases found - this might be why mobile app is empty');
      }
      
      if (data.data.pagination) {
        console.log(`📄 Pagination: Page ${data.data.pagination.page} of ${data.data.pagination.totalPages}`);
        console.log(`📊 Total cases: ${data.data.pagination.total}`);
      }
    } else {
      console.log('❌ No case data in response');
      console.log('📄 Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing mobile cases:', error.message);
  }
}

testMobileCases();