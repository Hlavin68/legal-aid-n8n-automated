# Case Base / Legal Precedent Library - Integration Guide

## ✅ Implementation Summary

A complete **Case Base / Legal Precedent Library** feature has been added to your legal-aid project. This allows users to browse, search, and manage a library of legal cases with embedded PDF documents.

---

## 📁 Files Created

### Backend

1. **`server/models/CaseBase.js`**
   - MongoDB model for legal case precedents
   - Includes full-text search indexes

2. **`server/controllers/caseBaseController.js`**
   - All business logic for case operations
   - 7 main functions: getAllCases, getCaseById, createCase, updateCase, deleteCase, getMyCases, getCategories

3. **`server/routes/caseBase.js`**
   - API route definitions
   - Includes authentication and authorization middleware
   - PDF upload handling via multer

### Frontend

1. **`client/src/pages/UploadCase.jsx`**
   - New page for lawyers to upload cases
   - Form with validation and file upload
   - Upload progress bar

2. **`client/src/pages/CaseBase.jsx`** (Enhanced)
   - Updated to use new API endpoints
   - Search, filter, and pagination functionality

3. **`client/src/pages/CaseBaseDetails.jsx`** (Enhanced)
   - Embedded PDF viewer with iframe
   - Full metadata display
   - Download and edit/delete controls

---

## 📝 Files Modified

### Backend

**`server/server.js`**
```javascript
// Added import
import caseBaseRoutes from './routes/caseBase.js';

// Added route registration
app.use('/api/case-base', caseBaseRoutes);
```

**`server/middleware/upload.js`**
- Added `pdfUpload` export for PDF-specific handling
- 50MB limit for PDFs (vs 10MB general limit)

### Frontend

**`client/src/App.jsx`**
- Added UploadCase import
- Added route: `/lawyer/upload-case`

---

## 🚀 Integration Steps

### Step 1: Verify MongoDB Connection
Ensure MongoDB is running and connection string is in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/legal-aid
```

### Step 2: Restart Backend Server
```bash
cd server
npm run dev
```
You should see: "Connected to MongoDB"

### Step 3: Verify Routes
Test the health check endpoint:
```bash
curl http://localhost:5000/health
```

### Step 4: Test Frontend
Start React dev server (if not running):
```bash
cd client
npm start
```

---

## 📖 API Endpoints Reference

### Public Endpoints (All Authenticated Users)

#### Get All Cases (with search & filter)
```bash
GET /api/case-base/list?search=property&category=Property%20Law&page=1&limit=12
```

**Response:**
```json
{
  "success": true,
  "cases": [
    {
      "_id": "...",
      "title": "Republic vs. John Doe",
      "category": "Property Law",
      "brief": "Case about...",
      "year": 2023,
      "views": 45,
      "createdBy": { "name": "Jane Lawyer", "firm": "Law Firm" }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 12,
    "totalCases": 45,
    "totalPages": 4
  }
}
```

#### Get Categories
```bash
GET /api/case-base/categories
```

#### Get Single Case Details
```bash
GET /api/case-base/:caseId
```

---

### Lawyer-Only Endpoints

#### Create New Case (Upload PDF)
```bash
POST /api/case-base/create
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Fields:
- title (string, required)
- category (string, required)
- brief (string, required)
- description (string)
- year (number)
- court (string)
- judge (string)
- citation (string)
- keywords (string, comma-separated)
- pdf (file, PDF only, max 50MB)
```

**Example with curl:**
```bash
curl -X POST http://localhost:5000/api/case-base/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Republic vs. John Doe" \
  -F "category=Property Law" \
  -F "brief=Brief summary here" \
  -F "pdf=@judgment.pdf"
```

#### Update Case
```bash
PUT /api/case-base/:caseId
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "category": "Criminal Law",
  "brief": "Updated brief"
}
```

#### Delete Case
```bash
DELETE /api/case-base/:caseId
Authorization: Bearer {token}
```

#### Get My Cases
```bash
GET /api/case-base/lawyer/my-cases
Authorization: Bearer {token}
```

---

## 🎯 User Flows

### Client Flow
1. Navigate to "📚 Legal Case Library" (visible in nav)
2. Browse all published cases
3. Use search/filter to find relevant cases
4. Click "View Full Case" to see details
5. Read case summary and metadata
6. View embedded PDF
7. Download PDF if needed

### Lawyer Flow
1. Navigate to "📚 Legal Case Library"
2. Same browsing as clients
3. See "➕ Upload New Case" button
4. Click to upload form
5. Fill in case details
6. Select PDF file
7. Submit to publish
8. Case immediately available to all users
9. Can edit/delete own cases from details page

---

## 🔑 Key Features

### Search & Filtering
- Full-text search on: title, description, brief, keywords, court
- Category filtering
- Pagination (12 items per page)
- Maintains search state while paginating

### Case Management
- View counts for popularity tracking
- Timestamps for created and updated
- Creator attribution
- Upload progress indicator

### PDF Handling
- Embedded viewer using iframe
- Download button
- Open in new tab option
- 50MB file size limit

### Authorization
```javascript
// Access Levels:
Client    → Read-only (view cases)
Lawyer    → Full CRUD (upload, edit, delete own cases)
Paralegal → Read-only (extensible in future)
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module 'caseBaseRoutes'"
**Solution:** Verify `server/routes/caseBase.js` exists and has correct export

### Issue: PDF not uploading
**Solution:** 
1. Check `/uploads` directory exists
2. Verify multer middleware is configured
3. Check file size < 50MB
4. Ensure file is actually PDF mime-type

### Issue: 404 on `/api/case-base/*` routes
**Solution:** 
1. Restart backend server
2. Verify route is registered in `server.js`
3. Check case-base model is imported in controller

### Issue: Search not working
**Solution:**
1. Ensure MongoDB text indexes are created
2. Query parameter format: `?search=keyword`
3. Case search is case-insensitive

---

## 📦 Package Dependencies

All required packages are already in your `package.json`:

**Server:**
- express
- mongoose
- multer
- jsonwebtoken
- bcryptjs
- cors

**Client:**
- react
- react-router-dom
- axios
- bootstrap (via CSS)

No additional packages needed!

---

## 🎨 Styling

All components use **Bootstrap 5** classes:
- Cards with shadows (`card shadow-sm`)
- Responsive grid (`col-lg-4 col-md-6`)
- Badges for categories
- Buttons with appropriate colors
- Alerts for errors/success
- Progress bar for uploads
- Pagination controls

Maintains consistency with existing project styling.

---

## 🔄 Database Schema

### CaseBase Collection
```javascript
{
  title: String (required),
  category: String (required),
  brief: String (required, 500 chars max),
  description: String,
  pdfUrl: String (required),
  keywords: [String],
  court: String,
  judge: String,
  citation: String,
  year: Number,
  createdBy: ObjectId (ref: User),
  views: Number (default: 0),
  isPublished: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing Recommendations

### Manual Testing Checklist

1. **Upload Case (Lawyer)**
   - [ ] Login as lawyer
   - [ ] Navigate to upload page
   - [ ] Fill form with valid data
   - [ ] Select PDF file
   - [ ] Upload succeeds
   - [ ] Redirects to case list

2. **View Cases (All Users)**
   - [ ] See case list page
   - [ ] Search works
   - [ ] Category filter works
   - [ ] Pagination works
   - [ ] Click case opens details

3. **Case Details**
   - [ ] See all metadata
   - [ ] PDF viewer loads
   - [ ] Download button works
   - [ ] View count increments

4. **Lawyer Controls**
   - [ ] Edit button appears for own cases
   - [ ] Delete button appears for own cases
   - [ ] Edit updates case
   - [ ] Delete removes case

---

## 📋 Configuration Notes

### File Upload
- **Location:** `/uploads/cases` (via `express.static('uploads')`)
- **Max Size:** 50MB for PDFs
- **Allowed Types:** PDF only (MIME: `application/pdf`)
- **Naming:** Timestamped with original extension

### Search
- **Full-text:** title, description, keywords
- **Exact Match:** category
- **Case Insensitive:** All text searches

### Pagination
- **Default Limit:** 12 per page
- **Max Limit:** 50 per page
- **Supported:** Automatic calculation of totalPages

---

## 🚀 Next Steps (Optional Enhancements)

1. **Advanced Search**
   - Date range filters
   - Judge filters
   - Court filters

2. **User Interactions**
   - Case bookmarks/favorites
   - User ratings/reviews
   - Citation tracking

3. **Export Features**
   - Export case summaries as DOC
   - Email case details
   - Print-friendly view

4. **Analytics**
   - Most viewed cases
   - Most searched keywords
   - Category popularity

5. **Content Management**
   - Admin approval system
   - Case tagging
   - Related cases suggestions

---

## ✅ Verification Checklist

- [x] Backend model created
- [x] Controller with full CRUD
- [x] Routes with proper authorization
- [x] PDF upload middleware
- [x] Frontend components created/enhanced
- [x] Search and filtering
- [x] PDF viewer
- [x] Pagination
- [x] Error handling
- [x] Bootstrap styling
- [x] Role-based access
- [x] Database indexes
- [x] Server routes registered
- [x] App routes updated
- [x] No package installs needed

---

## 📞 Support

If you encounter any issues:

1. Check MongoDB connection
2. Verify all routes are registered
3. Check browser console for errors
4. Check server logs for backend errors
5. Verify JWT token is valid
6. Test API endpoints with Postman/curl

---

**Implementation Date:** April 20, 2026
**Status:** ✅ Complete and Ready for Testing
