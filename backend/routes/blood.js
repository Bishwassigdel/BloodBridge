import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';
import { cacheMiddleware } from '../config/cache.js';

import {
  createBloodRequest,
  getMyRequests,
  acceptBloodRequest,
  fulfillBloodRequest,
  getMatchingRequests,
  cancelBloodRequest,
  editBloodRequest,
  getDonors,
  searchDonors,
  sendDonorAlert,
  getAllRequests,
  assignDonorToRequest,
  emailRespondToRequest,
  getPlatformStats,
  getActiveRequestsMap,
} from '../controllers/bloodController.js';

import { recordDonation, getDonationHistory } from '../controllers/donationController.js';
import {
  updateInventory,
  getInventory,
  getInventoryLogs,
} from '../controllers/inventoryController.js';

import {
  createBloodTransfer,
  acceptBloodTransfer,
  rejectBloodTransfer,
  getTransferHistory,
} from '../controllers/transferController.js';

const router = express.Router();

// ── Public routes (no auth required) ────────────────────────────────────
// Cache platform stats for 60s — these numbers change slowly
router.get('/stats', cacheMiddleware('platform_stats', 60), getPlatformStats);
router.get('/email-respond', emailRespondToRequest);
// Cache active map data for 30s — new requests won't miss the window
router.get('/active-requests-map', cacheMiddleware('active_requests_map', 30), getActiveRequestsMap);
// Cache donor search results for 20s per query-string key
router.get('/search-donors', (req, res, next) => {
  const key = `search_donors:${JSON.stringify(req.query)}`;
  return cacheMiddleware(key, 20)(req, res, next);
}, searchDonors);

router.use(protect);

router.post('/request', createBloodRequest);
router.get('/my-requests', getMyRequests);
router.get('/matching-requests', getMatchingRequests);
router.patch('/:id/accept', acceptBloodRequest);
router.patch('/:id/fulfill', fulfillBloodRequest);
router.patch('/:id/cancel', cancelBloodRequest);
router.patch('/:id/edit', editBloodRequest);

router.post('/donate', recordDonation);
router.get('/my-donations', getDonationHistory);

// Hospital-only
router.use(restrictTo('hospital'));

router.get('/donors', getDonors);
router.post('/donors/alert', sendDonorAlert);
router.get('/all-requests', getAllRequests);
router.patch('/:id/assign-donor', assignDonorToRequest);

router.route('/inventory')
  .post(updateInventory)
  .get(getInventory);

router.get('/inventory-logs', getInventoryLogs);

// ── Blood Transfer Routes ───────────────────────────────────────────────
router.post('/transfer/create', createBloodTransfer);
router.post('/transfer/accept', acceptBloodTransfer);
router.post('/transfer/reject', rejectBloodTransfer);
router.get('/transfer/history', getTransferHistory);

export default router;