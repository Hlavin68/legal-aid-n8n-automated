#!/usr/bin/env node
/**
 * Simple JWT debug script to test signing and verifying
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const testData = {
  id: '12345',
  email: 'test@example.com',
  role: 'client',
  name: 'Test User'
};

console.log('🔑 JWT Debug Test');
console.log('='.repeat(50));
console.log(`Secret: ${JWT_SECRET}`);
console.log(`Secret length: ${JWT_SECRET.length}`);
console.log('');

// Sign token
console.log('📝 Signing token...');
const token = jwt.sign(testData, JWT_SECRET, { expiresIn: '7d' });
console.log(`Generated token: ${token.substring(0, 50)}...`);
console.log(`Token parts: ${token.split('.').length} (header.payload.signature)`);
console.log('');

// Decode without verification (to see payload)
console.log('🔍 Decoding token (without verification)...');
const decoded = jwt.decode(token);
console.log(`Payload: ${JSON.stringify(decoded, null, 2)}`);
console.log('');

// Verify token
console.log('✓ Verifying token...');
try {
  const verified = jwt.verify(token, JWT_SECRET);
  console.log('✅ PASS: Token verified successfully');
  console.log(`Verified data: ${JSON.stringify(verified, null, 2)}`);
} catch (error) {
  console.error(`❌ FAIL: Token verification failed`);
  console.error(`Error: ${error.message}`);
  console.error(`Error code: ${error.code}`);
}

// Try verifying with wrong secret
console.log('');
console.log('⚠️  Testing with wrong secret...');
try {
  const verified = jwt.verify(token, 'wrong-secret');
  console.log('✅ Token verified (unexpected!)');
} catch (error) {
  console.error(`❌ Expected failure: ${error.message}`);
}
