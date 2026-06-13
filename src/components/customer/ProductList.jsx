import ProductCard from '../common/ProductCard';

export default function ProductList({ products, onAddToCart }) {
    if (!products || products.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-400 font-medium">No products found</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
        </div>
    );
}
