#!/usr/bin/env node
const io = require('socket.io-client');

console.log('🔍 Testing WebSocket Health...');

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully');
  console.log('📍 Socket ID:', socket.id);
  console.log('🔌 Transport:', socket.io.engine.transport.name);
  
  // Test authentication status
  socket.emit('authenticate', { message: 'Health check' });
  
  setTimeout(() => {
    socket.disconnect();
    console.log('✅ WebSocket health test completed successfully');
    process.exit(0);
  }, 1000);
});

socket.on('connect_error', (error) => {
  console.log('❌ WebSocket connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket disconnected:', reason);
});

socket.on('error', (error) => {
  console.log('❌ WebSocket error:', error);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ WebSocket connection timeout');
  socket.disconnect();
  process.exit(1);
}, 10000);