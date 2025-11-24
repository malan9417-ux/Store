// components/ProductCard.js
import Link from 'next/link';
import Image from 'next/image';

export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product._id}`}>
        <div className="relative h-64">
          <Image
            src={product.images[0]?.url || '/images/placeholder.jpg'}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-cover"
          />
          {product.salePrice && (
            <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
              Sale
            </span>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/products/${product._id}`}>
          <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mt-1">{product.brand}</p>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {product.salePrice ? (
              <>
                <span className="text-lg font-bold text-red-600">
                  ${product.salePrice}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${product.price}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold">${product.price}</span>
            )}
          </div>
          
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="text-sm text-gray-600 ml-1">
              {product.rating} ({product.numReviews})
            </span>
          </div>
        </div>
        
        <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
