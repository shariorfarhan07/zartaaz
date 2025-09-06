import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminGuard from '../../components/Admin/AdminGuard';
import {
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  ArrowLeft,
  Image as ImageIcon,
  Eye,
  Star,
  Move
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    onSale: false,
    category: '',
    subcategory: '',
    brand: '',
    tags: '',
    featured: false,
    shippingCharge: 10,
    freeShippingThreshold: 100,
    shippingMethod: 'standard',
    estimatedDeliveryDays: 3,
    variants: [
      {
        size: '',
        color: '',
        stock: '',
        sku: '',
        price: ''
      }
    ],
    images: []
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Gray', 'Brown'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateDiscountPercentage = () => {
    const price = parseFloat(formData.price);
    const discountPrice = parseFloat(formData.discountPrice);
    
    if (price && discountPrice && discountPrice < price) {
      return Math.round(((price - discountPrice) / price) * 100);
    }
    return 0;
  };

  const getEffectivePrice = () => {
    const price = parseFloat(formData.price);
    const discountPrice = parseFloat(formData.discountPrice);
    
    if (formData.onSale && discountPrice && discountPrice < price) {
      return discountPrice;
    }
    return price;
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData(prev => ({
      ...prev,
      variants: updatedVariants
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          size: '',
          color: '',
          stock: '',
          sku: '',
          price: ''
        }
      ]
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length > 1) {
      const updatedVariants = formData.variants.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        variants: updatedVariants
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // For now, we'll just store the file names
    // In a real app, you'd upload to a cloud service
    const imageUrls = files.map(file => ({
      url: URL.createObjectURL(file),
      alt: file.name
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }));
  };

  const removeImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
    
    // Adjust primary image index if needed
    if (index === primaryImageIndex) {
      setPrimaryImageIndex(0);
    } else if (index < primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  const setPrimaryImage = (index) => {
    setPrimaryImageIndex(index);
    toast.success('Primary image updated');
  };

  const moveImage = (fromIndex, toIndex) => {
    const updatedImages = [...formData.images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
    
    // Update primary image index if needed
    if (fromIndex === primaryImageIndex) {
      setPrimaryImageIndex(toIndex);
    } else if (fromIndex < primaryImageIndex && toIndex >= primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    } else if (fromIndex > primaryImageIndex && toIndex <= primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex + 1);
    }
  };

  const openImagePreview = (image) => {
    setPreviewImage(image);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.variants.length === 0) {
        toast.error('Please add at least one product variant');
        return;
      }

      // Validate discount price
      if (formData.discountPrice && parseFloat(formData.discountPrice) >= parseFloat(formData.price)) {
        toast.error('Discount price must be less than regular price');
        return;
      }

      // Prepare data for submission
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        variants: formData.variants.map(variant => ({
          ...variant,
          stock: parseInt(variant.stock) || 0,
          price: parseFloat(variant.price) || parseFloat(formData.price)
        }))
      };

      const response = await axios.post('/api/products', productData);

      if (response.data.success) {
        toast.success('Product created successfully!');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/products')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
                <p className="text-gray-600 mt-1">Create a new product for your store</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Product Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Regular Price *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Price
                      </label>
                      <input
                        type="number"
                        name="discountPrice"
                        value={formData.discountPrice}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        max={formData.price}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder="Optional sale price"
                      />
                      {formData.price && formData.discountPrice && calculateDiscountPercentage() > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          {calculateDiscountPercentage()}% discount
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand
                      </label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategory
                      </label>
                      <input
                        type="text"
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="e.g. summer, casual, cotton"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  {/* Shipping Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shipping Charge ($)
                        </label>
                        <input
                          type="number"
                          name="shippingCharge"
                          value={formData.shippingCharge}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Free Shipping Threshold ($)
                        </label>
                        <input
                          type="number"
                          name="freeShippingThreshold"
                          value={formData.freeShippingThreshold}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shipping Method
                        </label>
                        <select
                          name="shippingMethod"
                          value={formData.shippingMethod}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          <option value="standard">Standard</option>
                          <option value="express">Express</option>
                          <option value="overnight">Overnight</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Delivery (Days)
                        </label>
                        <input
                          type="number"
                          name="estimatedDeliveryDays"
                          value={formData.estimatedDeliveryDays}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          required
                        />
                      </div>
                    </div>
                  </div>

                    <div className="md:col-span-2 space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="featured"
                          checked={formData.featured}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="onSale"
                          checked={formData.onSale}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="ml-2 text-sm text-gray-700">On Sale</span>
                      </label>
                      
                      {formData.onSale && getEffectivePrice() && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            <span className="font-medium">Effective Price: ${getEffectivePrice().toFixed(2)}</span>
                            {calculateDiscountPercentage() > 0 && (
                              <span className="ml-2 text-green-600">
                                ({calculateDiscountPercentage()}% off)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Variants */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Variant
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Variant {index + 1}</h4>
                          {formData.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Size
                            </label>
                            <select
                              value={variant.size}
                              onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                            >
                              <option value="">Select Size</option>
                              {sizes.map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Color
                            </label>
                            <select
                              value={variant.color}
                              onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                            >
                              <option value="">Select Color</option>
                              {colors.map(color => (
                                <option key={color} value={color}>{color}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Stock
                            </label>
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SKU
                            </label>
                            <input
                              type="text"
                              value={variant.sku}
                              onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price Override
                            </label>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                              step="0.01"
                              min="0"
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Product Images */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
                    <div className="text-sm text-gray-500">
                      {formData.images.length} image{formData.images.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {/* Upload Area */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Add Images
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                      </label>
                    </div>
                  </div>

                  {/* Image Gallery */}
                  {formData.images.length > 0 && (
                    <div className="space-y-4">
                      {/* Primary Image Display */}
                      {formData.images[primaryImageIndex] && (
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              Primary Image
                            </span>
                            <button
                              type="button"
                              onClick={() => openImagePreview(formData.images[primaryImageIndex])}
                              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </button>
                          </div>
                          <div className="relative group">
                            <img
                              src={formData.images[primaryImageIndex].url}
                              alt={formData.images[primaryImageIndex].alt}
                              className="w-full h-48 object-cover rounded-lg border-2 border-yellow-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => openImagePreview(formData.images[primaryImageIndex])}
                                className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                              >
                                <Eye className="h-5 w-5 text-gray-700" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Thumbnail Grid */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">All Images</span>
                          <span className="text-xs text-gray-500">Drag to reorder</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {formData.images.map((image, index) => (
                            <div
                              key={index}
                              className={`relative group cursor-move ${
                                index === primaryImageIndex ? 'ring-2 ring-yellow-400' : ''
                              }`}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                moveImage(fromIndex, index);
                              }}
                            >
                              <img
                                src={image.url}
                                alt={image.alt}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              
                              {/* Overlay Actions */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                                  {index !== primaryImageIndex && (
                                    <button
                                      type="button"
                                      onClick={() => setPrimaryImage(index)}
                                      className="p-1 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
                                      title="Set as primary"
                                    >
                                      <Star className="h-3 w-3" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openImagePreview(image)}
                                    className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                    title="Preview"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    title="Remove"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Primary Badge */}
                              {index === primaryImageIndex && (
                                <div className="absolute top-1 left-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded text-xs font-medium flex items-center">
                                  <Star className="h-3 w-3 mr-1" />
                                  Primary
                                </div>
                              )}

                              {/* Drag Handle */}
                              <div className="absolute top-1 right-1 bg-gray-800 bg-opacity-70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <Move className="h-3 w-3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Preview Modal */}
                  {previewImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                      <div className="relative max-w-4xl max-h-full">
                        <button
                          type="button"
                          onClick={closeImagePreview}
                          className="absolute -top-10 right-0 text-white hover:text-gray-300"
                        >
                          <X className="h-6 w-6" />
                        </button>
                        <img
                          src={previewImage.url}
                          alt={previewImage.alt}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {loading ? 'Creating...' : 'Create Product'}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/admin/products')}
                      className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AddProduct;