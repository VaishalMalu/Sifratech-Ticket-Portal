const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { accountManagerMiddleware } = require('../middleware/accountManagerMiddleware');
const {
    getBusinessCases,
    getBusinessCaseById,
    saveBusinessCase,
    getWsrDrafts,
    saveWsrDraft,
    generateWSRMetrics,
    aiSummarizeWSR,
    generateBCSAIContent
} = require('../controllers/ReportsController');

// All reports routes require authentication and Account Manager role
router.use(authMiddleware);
router.use(accountManagerMiddleware);

// Business Case Studies
router.get('/cases', getBusinessCases);
router.get('/cases/:id', getBusinessCaseById);
router.post('/cases', saveBusinessCase);
router.put('/cases/:id', saveBusinessCase);
router.post('/bcs-generate', generateBCSAIContent);

// Periodic Status Reports (PSR)
router.get('/wsr-drafts', getWsrDrafts);
router.post('/wsr-drafts', saveWsrDraft);
router.put('/wsr-drafts/:id', saveWsrDraft);

// Metrics and AI
router.post('/wsr-generate', generateWSRMetrics);
router.post('/wsr-summarize', aiSummarizeWSR);

module.exports = router;

