import { Link } from 'react-router-dom';
import ProductForm from '../../components/store/ProductForm';

export default function AddProduct() {
    const handleSubmit = (formData) => {
        console.log('New product:', formData);
        alert('✅ Product added successfully! (Demo mode — no backend connected)');
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="mb-6">
                <Link to="/store" className="text-sm text-gray-400 hover:text-blue no-underline transition-colors">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Add New Product</h1>
                <p className="text-gray-500 text-sm mt-1">
                    List a near-expiry product. Discount is auto-calculated based on expiry date.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <ProductForm onSubmit={handleSubmit} />
            </div>
        </div>
    );
}
