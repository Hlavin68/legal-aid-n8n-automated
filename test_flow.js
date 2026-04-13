#!/usr/bin/env node
/**
 * Comprehensive test for sign-in, login, and case creation flow
 * Tests both client and lawyer/paralegal workflows
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// test data
const testData = {
  client: {
    name: 'John Client',
    email: `client_${Date.now()}@test.com`,
    password: 'password123',
    role: 'client'
  },
  lawyer: {
    name: 'Jane Lawyer',
    email: `lawyer_${Date.now()}@test.com`,
    password: 'password123',
    role: 'lawyer',
    firm: 'Legal Associates',
    licenseNumber: 'KE12345'
  }
};

let tokens = {};
let userIds = {};

async function test(name, fn) {
  try {
    console.log(`\n✓ Testing: ${name}`);
    await fn();
    console.log(`  ✅ PASS`);
    return true;
  } catch (error) {
    console.error(`  ❌ FAIL: ${error.message}`);
    if (error.response?.data) {
      console.error(`  Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('  LEGAL AID SYSTEM - COMPREHENSIVE FLOW TEST');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  // Test 1: Register Client
  if (await test('Register Client', async () => {
    const res = await api.post('/auth/register', testData.client);
    if (!res.data.success || !res.data.token) throw new Error('No token returned');
    tokens.client = res.data.token;
    userIds.client = res.data.user._id;
    console.log(`    Client ID: ${userIds.client}`);
  })) passed++; else failed++;

  // Test 2: Register Lawyer
  if (await test('Register Lawyer', async () => {
    const res = await api.post('/auth/register', testData.lawyer);
    if (!res.data.success || !res.data.token) throw new Error('No token returned');
    tokens.lawyer = res.data.token;
    userIds.lawyer = res.data.user._id;
    console.log(`    Lawyer ID: ${userIds.lawyer}`);
  })) passed++; else failed++;

  // Test 3: Login Client
  if (await test('Login Client', async () => {
    const res = await api.post('/auth/login', {
      email: testData.client.email,
      password: testData.client.password
    });
    if (!res.data.success || !res.data.token) throw new Error('No token returned');
    if (res.data.user.role !== 'client') throw new Error(`Expected role 'client', got '${res.data.user.role}'`);
    tokens.client = res.data.token; // Update with fresh token
  })) passed++; else failed++;

  // Test 4: Login Lawyer
  if (await test('Login Lawyer', async () => {
    const res = await api.post('/auth/login', {
      email: testData.lawyer.email,
      password: testData.lawyer.password
    });
    if (!res.data.success || !res.data.token) throw new Error('No token returned');
    if (res.data.user.role !== 'lawyer') throw new Error(`Expected role 'lawyer', got '${res.data.user.role}'`);
    tokens.lawyer = res.data.token; // Update with fresh token
  })) passed++; else failed++;

  // Test 5: Get Current User (Client)
  if (await test('Get Current User (Client)', async () => {
    const res = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${tokens.client}` }
    });
    if (!res.data.success) throw new Error('Failed to get current user');
    if (res.data.user._id !== userIds.client) throw new Error('User ID mismatch');
  })) passed++; else failed++;

  // Test 6: Get Current User (Lawyer)
  if (await test('Get Current User (Lawyer)', async () => {
    const res = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${tokens.lawyer}` }
    });
    if (!res.data.success) throw new Error('Failed to get current user');
    if (res.data.user._id !== userIds.lawyer) throw new Error('User ID mismatch');
  })) passed++; else failed++;

  // Test 7: Lawyer gets empty cases (first time)
  if (await test('Lawyer: Get My Cases (empty)', async () => {
    const res = await api.get('/cases', {
      headers: { Authorization: `Bearer ${tokens.lawyer}` }
    });
    if (!res.data.success) throw new Error('Failed to get cases');
    console.log(`    Cases found: ${res.data.cases.length}`);
  })) passed++; else failed++;

  // Test 8: Client gets empty cases (first time)
  if (await test('Client: Get My Cases (empty)', async () => {
    const res = await api.get('/cases', {
      headers: { Authorization: `Bearer ${tokens.client}` }
    });
    if (!res.data.success) throw new Error('Failed to get cases');
    console.log(`    Cases found: ${res.data.cases.length}`);
  })) passed++; else failed++;

  // Test 9: Lawyer creates case for client
  let caseId;
  if (await test('Lawyer: Create Case', async () => {
    const res = await api.post('/cases',
      {
        title: 'Test Land Dispute',
        category: 'Property Law',
        description: 'Test case for system verification',
        clientEmail: testData.client.email
      },
      { headers: { Authorization: `Bearer ${tokens.lawyer}` } }
    );
    if (!res.data.success || !res.data.case) throw new Error('Case not created');
    caseId = res.data.case._id;
    console.log(`    Case ID: ${caseId}`);
    console.log(`    Status: ${res.data.case.status}`);
  })) passed++; else failed++;

  // Test 10: Client sees case
  if (caseId && await test('Client: Get My Cases (see created case)', async () => {
    const res = await api.get('/cases', {
      headers: { Authorization: `Bearer ${tokens.client}` }
    });
    if (!res.data.success) throw new Error('Failed to get cases');
    const myCase = res.data.cases.find(c => c._id === caseId);
    if (!myCase) throw new Error('Case not visible to client');
    console.log(`    Found case: ${myCase.title}`);
  })) passed++; else failed++;

  // Test 11: Lawyer sees case
  if (caseId && await test('Lawyer: Get My Cases (see created case)', async () => {
    const res = await api.get('/cases', {
      headers: { Authorization: `Bearer ${tokens.lawyer}` }
    });
    if (!res.data.success) throw new Error('Failed to get cases');
    const myCase = res.data.cases.find(c => c._id === caseId);
    if (!myCase) throw new Error('Case not visible to lawyer');
    console.log(`    Found case: ${myCase.title}`);
  })) passed++; else failed++;

  // Test 12: Client cannot create case
  if (await test('Client: Cannot Create Case (authorization check)', async () => {
    try {
      await api.post('/cases',
        {
          title: 'Test Case',
          category: 'Property Law',
          description: 'Test',
          clientEmail: testData.client.email
        },
        { headers: { Authorization: `Bearer ${tokens.client}` } }
      );
      throw new Error('Client was able to create case (should be forbidden)');
    } catch (error) {
      if (error.response?.status === 403) {
        // Expected
        return;
      }
      throw error;
    }
  })) passed++; else failed++;

  // Summary
  console.log('\n==================================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error.message);
  process.exit(1);
});
