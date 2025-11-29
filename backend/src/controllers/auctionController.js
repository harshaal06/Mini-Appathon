const Auction = require('../models/Auction');

// @desc    Create a new auction
// @route   POST /api/auctions
// @access  Private (Seller/Admin)
exports.createAuction = async (req, res) => {
    const { title, description, startingPrice, endTime, image } = req.body;

    try {
        const auction = await Auction.create({
            title,
            description,
            startingPrice,
            currentPrice: startingPrice,
            endTime,
            image,
            creator: req.user._id,
        });

        res.status(201).json(auction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all auctions
// @route   GET /api/auctions
// @access  Public
exports.getAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(auctions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single auction
// @route   GET /api/auctions/:id
// @access  Public
exports.getAuctionById = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate('creator', 'username')
            .populate('bids.bidder', 'username')
            .populate('winner', 'username')
            .populate('accessRequests.user', 'username');

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        res.json(auction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Place a bid
// @route   POST /api/auctions/:id/bid
// @access  Private (Buyer)
exports.placeBid = async (req, res) => {
    const { amount } = req.body;

    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (!auction.isActive || new Date() > new Date(auction.endTime)) {
            return res.status(400).json({ message: 'Auction has ended' });
        }

        if (auction.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Creator cannot bid on their own auction' });
        }

        // Check if user is approved
        const accessRequest = auction.accessRequests.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (!accessRequest || accessRequest.status !== 'approved') {
            return res.status(403).json({ message: 'You must be approved by the seller to bid on this auction' });
        }

        if (amount <= auction.currentPrice) {
            return res.status(400).json({ message: 'Bid must be higher than current price' });
        }

        auction.bids.push({
            bidder: req.user._id,
            amount,
        });

        auction.currentPrice = amount;
        await auction.save();

        // Populate for socket response
        const updatedAuction = await Auction.findById(req.params.id)
            .populate('creator', 'username')
            .populate('bids.bidder', 'username')
            .populate('winner', 'username');

        // Emit socket event to the specific auction room
        const io = req.app.get('io');
        io.to(req.params.id).emit('bidUpdate', updatedAuction);

        res.json(updatedAuction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request access to bid
// @route   POST /api/auctions/:id/request-access
// @access  Private (Buyer)
exports.requestAccess = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (auction.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Creator does not need to request access' });
        }

        const existingRequest = auction.accessRequests.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (existingRequest) {
            return res.status(400).json({ message: 'Request already sent' });
        }

        auction.accessRequests.push({
            user: req.user._id,
            status: 'pending',
        });

        await auction.save();

        // Populate for socket response
        const updatedAuction = await Auction.findById(req.params.id)
            .populate('creator', 'username')
            .populate('bids.bidder', 'username')
            .populate('winner', 'username')
            .populate('accessRequests.user', 'username');

        // Emit socket event for real-time update to the specific auction room
        const io = req.app.get('io');
        io.to(req.params.id).emit('accessRequested', updatedAuction);

        res.json({ message: 'Access request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve bidder
// @route   POST /api/auctions/:id/approve
// @access  Private (Seller)
exports.approveBidder = async (req, res) => {
    const { userId } = req.body;

    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (auction.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the creator can approve bidders' });
        }

        const request = auction.accessRequests.find(
            (r) => r.user.toString() === userId
        );

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = 'approved';
        await auction.save();

        // Populate for socket response
        const updatedAuction = await Auction.findById(req.params.id)
            .populate('creator', 'username')
            .populate('bids.bidder', 'username')
            .populate('winner', 'username')
            .populate('accessRequests.user', 'username');

        // Emit socket event for real-time update to the specific auction room
        const io = req.app.get('io');
        io.to(req.params.id).emit('bidderApproved', updatedAuction);

        res.json({ message: 'Bidder approved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve all pending bidders
// @route   POST /api/auctions/:id/approve-all
// @access  Private (Seller)
exports.approveAllBidders = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        if (auction.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the creator can approve bidders' });
        }

        // Approve all pending requests
        let approvedCount = 0;
        auction.accessRequests.forEach((request) => {
            if (request.status === 'pending') {
                request.status = 'approved';
                approvedCount++;
            }
        });

        if (approvedCount === 0) {
            return res.status(400).json({ message: 'No pending requests to approve' });
        }

        await auction.save();

        // Populate for socket response
        const updatedAuction = await Auction.findById(req.params.id)
            .populate('creator', 'username')
            .populate('bids.bidder', 'username')
            .populate('winner', 'username')
            .populate('accessRequests.user', 'username');

        // Emit socket event for real-time update to the specific auction room
        const io = req.app.get('io');
        io.to(req.params.id).emit('allBiddersApproved', updatedAuction);

        res.json({ message: `${approvedCount} bidder(s) approved successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
