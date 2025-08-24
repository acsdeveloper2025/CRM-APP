#!/usr/bin/env node
const io = require('socket.io-client');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZmZlYTQ2ZS01N2FiLTRiZTgtYjA1OC03NTU3OTkzYWY1NTMiLCJ1c2VybmFtZSI6ImZpZWxkX2FnZW50X3Rlc3QiLCJyb2xlIjoiRklFTERfQUdFTlQiLCJpYXQiOjE3NTU5NTQ4MDAsImV4cCI6MTc1NjA0MTIwMH0.zwdpy66vW9Un5SQ1zREl64XHQVwe2gN1UUHw0W_S9V0';
const USER_ID = 'bffea46e-57ab-4be8-b058-7557993af553';

console.log('🔍 Testing Authenticated WebSocket Connection...');

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  timeout: 5000,
  auth: {
    token: TOKEN
  }
});

let connectionEstablished = false;

socket.on('connect', () => {
  connectionEstablished = true;
  console.log('✅ WebSocket connected successfully');
  console.log('📍 Socket ID:', socket.id);
  console.log('🔌 Transport:', socket.io.engine.transport.name);
  
  // Join user room for real-time notifications
  socket.emit('join-room', `user:${USER_ID}`);
  console.log('🏠 Joined user room:', `user:${USER_ID}`);
  
  // Listen for case assignment events
  socket.on('mobile:case:assigned', (data) => {
    console.log('📋 Received case assignment:', data);
  });
  
  socket.on('mobile:sync:trigger', (data) => {
    console.log('🔄 Received sync trigger:', data);
  });
  
  console.log('📡 Listening for mobile-specific events...');
  
  setTimeout(() => {
    socket.disconnect();
    console.log('✅ Authenticated WebSocket test completed successfully');
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.log('❌ WebSocket connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket disconnected:', reason);
  if (connectionEstablished) {
    process.exit(0);
  }
});

socket.on('error', (error) => {
  console.log('❌ WebSocket error:', error);
});

socket.on('authenticated', (data) => {
  console.log('🔐 WebSocket authenticated:', data);
});

socket.on('room-joined', (data) => {
  console.log('🏠 Room joined confirmation:', data);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ WebSocket connection timeout');
  socket.disconnect();
  process.exit(1);
}, 10000);