# Case Base Feature - Quick Start Guide

## What Was Added?

A complete **Legal Case Library** feature that allows users to browse legal precedents and lawyers to upload case documents with PDF judgments.

---

## ⚡ Quick Start

### 1. Start the Backend
```bash
cd server
npm run dev
```
You should see: "Connected to MongoDB"

### 2. Start the Frontend
```bash
cd client
npm start
```

### 3. Navigate to Case Library
- **Clients:** Click "Case Base" in sidebar → `/client/case-base`
- **Lawyers:** Click "Case Base" in sidebar → `/lawyer/case-base`

---

## 🎬 What Users Can Do

### Clients
- ✅ View all published legal cases
- ✅ Search cases by keywords, title, court, judge
- ✅ Filter cases by category
- ✅ Read case summaries and full details
- ✅ View embedded PDF judgments in browser
- ✅ Download PDF files

### Lawyers
- ✅ All client permissions PLUS:
- ✅ Upload new cases with PDF documents
- ✅ Edit their own uploaded cases
- ✅ Delete their own uploaded cases
- ✅ See upload progress bar

---

## 📱 Pages Created

| Page | Route | Who | Purpose |
|------|-------|-----|---------|
| Case Library | `/*/case-base` | All | Browse cases |
| Case Details | `/*/case-base/:id` | All | View full case with PDF |
| Upload Case | `/lawyer/upload-case` | Lawyers | Upload new case |

---

## 🔧 Files Overview

### New Backend Files
- `server/models/CaseBase.js` - Database model
- `server/controllers/caseBaseController.js` - Business logic
- `server/routes/caseBase.js` - API endpoints

### New Frontend Files
- `client/src/pages/UploadCase.jsx` - Upload form

### Modified Files
- `server/server.js` - Registered routes
- `server/middleware/upload.js` - Added PDF upload config
- `client/src/App.jsx` - Added upload route
- `client/src/pages/CaseBase.jsx` - Enhanced search/filter
- `client/src/pages/CaseBaseDetails.jsx` - Added PDF viewer

---

## 🌐 API Endpoints

```
GET  /api/case-base/list             → Get all cases (search & filter)
GET  /api/case-base/:id              → Get single case
GET  /api/case-base/categories       → Get categories

POST /api/case-base/create           → Upload new case (lawyers)
PUT  /api/case-base/:id              → Update case (lawyers)
DELETE /api/case-base/:id            → Delete case (lawyers)
GET  /api/case-base/lawyer/my-cases  → Get my cases (lawyers)
```

---

## 📋 Upload Form Fields

For lawyers uploading cases:

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| Title | Yes | Text | e.g., "Republic vs. John Doe" |
| Category | Yes | Select | 12 legal categories |
| Brief | Yes | Text | Summary (max 500 chars) |
| Description | No | Text | Full case details |
| Year | No | Number | Case year |
| Court | No | Text | e.g., "High Court of Kenya" |
| Judge | No | Text | Judge name |
| Citation | No | Text | e.g., "[2023] eKLR" |
| Keywords | No | Text | Comma-separated |
| PDF | Yes | File | Only PDFs, max 50MB |

---

## 🔒 Access Control

```
Route                    Clients  Lawyers  Paralegals
GET /case-base/list      ✅       ✅       ✅
GET /case-base/:id       ✅       ✅       ✅
GET /case-base/categories ✅      ✅       ✅
POST /create             ❌       ✅       ❌
PUT /:id                 ❌       ✅*      ❌
DELETE /:id              ❌       ✅*      ❌
(*Only for own cases)
```

---

## 🎨 User Interface

### Case Library Page
- Search bar (title, keywords, court, judge)
- Category dropdown filter
- Clear filters button
- Case cards showing:
  - Title
  - Category + Year badges
  - Brief summary
  - Court, Judge, Citation info
  - View count
  - "View Full Case" button
- Pagination (12 per page)

### Case Details Page
- Full case title and metadata
- Download PDF button
- Edit/Delete buttons (lawyers only)
- Brief summary card
- Metadata cards (court, judge, citation)
- Full description
- Keywords tags
- Embedded PDF viewer (600px)
- View count and reading time estimate

### Upload Case Page (Lawyers Only)
- Form with all fields above
- File input with validation
- Upload progress bar
- Tips section
- Cancel button

---

## 🐛 Common Tasks

### Upload a Case
1. Login as lawyer
2. Click "📚 Legal Case Library" 
3. Click "➕ Upload New Case"
4. Fill form fields
5. Select PDF file
6. Click "Upload Case"
7. Redirects to case list when done

### Search Cases
1. Go to Case Library
2. Type in search box (updates in real-time)
3. Results filtered by title, keywords, court, judge

### Filter by Category
1. Go to Case Library
2. Select category from dropdown
3. Shows only cases in that category
4. Combine with search for precise results

### Download PDF
1. Open case details
2. Scroll to PDF section
3. Click "📥 Download PDF" button
4. PDF downloads to your computer

### Edit Case (Lawyer)
1. Open your uploaded case
2. Click "✏️ Edit" button
3. Modify fields
4. Click "Update" to save

### Delete Case (Lawyer)
1. Open your uploaded case
2. Click "🗑️ Delete" button
3. Confirm deletion
4. Case removed from library

---

## 🧪 Testing Tips

### Test Search
- Search: "property"
- Search: "john"
- Search: "High Court"

### Test Filters
- Category: "Property Law"
- Category: "Criminal Law"
- Combine search + category

### Test Upload
- Upload a test PDF
- Verify it appears in list
- Open and verify PDF loads

### Test Edit
- Upload case
- Click Edit
- Change title
- Verify change saved

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| PDF not uploading | Check file is PDF, < 50MB |
| Can't see upload button | Must be logged in as lawyer |
| Search not working | Type full keyword, check spelling |
| PDF viewer blank | Verify PDF file is valid |
| Can't edit case | Only creator can edit |
| API 404 error | Restart backend server |

---

## 📊 Database Info

Cases stored in MongoDB collection: `casebases`

Each case has:
- title, category, brief, description
- pdfUrl (path to uploaded file)
- keywords, court, judge, citation, year
- createdBy (lawyer who uploaded)
- views (increments each time viewed)
- timestamps (createdAt, updatedAt)

---

## 🎯 Next Steps

1. ✅ Verify backend is running
2. ✅ Test creating an account
3. ✅ Upload a test case as lawyer
4. ✅ View as client
5. ✅ Test search and filters
6. ✅ Download PDF
7. ✅ Test edit/delete

---

## 📞 Need Help?

Check the full guide: `CASE_BASE_INTEGRATION.md`

Common issues:
- No PDFs uploading? Check MongoDB is running
- Routes not working? Restart backend
- Search broken? Check search keywords

---

**Status:** ✅ Ready to Use
**Date:** April 20, 2026
