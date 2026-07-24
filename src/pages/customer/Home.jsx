import { useState } from 'react';
import { products, stores } from '../../data/mockData';
import ProductList from '../../components/customer/ProductList';

export default function Home({ onAddToCart }) {
    const [selectedStore, setSelectedStore] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = products.filter((p) => {
        const matchesStore = selectedStore ? p.storeId === selectedStore : true;
        const matchesSearch = searchQuery
            ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
        return matchesStore && matchesSearch;
    });

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Hero */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
                    Discover Near-Expiry Deals
                </h1>
                <p className="text-gray-500 text-sm">
                    Save money, reduce waste. Fresh products at unbeatable prices.
                </p>
            </div>

            <h2 className="text-base font-bold text-gray-800 mb-3">Nearby Stores</h2>
            <div className="flex gap-2.5 overflow-x-auto pb-2">
                <button
                    onClick={() => setSelectedStore(null)}
                    className={`
              shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
              ${!selectedStore
                            ? 'bg-blue text-white shadow-sm shadow-blue/30 border border-blue'
                            : 'bg-white text-gray-500 border border-gray-200 hover:border-blue/40 hover:text-blue'
                        }
            `}
                >
                    All Stores
                </button>
                {stores.map((store) => (
                    <button
                        key={store.id}
                        onClick={() => setSelectedStore(store.id)}
                        className={`
                shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
                ${selectedStore === store.id
                                ? 'bg-blue text-white shadow-sm shadow-blue/30 border border-blue'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-blue/40 hover:text-blue'
                            }
              `}
                    >
                        <span className="mr-1.5">🏪</span>
                        {store.name}
                        <span className="ml-1.5 text-xs opacity-60">{store.distance}</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search products or categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all shadow-sm"
                    />
                </div>
            </div>

                                ? 'bg-blue text-white shadow-sm shadow-blue/30 border border-blue'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-blue/40 hover:text-blue'
                            }
            `}
                    >
                        All Stores
                    </button>
                    {stores.map((store) => (
                        <button
                            key={store.id}
                            onClick={() => setSelectedStore(store.id)}
                            className={`
                shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
                ${selectedStore === store.id
                                    ? 'bg-blue text-white shadow-sm shadow-blue/30 border border-blue'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-blue/40 hover:text-blue'
                                }
              `}
                        >
                            <span className="mr-1.5">🏪</span>
                            {store.name}
                            <span className="ml-1.5 text-xs opacity-60">{store.distance}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Products grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-800">
                        {selectedStore
                            ? stores.find((s) => s.id === selectedStore)?.name
                            : 'All Products'}
                    </h2>
                    <span className="text-sm text-gray-400">{filteredProducts.length} deals</span>
                </div>
                <ProductList products={filteredProducts} onAddToCart={onAddToCart} />
            </div>
        </div>
    );
}
