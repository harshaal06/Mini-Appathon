import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Clock, DollarSign, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const AuctionDetails = () => {
    const { id } = useParams();
    const [auction, setAuction] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timeLeft, setTimeLeft] = useState('');
    const socket = useSocket();
    const { user } = useAuth();

    const fetchAuction = async () => {
        try {
            const { data } = await api.get(`/auctions/${id}`);
            setAuction(data);
            setBidAmount(data.currentPrice + 10); // Suggest next bid
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAuction();
    }, [id]);

    // Real-time updates
    useEffect(() => {
        if (!socket) return;

        socket.on('bidUpdate', (updatedAuction) => {
            if (updatedAuction._id === id) {
                setAuction(updatedAuction);
                setBidAmount(updatedAuction.currentPrice + 10);
            }
        });

        socket.on('auctionEnded', (endedAuction) => {
            if (endedAuction._id === id) {
                setAuction(endedAuction);
            }
        });

        return () => {
            socket.off('bidUpdate');
            socket.off('auctionEnded');
        };
    }, [socket, id]);

    // Countdown Timer
    useEffect(() => {
        if (!auction) return;

        const calculateTimeLeft = () => {
            const difference = new Date(auction.endTime) - new Date();

            if (difference > 0) {
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeLeft('Ended');
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
    }, [auction]);

    const handleBid = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await api.post(`/auctions/${id}/bid`, { amount: Number(bidAmount) });
            setSuccess('Bid placed successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place bid');
        }
    };

    const handleRequestAccess = async () => {
        try {
            await api.post(`/auctions/${id}/request-access`);
            setSuccess('Access request sent!');
            fetchAuction(); // Refresh to show pending status
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request access');
        }
    };

    const handleApprove = async (userId) => {
        try {
            await api.post(`/auctions/${id}/approve`, { userId });
            setSuccess('User approved!');
            fetchAuction(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve user');
        }
    };

    if (!auction) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;

    const isOwner = user && auction.creator._id === user._id;
    const isWinner = user && auction.winner?._id === user._id;
    const isEnded = !auction.isActive || new Date() > new Date(auction.endTime);

    // Check access status for buyer
    const accessRequest = user ? auction.accessRequests?.find(r => r.user._id === user._id) : null;
    const isApproved = accessRequest?.status === 'approved';
    const isPending = accessRequest?.status === 'pending';

    return (
        <div className="min-h-screen bg-slate-900">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Details */}
                    <div className="space-y-6">
                        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                            {auction.image && (
                                <div className="h-64 w-full bg-slate-700">
                                    <img
                                        src={auction.image}
                                        alt={auction.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-6">
                                <h1 className="text-3xl font-bold text-white mb-4">{auction.title}</h1>
                                <p className="text-slate-300 leading-relaxed mb-6">{auction.description}</p>

                                <div className="flex items-center gap-4 text-sm text-slate-400 border-t border-slate-700 pt-4">
                                    <div className="flex items-center gap-2">
                                        <User size={16} />
                                        <span>Seller: {auction.creator.username}</span>
                                    </div>
                                    <div>•</div>
                                    <div>Created: {new Date(auction.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Access Requests (Seller Only) */}
                        {isOwner && (
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-4">Access Requests</h3>
                                <div className="space-y-3">
                                    {auction.accessRequests?.filter(r => r.status === 'pending').map((req, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                                            <span className="font-medium text-slate-300">{req.user.username}</span>
                                            <button
                                                onClick={() => handleApprove(req.user._id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    ))}
                                    {auction.accessRequests?.filter(r => r.status === 'pending').length === 0 && (
                                        <p className="text-slate-500 text-sm">No pending requests.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bid History */}
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                            <h3 className="text-xl font-bold text-white mb-4">Bid History</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {auction.bids.slice().reverse().map((bid, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-indigo-400">{bid.bidder.username}</span>
                                            {index === 0 && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Highest</span>}
                                        </div>
                                        <div className="text-slate-300">${bid.amount}</div>
                                    </div>
                                ))}
                                {auction.bids.length === 0 && <p className="text-slate-500 text-center py-4">No bids yet.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Bidding Action */}
                    <div className="space-y-6">
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 sticky top-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Current Price</p>
                                    <div className="flex items-center gap-2 text-3xl font-bold text-green-400">
                                        <DollarSign size={28} />
                                        {auction.currentPrice}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-sm mb-1">Time Remaining</p>
                                    <div className="flex items-center gap-2 text-xl font-mono text-indigo-400">
                                        <Clock size={20} />
                                        {timeLeft}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm mb-4">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-lg text-sm mb-4">
                                    <CheckCircle size={16} />
                                    {success}
                                </div>
                            )}

                            {isEnded ? (
                                <div className={`p-4 rounded-lg text-center ${isWinner ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'}`}>
                                    <p className="font-bold text-lg mb-1">Auction Ended</p>
                                    {isWinner ? (
                                        <p>🎉 Congratulations! You won this auction.</p>
                                    ) : (
                                        <p>Winner: {auction.winner?.username || 'No Bids'}</p>
                                    )}
                                </div>
                            ) : isOwner ? (
                                <div className="bg-slate-700/50 p-4 rounded-lg text-center text-slate-400">
                                    You are the seller of this item.
                                </div>
                            ) : !isApproved ? (
                                <div className="space-y-4">
                                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-lg text-indigo-300 text-sm">
                                        You must request access from the seller to bid on this item.
                                    </div>
                                    {isPending ? (
                                        <button disabled className="w-full bg-slate-700 text-slate-400 font-bold py-3 rounded-lg cursor-not-allowed">
                                            Approval Pending...
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleRequestAccess}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/25"
                                        >
                                            Request Access to Bid
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleBid} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Your Bid</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <DollarSign size={18} className="text-slate-500" />
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                min={auction.currentPrice + 1}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                                                value={bidAmount}
                                                onChange={(e) => setBidAmount(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Enter ${auction.currentPrice + 1} or more</p>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25"
                                    >
                                        Place Bid
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AuctionDetails;
