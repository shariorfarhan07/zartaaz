import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, RefreshCw, ShoppingCart, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import axios from 'axios';

// Newsletter Component
const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/newsletter/subscribe', {
        email,
        source: 'homepage'
      });
      
      toast.success('Thank you for subscribing to our newsletter!');
      setEmail('');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to subscribe. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-serif font-light mb-4">
          Stay in Style
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Subscribe to our newsletter for exclusive offers and style updates
        </p>
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-6 py-3 bg-white text-gray-900 rounded-l-lg sm:rounded-r-none rounded-r-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 transition-colors rounded-r-lg sm:rounded-l-none rounded-l-lg mt-2 sm:mt-0 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get('/api/products?featured=true&limit=12');
      setFeaturedProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add with default size and color for quick add
    const defaultSize = product.sizes?.[0] || 'One Size';
    const defaultColor = product.colors?.[0] || 'Default';
    
    addToCart(product, 1, defaultSize, defaultColor);
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    navigate('/buy-now', { 
      state: { 
        product: {
          ...product,
          selectedSize: product.sizes?.[0] || 'M',
          selectedColor: product.colors?.[0] || 'Default'
        }
      } 
    });
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, featuredProducts.length - 2));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.max(1, featuredProducts.length - 2)) % Math.max(1, featuredProducts.length - 2));
  };

  const goToProduct = (productId) => {
    navigate(`/products/${productId}`);
  };



  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 tribal-pattern">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-serif font-light text-gray-900 mb-6 animate-fade-in">
            Elegance
            <span className="block text-4xl md:text-6xl text-gray-600 mt-2">
              Redefined
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover timeless pieces that blend traditional craftsmanship with contemporary style
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="btn-primary inline-flex items-center justify-center group"
            >
              Shop Collection
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/products?category=new"
              className="btn-secondary inline-flex items-center justify-center"
            >
              New Arrivals
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-light text-gray-900 mb-4">
              Featured Collections
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Curated pieces that embody the essence of modern femininity
            </p>
          </div>

          {/* Featured Products Carousel */}
          {featuredProducts.length > 0 && (
            <div className="relative">
              <div className="overflow-hidden rounded-lg">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
                >
                  {featuredProducts.map((product) => (
                    <div key={product._id} className="w-1/3 flex-shrink-0 px-2">
                      <div 
                        className="group cursor-pointer"
                        onClick={() => goToProduct(product._id)}
                      >
                        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[4/5] mb-4">
                          <img
                            src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=600&fit=crop'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <h3 className="text-xl font-semibold">{product.name}</h3>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-semibold">
                                ${product.discountPrice || product.salePrice || product.price}
                              </p>
                              {(product.discountPrice || product.salePrice) && (
                                <>
                                  <p className="text-xs line-through opacity-75">${product.originalPrice || product.price}</p>
                                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                                    {Math.round((((product.originalPrice || product.price) - (product.discountPrice || product.salePrice)) / (product.originalPrice || product.price)) * 100)}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Navigation */}
              {featuredProducts.length > 3 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all z-10"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all z-10"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-800" />
                  </button>
                </>
              )}
              
              {/* Carousel Indicators */}
              {featuredProducts.length > 3 && (
                <div className="flex justify-center mt-6 space-x-2">
                  {Array.from({ length: Math.max(1, featuredProducts.length - 2) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        currentSlide === index ? 'bg-gray-800' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dynamic categories */}
          {categories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.slice(0, 3).map((category) => (
                <div key={category._id} className="group cursor-pointer" onClick={() => navigate(`/products?category=${category._id}`)}>
                  <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[4/5] mb-4">
                    <img
                      src={category.image?.url || '/placeholder-product.jpg'}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-xl font-semibold">{category.name}</h3>
                      <p className="text-sm">{category.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fallback static collections if no categories */}
          {categories.length === 0 && featuredProducts.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group cursor-pointer" onClick={() => navigate('/products')}>
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[4/5] mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&h=600&fit=crop"
                    alt="Ethnic Wear"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-xl font-semibold">Ethnic Wear</h3>
                    <p className="text-sm">Traditional meets modern</p>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer" onClick={() => navigate('/products')}>
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[4/5] mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=600&fit=crop"
                    alt="Casual Chic"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-xl font-semibold">Casual Chic</h3>
                    <p className="text-sm">Everyday elegance</p>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer" onClick={() => navigate('/products')}>
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[4/5] mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1544957992-20349e4a8d0a?w=500&h=600&fit=crop"
                    alt="Formal Wear"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-xl font-semibold">Formal Wear</h3>
                    <p className="text-sm">Professional sophistication</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50 floral-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-light text-gray-900 mb-4">
              Trending Now
            </h2>
            <p className="text-lg text-gray-600">
              Discover what's popular this season
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <div key={product._id} className="group card-hover">
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <Link to={`/product/${product._id}`} className="block">
                      <div className="aspect-[3/4] bg-gray-100 image-zoom relative">
                        <img
                          src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {(product.discountPrice || product.salePrice) && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
                            Sale
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link to={`/product/${product._id}`}>
                        <h3 className="font-medium text-gray-900 mb-1 group-hover:text-gray-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {(product.discountPrice || product.salePrice) ? (
                            <>
                              <span className="text-lg font-semibold text-red-600">
                                ${product.discountPrice || product.salePrice}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                ${product.originalPrice || product.price}
                              </span>
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                {Math.round((((product.originalPrice || product.price) - (product.discountPrice || product.salePrice)) / (product.originalPrice || product.price)) * 100)}% OFF
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-semibold text-gray-900">
                              ${product.price}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {product.rating || '4.5'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={(e) => handleBuyNow(product, e)}
                          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                        >
                          <Zap className="h-4 w-4" />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="btn-primary inline-flex items-center group"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Shipping</h3>
              <p className="text-gray-600">
                Free shipping on orders over $100. Fast and reliable delivery.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-gray-600">
                Your payment information is processed securely and safely.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Returns</h3>
              <p className="text-gray-600">
                30-day return policy. Easy exchanges and hassle-free returns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection />
    </div>
  );
};

export default Home;