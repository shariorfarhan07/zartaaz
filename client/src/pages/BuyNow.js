import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const BuyNow = () => {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get product data from navigation state or query parameter
  const { product: stateProduct, quantity: stateQuantity = 1, selectedSize: stateSelectedSize, selectedColor: stateSelectedColor } = location.state || {};

  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'United States'
  });

  useEffect(() => {
    const initializeProduct = async () => {
      // Check if product is provided via navigation state
      if (stateProduct) {
        setProduct(stateProduct);
        setQuantity(stateQuantity);
        setSelectedSize(stateSelectedSize || stateProduct.sizes?.[0] || 'M');
        setSelectedColor(stateSelectedColor || stateProduct.colors?.[0] || 'Default');
        return;
      }

      // Check if product ID is provided via query parameter
      const urlParams = new URLSearchParams(location.search);
      const productId = urlParams.get('product');
      
      if (productId) {
        try {
          const response = await axios.get(`/api/products/${productId}`);
          const productData = response.data.product;
          setProduct(productData);
          setQuantity(1);
          setSelectedSize(productData.sizes?.[0] || 'M');
          setSelectedColor(productData.colors?.[0] || 'Default');
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error('Product not found');
          navigate('/products');
        }
      } else {
        toast.error('No product selected for purchase');
        navigate('/products');
      }
    };

    initializeProduct();
  }, [stateProduct, stateQuantity, stateSelectedSize, stateSelectedColor, location.search, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, newQuantity));
  };

  const handleSizeChange = (e) => {
    setSelectedSize(e.target.value);
  };

  const handleColorChange = (e) => {
    setSelectedColor(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate required fields
      const requiredFields = ['email', 'firstName', 'lastName', 'phone', 'street', 'city', 'state', 'zipCode'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      const subtotal = (product.discountPrice || product.salePrice || product.price) * quantity;
      const shipping = subtotal >= (product.freeShippingThreshold || 100) ? 0 : (product.shippingCharge || 10);
      const tax = subtotal * 0.08;
      const total = subtotal + shipping + tax;

      // Prepare order data for single item
      const orderData = {
        items: [{
          product: product._id,
          name: product.name,
          image: product.images?.[0]?.url || '/placeholder-product.jpg',
          price: product.discountPrice || product.salePrice || product.price,
          quantity: quantity,
          size: selectedSize || 'One Size',
          color: selectedColor || 'Default',
          sku: `${product._id}-${selectedSize || 'OS'}-${selectedColor || 'DEF'}`
        }],
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        paymentMethod: 'stripe',
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        total: total,
        isPaid: true, // For demo purposes
        status: 'pending',
        isBuyNow: true // Flag to indicate this is a direct purchase
      };

      // If user is not authenticated, add guest email
      if (!isAuthenticated) {
        orderData.guestEmail = formData.email;
      }

      console.log('🛒 Creating Buy Now order:', orderData);
      console.log('🔐 Authentication status:', isAuthenticated);
      console.log('👤 Current user:', user);
      console.log('🎫 Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Not found');
      console.log('📡 Axios auth header:', axios.defaults.headers.common['Authorization'] ? 'Set' : 'Not set');

      const response = await axios.post('/api/orders', orderData);
      console.log('📦 Order response:', response.data);

      if (response.data.success) {
        toast.success(`Order placed successfully! Order #${response.data.order.orderNumber}`);
        
        // Redirect to order confirmation or order history
        if (isAuthenticated) {
          navigate('/orders');
        } else {
          toast.info('Order placed as guest. Sign in to track your order.');
          navigate('/');
        }
      } else {
        toast.error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Buy Now order error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 404) {
        toast.error('Order service not available. Please try again later.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(`Network error: ${error.message}`);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) {
    return null; // Will redirect in useEffect
  }

  const subtotal = (product.discountPrice || product.salePrice || product.price) * quantity;
  const shipping = subtotal >= (product.freeShippingThreshold || 100) ? 0 : (product.shippingCharge || 10);
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-serif font-light text-gray-900 mb-8">Buy Now - Express Checkout</h1>

        {/* Product Selection */}
        {product && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Details</h2>
            <div className="flex items-start space-x-4">
              <img
                src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Quantity Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>

                  {/* Size Selection */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <select
                        value={selectedSize}
                        onChange={handleSizeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        {product.sizes.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Color Selection */}
                  {product.colors && product.colors.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <select
                        value={selectedColor}
                        onChange={handleColorChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        {product.colors.map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Price: <span className="font-medium text-gray-900">
                      ${product.discountPrice || product.salePrice || product.price}
                    </span>
                    {(product.discountPrice || product.salePrice) && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        {Math.round((((product.originalPrice || product.price) - (product.discountPrice || product.salePrice)) / (product.originalPrice || product.price)) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    Total: ${((product.discountPrice || product.salePrice || product.price) * quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 sm:col-span-2"
                  />
                  <input
                    type="text"
                    name="street"
                    placeholder="Street Address"
                    value={formData.street}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 sm:col-span-2"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZIP Code"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary"
              >
                {isLoading ? 'Processing...' : `Complete Purchase - $${total.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-4">
                <img
                  src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedSize && `${selectedSize} • `}
                    {selectedColor && `${selectedColor} • `}
                    Qty: {quantity}
                  </p>
                </div>
                <span className="font-medium text-gray-900">
                  ${((product.discountPrice || product.salePrice || product.price) * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Express Checkout:</strong> Skip the cart and complete your purchase instantly!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyNow;