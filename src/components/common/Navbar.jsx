import { Link } from 'react-router-dom';

const roleConfig = {
    customer: { label: 'Customer', icon: '🛒' },
    store: { label: 'Store Owner', icon: '🏪' },
    delivery: { label: 'Delivery', icon: '🚴' },
};

export default function Navbar({ role, cartCount = 0 }) {
    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 no-underline">
                    <div className="w-9 h-9 rounded-xl bg-blue flex items-center justify-center text-white text-lg font-extrabold shadow-md shadow-blue/30">
                        N
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900">
                        Near<span className="text-blue">X</span>
                    </span>
                </Link>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* Role indicator */}
                    <span className="hidden sm:flex items-center gap-1.5 bg-blue/10 text-blue px-3 py-1.5 rounded-full text-xs font-semibold">
                        <span>{roleConfig[role]?.icon}</span>
                        <span>{roleConfig[role]?.label}</span>
                    </span>

                    {/* Cart (customer only) */}
                    {role === 'customer' && (
                        <Link
                            to="/cart"
                            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue/10 hover:bg-blue/20 transition-colors no-underline"
                        >
                            <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
