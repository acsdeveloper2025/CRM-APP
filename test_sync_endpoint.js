const http = require('http');

// Test the sync endpoint with different parameters
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/mobile/sync/download?limit=invalid',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': '4.0.0',
    'X-Platform': 'MOBILE',
    'X-Device-ID': 'test-device-123'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();