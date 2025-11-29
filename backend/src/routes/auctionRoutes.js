const express = require('express');
const router = express.Router();
const { createAuction, getAuctions, getAuctionById, placeBid, requestAccess, approveBidder, approveAllBidders } = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
    .post(protect, authorize('seller', 'admin'), createAuction)
    .get(getAuctions);

router.route('/:id')
    .get(getAuctionById);

router.route('/:id/bid')
    .post(protect, placeBid);

router.route('/:id/request-access')
    .post(protect, requestAccess);

router.route('/:id/approve')
    .post(protect, authorize('seller', 'admin'), approveBidder);

router.route('/:id/approve-all')
    .post(protect, authorize('seller', 'admin'), approveAllBidders);

module.exports = router;
