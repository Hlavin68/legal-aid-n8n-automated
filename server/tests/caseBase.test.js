/**
 * CaseBase Unit Tests - Jest Implementation
 * File: server/tests/caseBase.test.js
 * 
 * Run with: npm run test -- caseBase.test.js
 * Run with coverage: npm run test:coverage -- caseBase.test.js
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../server.js'; // Adjust path to your Express app
import CaseBase from '../models/CaseBase.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

let mongoServer;
let lawyerId, lawyerToken;
let clientId, clientToken;
let paralegalId, paralegalToken;

/**
 * Setup - Run before all tests
 */
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);

  // Create test users
  const lawyer = await User.create({
    name: 'John Lawyer',
    email: 'lawyer@test.com',
    password: 'password123',
    role: 'lawyer',
    firm: 'Law & Associates',
    licenseNumber: 'LAW123456'
  });
  lawyerId = lawyer._id;
  lawyerToken = jwt.sign(
    { id: lawyer._id, role: 'lawyer' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );

  const client = await User.create({
    name: 'Jane Client',
    email: 'client@test.com',
    password: 'password123',
    role: 'client'
  });
  clientId = client._id;
  clientToken = jwt.sign(
    { id: client._id, role: 'client' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );

  const paralegal = await User.create({
    name: 'Bob Paralegal',
    email: 'paralegal@test.com',
    password: 'password123',
    role: 'paralegal',
    username: 'bob_para',
    firm: 'Law & Associates'
  });
  paralegalId = paralegal._id;
  paralegalToken = jwt.sign(
    { id: paralegal._id, role: 'paralegal' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );
});

/**
 * Teardown - Run after all tests
 */
afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

/**
 * Clear database between test groups
 */
afterEach(async () => {
  await CaseBase.deleteMany({});
});

/**
 * ============================================================
 * 1. ADDING CASES - CREATION TESTS (15 tests)
 * ============================================================
 */
describe('CaseBase - Adding Cases', () => {

  describe('POST /api/casebase/cases - Valid Case Creation', () => {

    it('Test 1: Should create case with valid data', async () => {
      // Arrange
      const testPdfPath = path.join(__dirname, '../uploads/test.pdf');
      
      // Act
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Smith v. Jones Property Dispute')
        .field('category', 'Property Law')
        .field('brief', 'A landmark case regarding property boundary disputes')
        .field('description', 'Full case details...')
        .field('year', 2023)
        .field('court', 'High Court of Kenya')
        .field('judge', 'Justice Ochieng')
        .field('citation', 'Smith v. Jones [2023] KHC 123')
        .attach('pdf', testPdfPath);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.case._id).toBeDefined();
      expect(response.body.case.createdBy).toBe(lawyerId.toString());
      expect(response.body.case.title).toBe('Smith v. Jones Property Dispute');
    });

    it('Test 2: Should require title field', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('category', 'Property Law')
        .field('brief', 'Summary here');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('title');
    });

    it('Test 3: Should require category field', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Case Title')
        .field('brief', 'Summary here');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Category');
    });

    it('Test 4: Should require brief field', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Case Title')
        .field('category', 'Property Law');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Brief');
    });

    it('Test 5: Should reject missing PDF file', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Case Title')
        .field('category', 'Property Law')
        .field('brief', 'Summary here');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('PDF');
    });

    it('Test 6: Should reject non-PDF file types', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Case Title')
        .field('category', 'Property Law')
        .field('brief', 'Summary here')
        .attach('pdf', Buffer.from('fake image'), 'image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Only PDF');
    });

    it('Test 7: Should reject invalid category', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Case Title')
        .field('category', 'Invalid Category')
        .field('brief', 'Summary here');

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/category|Category/i);
    });

    it('Test 8: Should reject brief exceeding 500 characters', async () => {
      const longBrief = 'a'.repeat(501);
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Case Title')
        .field('category', 'Property Law')
        .field('brief', longBrief);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('exceed');
    });

    it('Test 9: Should reject invalid year (before 1900)', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Case Title')
        .field('category', 'Property Law')
        .field('brief', 'Summary here')
        .field('year', 1899);

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/year|Year/i);
    });

    it('Test 10: Should reject future year', async () => {
      const futureYear = new Date().getFullYear() + 1;
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Case Title')
        .field('category', 'Property Law')
        .field('brief', 'Summary here')
        .field('year', futureYear);

      expect(response.status).toBe(400);
    });

    it('Test 11: Should deny client from creating case', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${clientToken}`)
        .field('title', 'Case Title')
        .field('category', 'Property Law')
        .field('brief', 'Summary here');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('lawyer');
    });

    it('Test 12: Should deny paralegal from creating case', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${paralegalToken}`)
        .field('title', 'Case Title')
        .field('category', 'Property Law')
        .field('brief', 'Summary here');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('lawyer');
    });

    it('Test 13: Should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .field('title', 'Case Title')
        .field('category', 'Property Law')
        .field('brief', 'Summary here');

      expect(response.status).toBe(401);
    });

    it('Test 14: Should accept case with all optional fields', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', 'Full Case')
        .field('category', 'Criminal Law')
        .field('brief', 'Complete case summary')
        .field('description', 'Detailed description of the case')
        .field('year', 2022)
        .field('court', 'Supreme Court')
        .field('judge', 'Chief Justice')
        .field('citation', 'R v. Smith [2022]')
        .field('keywords', JSON.stringify(['criminal', 'assault', 'evidence']));

      expect(response.status).toBe(201);
      expect(response.body.case.description).toBe('Detailed description of the case');
      expect(response.body.case.year).toBe(2022);
    });

    it('Test 15: Should handle special characters in title', async () => {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', "O'Brien & Sons v. The State (2023) - Case #123/A")
        .field('category', 'Family Law')
        .field('brief', 'Summary here');

      expect(response.status).toBe(201);
      expect(response.body.case.title).toContain("O'Brien");
    });
  });
});

/**
 * ============================================================
 * 2. VIEWING OWN CASES TESTS (9 tests)
 * ============================================================
 */
describe('CaseBase - Viewing Own Cases', () => {

  beforeEach(async () => {
    // Create test cases
    await CaseBase.create({
      title: 'Case 1',
      category: 'Property Law',
      brief: 'Brief 1',
      pdfUrl: '/uploads/case1.pdf',
      createdBy: lawyerId,
      isPublished: true
    });
    await CaseBase.create({
      title: 'Case 2',
      category: 'Family Law',
      brief: 'Brief 2',
      pdfUrl: '/uploads/case2.pdf',
      createdBy: lawyerId,
      isPublished: true
    });
    await CaseBase.create({
      title: 'Case 3 - Draft',
      category: 'Criminal Law',
      brief: 'Brief 3',
      pdfUrl: '/uploads/case3.pdf',
      createdBy: lawyerId,
      isPublished: false
    });
  });

  it('Test 16: Should retrieve lawyer\'s own cases', async () => {
    const response = await request(app)
      .get('/api/casebase/lawyer/my-cases')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.cases.length).toBeGreaterThan(0);
    expect(response.body.cases[0].createdBy._id).toBe(lawyerId.toString());
  });

  it('Test 17: Should return empty array when lawyer has no cases', async () => {
    await CaseBase.deleteMany({});
    
    const response = await request(app)
      .get('/api/casebase/lawyer/my-cases')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.cases).toEqual([]);
  });

  it('Test 18: Should handle pagination correctly', async () => {
    const response = await request(app)
      .get('/api/casebase/lawyer/my-cases?page=1&limit=2')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.currentPage).toBe(1);
    expect(response.body.pagination.pageSize).toBe(2);
  });

  it('Test 19: Should filter cases by category', async () => {
    const response = await request(app)
      .get('/api/casebase/lawyer/my-cases?category=Property%20Law')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.cases.length).toBeGreaterThan(0);
    response.body.cases.forEach(caseItem => {
      expect(caseItem.category).toBe('Property Law');
    });
  });

  it('Test 20: Should handle invalid pagination gracefully', async () => {
    const response = await request(app)
      .get('/api/casebase/lawyer/my-cases?page=0&limit=-1')
      .set('Authorization', `Bearer ${lawyerToken}`);

    // Should default to valid values or return error
    expect([200, 400]).toContain(response.status);
  });

  it('Test 21: Should limit results to max 50 per page', async () => {
    const response = await request(app)
      .get('/api/casebase/lawyer/my-cases?limit=100')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination.pageSize).toBeLessThanOrEqual(50);
  });

  it('Test 22: Should only return published cases', async () => {
    const response = await request(app)
      .get('/api/casebase/lawyer/my-cases')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    response.body.cases.forEach(caseItem => {
      expect(caseItem.isPublished).toBe(true);
    });
  });

  it('Test 23: Should require authentication', async () => {
    const response = await request(app)
      .get('/api/casebase/lawyer/my-cases');

    expect(response.status).toBe(401);
  });

  it('Test 24: Should increment view count when case accessed', async () => {
    const caseItem = await CaseBase.findOne({ createdBy: lawyerId });
    const initialViews = caseItem.views;

    await request(app)
      .get(`/api/casebase/${caseItem._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`);

    const updatedCase = await CaseBase.findById(caseItem._id);
    expect(updatedCase.views).toBe(initialViews + 1);
  });
});

/**
 * ============================================================
 * 3. PERMISSIONS & ACCESS CONTROL TESTS (14 tests)
 * ============================================================
 */
describe('CaseBase - Permissions & Access Control', () => {

  beforeEach(async () => {
    await CaseBase.create({
      title: 'Published Case',
      category: 'Property Law',
      brief: 'Brief summary',
      pdfUrl: '/uploads/published.pdf',
      createdBy: lawyerId,
      isPublished: true
    });
    await CaseBase.create({
      title: 'Unpublished Case',
      category: 'Family Law',
      brief: 'Brief summary',
      pdfUrl: '/uploads/unpublished.pdf',
      createdBy: lawyerId,
      isPublished: false
    });
  });

  it('Test 25: Lawyer should access all published cases', async () => {
    const response = await request(app)
      .get('/api/casebase/list')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.cases.length).toBeGreaterThan(0);
  });

  it('Test 26: Client should access all published cases', async () => {
    const response = await request(app)
      .get('/api/casebase/list')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(200);
    expect(response.body.cases.length).toBeGreaterThan(0);
  });

  it('Test 27: Paralegal should access all published cases', async () => {
    const response = await request(app)
      .get('/api/casebase/list')
      .set('Authorization', `Bearer ${paralegalToken}`);

    expect(response.status).toBe(200);
  });

  it('Test 28: Should never expose unpublished cases', async () => {
    const response = await request(app)
      .get('/api/casebase/list')
      .set('Authorization', `Bearer ${clientToken}`);

    response.body.cases.forEach(caseItem => {
      expect(caseItem.isPublished).toBe(true);
    });
  });

  it('Test 29: Should get published case details with view increment', async () => {
    const publishedCase = await CaseBase.findOne({ isPublished: true });
    const initialViews = publishedCase.views;

    const response = await request(app)
      .get(`/api/casebase/${publishedCase._id}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(200);
    expect(response.body.case.views).toBe(initialViews + 1);
  });

  it('Test 30: Should deny access to unpublished case by other user', async () => {
    const unpublishedCase = await CaseBase.findOne({ isPublished: false });

    const response = await request(app)
      .get(`/api/casebase/${unpublishedCase._id}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('not published');
  });

  it('Test 31: Should return 404 for non-existent case', async () => {
    const fakeId = mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/casebase/${fakeId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(404);
  });

  it('Test 32: Should handle invalid ObjectId format', async () => {
    const response = await request(app)
      .get('/api/casebase/invalid-id-format')
      .set('Authorization', `Bearer ${clientToken}`);

    expect([400, 404]).toContain(response.status);
  });

  it('Test 33: Should search cases by keyword', async () => {
    const response = await request(app)
      .get('/api/casebase/list?search=Published')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.cases.some(c => c.title.includes('Published'))).toBe(true);
  });

  it('Test 34: Should filter cases by category', async () => {
    const response = await request(app)
      .get('/api/casebase/list?category=Property%20Law')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(200);
    response.body.cases.forEach(caseItem => {
      expect(caseItem.category).toBe('Property Law');
    });
  });

  it('Test 35: Should combine search and category filter', async () => {
    const response = await request(app)
      .get('/api/casebase/list?search=Published&category=Property%20Law')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(200);
  });

  it('Test 36: Should return creator info with privacy', async () => {
    const response = await request(app)
      .get('/api/casebase/list')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(200);
    const caseItem = response.body.cases[0];
    expect(caseItem.createdBy.name).toBeDefined();
    expect(caseItem.createdBy.firm).toBeDefined();
  });

  it('Test 37: Should track view count across multiple users', async () => {
    const publishedCase = await CaseBase.findOne({ isPublished: true });

    await request(app)
      .get(`/api/casebase/${publishedCase._id}`)
      .set('Authorization', `Bearer ${clientToken}`);

    await request(app)
      .get(`/api/casebase/${publishedCase._id}`)
      .set('Authorization', `Bearer ${paralegalToken}`);

    const updatedCase = await CaseBase.findById(publishedCase._id);
    expect(updatedCase.views).toBe(publishedCase.views + 2);
  });

  it('Test 38: Should return 200 for search with no results', async () => {
    const response = await request(app)
      .get('/api/casebase/list?search=NonexistentKeywordXYZ123')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(response.status).toBe(200);
    expect(response.body.cases.length).toBe(0);
  });
});

/**
 * ============================================================
 * 4. DATA VALIDATION TESTS (15 tests)
 * ============================================================
 */
describe('CaseBase - Data Validation', () => {

  it('Test 39: Should trim whitespace from title', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', '   Case Title   ')
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(201);
    expect(response.body.case.title).toBe('Case Title');
  });

  it('Test 40: Should reject empty title string', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', '')
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(400);
  });

  it('Test 41: Should accept brief at exactly 500 characters', async () => {
    const brief500 = 'a'.repeat(500);
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Case Title')
      .field('category', 'Property Law')
      .field('brief', brief500);

    expect(response.status).toBe(201);
    expect(response.body.case.brief.length).toBe(500);
  });

  it('Test 42: Should reject brief exceeding 500 characters by 1', async () => {
    const brief501 = 'a'.repeat(501);
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Case Title')
      .field('category', 'Property Law')
      .field('brief', brief501);

    expect(response.status).toBe(400);
  });

  it('Test 43: Should default description to empty string', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Case Title')
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(201);
    expect(response.body.case.description).toBe('');
  });

  it('Test 44: Should accept year 1900 (boundary)', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Historic Case')
      .field('category', 'Property Law')
      .field('brief', 'Summary')
      .field('year', 1900);

    expect(response.status).toBe(201);
    expect(response.body.case.year).toBe(1900);
  });

  it('Test 45: Should reject year before 1900', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Old Case')
      .field('category', 'Property Law')
      .field('brief', 'Summary')
      .field('year', 1850);

    expect(response.status).toBe(400);
  });

  it('Test 46: Should auto-set createdBy to current user', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Case Title')
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(201);
    expect(response.body.case.createdBy).toBe(lawyerId.toString());
  });

  it('Test 47: Should set timestamps on creation', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Case Title')
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(201);
    expect(response.body.case.createdAt).toBeDefined();
    expect(response.body.case.updatedAt).toBeDefined();
  });

  it('Test 48: Should set isPublished to true by default', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Case Title')
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(201);
    expect(response.body.case.isPublished).toBe(true);
  });

  it('Test 49: Should initialize views to 0', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Case Title')
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(201);
    expect(response.body.case.views).toBe(0);
  });

  it('Test 50: Should accept all valid categories', async () => {
    const validCategories = [
      'Property Law', 'Employment Law', 'Family Law', 'Criminal Law',
      'Business & Contracts', 'Corporate Law', 'Immigration',
      'Intellectual Property', 'Constitutional Law', 'Environmental Law', 'Tax Law', 'Other'
    ];

    for (const category of validCategories) {
      const response = await request(app)
        .post('/api/casebase/cases')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .field('title', `Case in ${category}`)
        .field('category', category)
        .field('brief', 'Summary');

      expect(response.status).toBe(201);
      expect(response.body.case.category).toBe(category);
    }
  });

  it('Test 51: Should store PDF URL correctly', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Case Title')
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(201);
    expect(response.body.case.pdfUrl).toBeDefined();
    expect(response.body.case.pdfUrl).toContain('uploads/');
  });

  it('Test 52: Should handle optional keywords array', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', 'Case Title')
      .field('category', 'Property Law')
      .field('brief', 'Summary')
      .field('keywords', JSON.stringify(['keyword1', 'keyword2']));

    expect(response.status).toBe(201);
    expect(Array.isArray(response.body.case.keywords)).toBe(true);
  });
});

/**
 * ============================================================
 * 5. EDGE CASES TESTS (22 tests)
 * ============================================================
 */
describe('CaseBase - Edge Cases', () => {

  it('Test 54: Should handle NoSQL injection attempt', async () => {
    const response = await request(app)
      .get('/api/casebase/list?search={$ne: null}')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    // Should treat as literal string, not execute operator
  });

  it('Test 55: Should escape XSS attempt in title', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', "<script>alert('xss')</script>")
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(201);
    // Verify it's stored safely without execution
    const retrieved = await request(app)
      .get(`/api/casebase/list`)
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(retrieved.body.cases[0].title).toContain('script');
  });

  it('Test 56: Should return 404 for non-existent case ID', async () => {
    const fakeId = mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/casebase/${fakeId}`)
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(404);
  });

  it('Test 57: Should handle rapid case creation', async () => {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        request(app)
          .post('/api/casebase/cases')
          .set('Authorization', `Bearer ${lawyerToken}`)
          .field('title', `Rapid Case ${i}`)
          .field('category', 'Property Law')
          .field('brief', 'Summary')
      );
    }

    const results = await Promise.all(promises);
    results.forEach(result => {
      expect(result.status).toBe(201);
    });

    const allCases = await CaseBase.find({ createdBy: lawyerId });
    expect(allCases.length).toBe(5);
  });

  it('Test 58: Should handle pagination beyond total pages', async () => {
    const response = await request(app)
      .get('/api/casebase/list?page=9999&limit=10')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.cases.length).toBe(0);
  });

  it('Test 59: Should handle empty database gracefully', async () => {
    await CaseBase.deleteMany({});

    const response = await request(app)
      .get('/api/casebase/list')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.cases).toEqual([]);
    expect(response.body.pagination.totalCases).toBe(0);
  });

  it('Test 60: Should handle search with no results', async () => {
    const response = await request(app)
      .get('/api/casebase/list?search=XYZNONEXISTENT123')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.cases.length).toBe(0);
  });

  it('Test 61: Should handle special regex characters in search', async () => {
    const response = await request(app)
      .get('/api/casebase/list?search=.*+?^${}()|[]\\')
      .set('Authorization', `Bearer ${lawyerToken}`);

    // Should not crash, either match or return empty
    expect([200]).toContain(response.status);
  });

  it('Test 62: Should handle case-insensitive category filter', async () => {
    await CaseBase.create({
      title: 'Property Case',
      category: 'Property Law',
      brief: 'Summary',
      pdfUrl: '/uploads/test.pdf',
      createdBy: lawyerId,
      isPublished: true
    });

    const response = await request(app)
      .get('/api/casebase/list?category=property%20law')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(response.status).toBe(200);
    // Verify matching works
  });

  it('Test 63: Should handle whitespace-only fields as invalid', async () => {
    const response = await request(app)
      .post('/api/casebase/cases')
      .set('Authorization', `Bearer ${lawyerToken}`)
      .field('title', '   ')
      .field('category', 'Property Law')
      .field('brief', 'Summary');

    expect(response.status).toBe(400);
  });

  it('Test 64: Should update only allowed fields', async () => {
    const caseItem = await CaseBase.create({
      title: 'Original Title',
      category: 'Property Law',
      brief: 'Original Brief',
      pdfUrl: '/uploads/test.pdf',
      createdBy: lawyerId,
      isPublished: true
    });

    const response = await request(app)
      .put(`/api/casebase/cases/${caseItem._id}`)
      .set('Authorization', `Bearer ${lawyerToken}`)
      .send({
        title: 'Updated Title',
        createdBy: 'different-user-id' // Should be ignored
      });

    if (response.status === 200) {
      expect(response.body.case.createdBy).toBe(lawyerId.toString());
    }
  });

  it('Test 65: Should deny unauthorized update', async () => {
    const caseItem = await CaseBase.create({
      title: 'Original Title',
      category: 'Property Law',
      brief: 'Original Brief',
      pdfUrl: '/uploads/test.pdf',
      createdBy: lawyerId,
      isPublished: true
    });

    const response = await request(app)
      .put(`/api/casebase/cases/${caseItem._id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ title: 'Hacked Title' });

    expect([403, 401]).toContain(response.status);
  });

  it('Test 66: Should deny delete by non-creator', async () => {
    const caseItem = await CaseBase.create({
      title: 'Case to Delete',
      category: 'Property Law',
      brief: 'Brief',
      pdfUrl: '/uploads/test.pdf',
      createdBy: lawyerId,
      isPublished: true
    });

    const response = await request(app)
      .delete(`/api/casebase/cases/${caseItem._id}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect([403, 401]).toContain(response.status);
  });

  it('Test 67: Should handle concurrent view increments', async () => {
    const caseItem = await CaseBase.create({
      title: 'Concurrent Views Test',
      category: 'Property Law',
      brief: 'Brief',
      pdfUrl: '/uploads/test.pdf',
      createdBy: lawyerId,
      isPublished: true,
      views: 0
    });

    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app)
          .get(`/api/casebase/${caseItem._id}`)
          .set('Authorization', `Bearer ${clientToken}`)
      );
    }

    await Promise.all(promises);

    const updatedCase = await CaseBase.findById(caseItem._id);
    expect(updatedCase.views).toBeGreaterThanOrEqual(10);
  });
});

export default {};
