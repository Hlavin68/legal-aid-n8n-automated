import CaseBase from '../models/CaseBase.js';
import User from '../models/User.js';

/**
 * Get all cases from case base with filtering and search
 * Available to: All authenticated users (client, lawyer, paralegal)
 */
export const getAllCases = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { isPublished: true };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brief: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } },
        { court: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== '') {
      query.category = category;
    }

    // Pagination
    const pageNum = parseInt(page);
    const pageSize = Math.min(parseInt(limit), 50); // Max 50 per page
    const skip = (pageNum - 1) * pageSize;

    // Execute query
    const cases = await CaseBase.find(query)
      .populate('createdBy', 'name firm')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Get total count for pagination
    const totalCount = await CaseBase.countDocuments(query);
    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
      success: true,
      cases,
      pagination: {
        currentPage: pageNum,
        pageSize,
        totalCases: totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get single case by ID
 * Available to: All authenticated users (client, lawyer, paralegal)
 */
export const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await CaseBase.findById(caseId)
      .populate('createdBy', 'name firm licenseNumber');

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (!caseData.isPublished) {
      return res.status(403).json({ error: 'This case is not published' });
    }

    // Increment view count
    caseData.views += 1;
    await caseData.save();

    res.json({
      success: true,
      case: caseData
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new case in case base
 * Available to: Lawyers only
 */
export const createCase = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // 🔐 Auth check (prevents req.user crash)
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - user not found"
      });
    }

    // 👮 Role check
    if (userRole !== "lawyer") {
      return res.status(403).json({
        success: false,
        error: "Only lawyers can create cases"
      });
    }

    // 📄 File check (CRITICAL FIX)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "PDF file is required"
      });
    }

    // 📄 Validate file type
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        error: "Only PDF files are allowed"
      });
    }

    const {
      title,
      category,
      brief,
      description,
      year,
      court,
      judge,
      citation,
      keywords
    } = req.body;

    // 🧾 Validation
    if (!title || !category || !brief) {
      return res.status(400).json({
        success: false,
        error: "Title, category, and brief are required"
      });
    }

    // 🔍 DEBUG (remove in production later)
    console.log("USER:", req.user);
    console.log("FILE:", req.file);
    console.log("BODY:", req.body);

    // 🧠 Keywords handling
    let parsedKeywords = [];
    if (keywords) {
      parsedKeywords =
        typeof keywords === "string"
          ? keywords.split(",").map((k) => k.trim())
          : keywords;
    }

    // 📦 Create case
    const newCase = new CaseBase({
      title,
      category,
      brief,
      description: description || "",
      year: year ? parseInt(year) : new Date().getFullYear(),
      court: court || "",
      judge: judge || "",
      citation: citation || "",
      keywords: parsedKeywords,

      // 🚨 SAFE FILE HANDLING (FIX FOR 500 ERROR)
      pdfUrl: `/uploads/${req.file.filename}`,
      createdBy: userId,
      isPublished: true
    });

    await newCase.save();

    // 👤 Populate creator
    await newCase.populate("createdBy", "name firm licenseNumber");

    return res.status(201).json({
      success: true,
      message: "Case created successfully",
      case: newCase
    });

  } catch (error) {
    console.error("CREATE CASE ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
};

/**
 * Update a case in case base
 * Available to: Lawyers only (must be creator)
 */
export const updateCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only lawyers can update cases
    if (userRole !== 'lawyer') {
      return res.status(403).json({ error: 'Only lawyers can update cases' });
    }

    let caseData = await CaseBase.findById(caseId);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization - only creator can update
    if (caseData.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this case' });
    }

    const { title, category, brief, description, year, court, judge, citation, keywords } = req.body;

    // Update fields
    if (title) caseData.title = title;
    if (category) caseData.category = category;
    if (brief) caseData.brief = brief;
    if (description !== undefined) caseData.description = description;
    if (year) caseData.year = parseInt(year);
    if (court !== undefined) caseData.court = court;
    if (judge !== undefined) caseData.judge = judge;
    if (citation !== undefined) caseData.citation = citation;
    if (keywords) {
      caseData.keywords = typeof keywords === 'string'
        ? keywords.split(',').map(k => k.trim())
        : keywords;
    }

    await caseData.save();
    await caseData.populate('createdBy', 'name firm licenseNumber');

    res.json({
      success: true,
      message: 'Case updated successfully',
      case: caseData
    });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a case from case base
 * Available to: Lawyers only (must be creator)
 */
export const deleteCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only lawyers can delete cases
    if (userRole !== 'lawyer') {
      return res.status(403).json({ error: 'Only lawyers can delete cases' });
    }

    const caseData = await CaseBase.findById(caseId);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization - only creator can delete
    if (caseData.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this case' });
    }

    await CaseBase.findByIdAndDelete(caseId);

    res.json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get cases created by current user
 * Available to: Lawyers only
 */
export const getMyCases = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'lawyer') {
      return res.status(403).json({ error: 'Only lawyers can access this' });
    }

    const cases = await CaseBase.find({ createdBy: userId })
      .populate('createdBy', 'name firm licenseNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      cases
    });
  } catch (error) {
    console.error('Error fetching user cases:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get case categories
 * Available to: All authenticated users
 */
export const getCategories = async (req, res) => {
  try {
    const categories = [
      'Property Law',
      'Employment Law',
      'Family Law',
      'Criminal Law',
      'Business & Contracts',
      'Corporate Law',
      'Immigration',
      'Intellectual Property',
      'Constitutional Law',
      'Environmental Law',
      'Tax Law',
      'Other'
    ];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
};
