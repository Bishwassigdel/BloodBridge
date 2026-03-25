import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

import {
  createBloodRequest,
  getMyRequests,
  acceptBloodRequest,
  fulfillBloodRequest,
  getMatchingRequests,
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

router.use(protect);

router.post('/request', createBloodRequest);
router.get('/my-requests', getMyRequests);
router.get('/matching-requests', getMatchingRequests);
router.patch('/:id/accept', acceptBloodRequest);
router.patch('/:id/fulfill', fulfillBloodRequest);

router.post('/donate', recordDonation);
router.get('/my-donations', getDonationHistory);

// Hospital-only
router.use(restrictTo('hospital'));

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