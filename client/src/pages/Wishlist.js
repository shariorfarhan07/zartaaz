import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const Wishlist = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleRemoveItem = (productId) => {
    removeFromWishlist(productId);
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = (product) => {
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      addToCart(product, 1, firstVariant.size, firstVariant.color);
      toast.success('Added to cart');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Heart className="mx-auto h-24 w-24 text-gray-300 mb-6" />
            <h2 className="text-2xl font-serif font-light text-gray-900 mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Save items you love to your wishlist and shop them later.
            </p>
            <Link to="/products" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif font-light text-gray-900 mb-2">
              My Wishlist
            </h1>
            <p className="text-gray-600">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          
          {items.length > 0 && (
            <button
              onClick={() => {
                clearWishlist();
                toast.success('Wishlist cleared');
              }}
              className="text-sm text-gray-600 hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((product) => (
            <div key={product._id} className="group bg-white rounded-lg overflow-hidden shadow-sm card-hover">
              <div className="relative aspect-[3/4] bg-gray-100 image-zoom">
                <Link to={`/product/${product._id}`}>
                  <img
                    src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
                
                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveItem(product._id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors" />
                </button>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="absolute bottom-3 left-3 right-3 bg-gray-900 text-white py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>

                {/* Sale Badge */}
                {product.onSale && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
                    Sale
                  </div>
                )}
              </div>

              <div className="p-4">
                <Link to={`/product/${product._id}`}>
                  <h3 className="font-medium text-gray-900 mb-1 group-hover:text-gray-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900">
                      ${product.onSale ? product.salePrice : product.price}
                    </span>
                    {product.onSale && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-red-500 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {product.rating || '4.5'}
                    </span>
                  </div>
                </div>

                {/* Available Sizes */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {product.variants.slice(0, 4).map((variant, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {variant.size}
                        </span>
                      ))}
                      {product.variants.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{product.variants.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-12">
          <Link to="/products" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;