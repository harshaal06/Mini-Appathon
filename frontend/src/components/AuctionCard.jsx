import { Link } from 'react-router-dom';
import { Clock, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';

const AuctionCard = ({ auction }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
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
    }, [auction.endTime]);

    return (
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group">
            <div className="h-48 bg-slate-700 relative overflow-hidden">
                {auction.image ? (
                    <img
                        src={auction.image}
                        alt={auction.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                        No Image
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono text-indigo-400 border border-indigo-500/30">
                    {timeLeft}
                </div>
            </div>

            <div className="p-5">
                <h3 className="text-xl font-bold text-white mb-2 truncate">{auction.title}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{auction.description}</p>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <DollarSign size={18} />
                        <span className="text-lg font-bold">{auction.currentPrice}</span>
                    </div>
                </div>

                <Link
                    to={`/auction/${auction._id}`}
                    className="block w-full bg-slate-700 hover:bg-slate-600 text-white text-center py-2 rounded-lg font-medium transition-colors"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default AuctionCard;
