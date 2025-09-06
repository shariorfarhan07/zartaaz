import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Filter, Grid, List, ChevronDown, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    size: '',
    color: '',
    inStock: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    // Get filters from URL params
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;

    setFilters(prev => ({ ...prev, category }));
    setPagination(prev => ({ ...prev, page }));

    fetchCategories();
    fetchProducts({ category, search, page });
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: params.page || pagination.page,
        limit: pagination.limit,
        sort: sortBy,
        ...filters,
        ...params
      });

      const response = await axios.get(`/api/products?${queryParams}`);
      const { products, pagination: paginationData } = response.data;

      setProducts(products || []);
      setPagination(paginationData || { page: 1, limit: 12, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    fetchProducts({ sort: value });
  };

  const handleWishlistToggle = (product) => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const handleQuickAdd = (product) => {
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      addToCart(product, 1, firstVariant.size, firstVariant.color);
      toast.success('Added to cart');
    }
  };

  const handleBuyNow = (product) => {
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      addToCart(product, 1, firstVariant.size, firstVariant.color);
      navigate('/checkout');
    } else {
      toast.error('Product not available for purchase');
    }
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'sale', label: 'On Sale' },
    ...categories.map(cat => ({
      value: cat._id,
      label: cat.name
    }))
  ];

  const priceRanges = [
    { value: '', label: 'All Prices' },
    { value: '0-50', label: 'Under $50' },
    { value: '50-100', label: '$50 - $100' },
    { value: '100-200', label: '$100 - $200' },
    { value: '200+', label: 'Over $200' }
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-light text-gray-900 mb-2">
              {filters.category ? categoryOptions.find(c => c.value === filters.category)?.label : 'All Products'}
            </h1>
            <p className="text-gray-600">
              {pagination.total} products found
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'} rounded-l-lg`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'} rounded-r-lg`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:w-64 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {categoryOptions.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Price Range</h4>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {priceRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Size</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => handleFilterChange('size', filters.size === size ? '' : size)}
                        className={`py-2 px-3 text-sm border rounded-lg transition-colors ${
                          filters.size === size
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* In Stock Filter */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                  </label>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setFilters({
                      category: '',
                      priceRange: '',
                      size: '',
                      color: '',
                      inStock: false
                    });
                    setSearchParams({});
                  }}
                  className="w-full py-2 px-4 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                <button
                  onClick={() => {
                    setFilters({
                      category: '',
                      priceRange: '',
                      size: '',
                      color: '',
                      inStock: false
                    });
                    setSearchParams({});
                  }}
                  className="mt-4 btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                  {products.map((product) => (
                    <div key={product._id} className={`group bg-white rounded-lg overflow-hidden shadow-sm card-hover ${viewMode === 'list' ? 'flex' : ''}`}>
                      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-[3/4]'} bg-gray-100 image-zoom`}>
                        <Link to={`/product/${product._id}`}>
                          <img
                            src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        
                        {/* Wishlist Button */}
                        <button
                          onClick={() => handleWishlistToggle(product)}
                          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              isInWishlist(product._id)
                                ? 'text-red-500 fill-current'
                                : 'text-gray-400 hover:text-red-500'
                            } transition-colors`}
                          />
                        </button>

                        {/* Action Buttons */}
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
                          <button
                            onClick={() => handleQuickAdd(product)}
                            className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            Quick Add
                          </button>
                          <button
                            onClick={() => handleBuyNow(product)}
                            className="w-full bg-white text-gray-900 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
                          >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Buy Now
                          </button>
                        </div>

                        {/* Sale Badge */}
                        {(product.discountPrice || product.salePrice) && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
                            Sale
                          </div>
                        )}
                      </div>

                      <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
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
                              ${product.discountPrice || product.salePrice || product.price}
                            </span>
                            {(product.discountPrice || product.salePrice) && (
                              <>
                                <span className="text-sm text-gray-500 line-through">
                                  ${product.originalPrice || product.price}
                                </span>
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                  {Math.round((((product.originalPrice || product.price) - (product.discountPrice || product.salePrice)) / (product.originalPrice || product.price)) * 100)}% OFF
                                </span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
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

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex space-x-2">
                      {[...Array(pagination.pages)].map((_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => {
                              const params = new URLSearchParams(searchParams);
                              params.set('page', page.toString());
                              setSearchParams(params);
                            }}
                            className={`px-4 py-2 rounded-lg ${
                              page === pagination.page
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            } transition-colors`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;