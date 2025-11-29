const cron = require('node-cron');
const Auction = require('../models/Auction');

const startAuctionCron = (io) => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('Running auction check cron job...');
        try {
            const now = new Date();

            // Find active auctions that have ended
            const expiredAuctions = await Auction.find({
                isActive: true,
                endTime: { $lt: now },
            }).populate('winner', 'username email');

            for (const auction of expiredAuctions) {
                // Determine winner
                if (auction.bids.length > 0) {
                    const highestBid = auction.bids.reduce((prev, current) => {
                        return (prev.amount > current.amount) ? prev : current;
                    });
                    auction.winner = highestBid.bidder;
                }

                auction.isActive = false;
                await auction.save();

                // Populate winner details for the event
                const closedAuction = await Auction.findById(auction._id)
                    .populate('winner', 'username')
                    .populate('creator', 'username');

                console.log(`Auction closed: ${auction.title}. Winner: ${closedAuction.winner ? closedAuction.winner.username : 'None'}`);

                // Emit event to clients in the room
                io.to(auction._id.toString()).emit('auctionEnded', closedAuction);
            }
        } catch (error) {
            console.error('Error in auction cron job:', error);
        }
    });
};

module.exports = startAuctionCron;
