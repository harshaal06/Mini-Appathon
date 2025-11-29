import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import AuctionCard from '../components/AuctionCard';

const Dashboard = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const { data } = await api.get('/auctions');
                setAuctions(data);
            } catch (error) {
                console.error('Error fetching auctions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuctions();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Live Auctions</h1>
                    <p className="text-slate-400">Discover and bid on exclusive items</p>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-12">Loading auctions...</div>
                ) : auctions.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 bg-slate-800 rounded-xl border border-slate-700">
                        <p className="text-lg">No active auctions found.</p>
                        <p className="text-sm mt-2">Be the first to create one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auctions.map((auction) => (
                            <AuctionCard key={auction._id} auction={auction} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
