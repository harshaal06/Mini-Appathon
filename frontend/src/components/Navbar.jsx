import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, PlusCircle, Gavel, User } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-slate-800 border-b border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2 text-indigo-500 font-bold text-xl">
                        <Gavel size={24} />
                        <span>SmartAuction</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Dashboard
                        </Link>

                        {user && user.role !== 'buyer' && (
                            <Link to="/create-auction" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-500/25">
                                <PlusCircle size={18} />
                                Create Auction
                            </Link>
                        )}

                        <div className="hidden md:flex items-center gap-3 text-slate-300 bg-slate-800 py-1.5 px-3 rounded-full border border-slate-700">
                            <User size={18} className="text-indigo-400" />
                            <span className="font-medium">{user?.username}</span>
                            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-400 uppercase tracking-wider">{user?.role}</span>
                        </div>

                        <button
                            onClick={logout}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
