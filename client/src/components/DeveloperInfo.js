import React from 'react';
import { X, Mail, Code, Palette, User, Phone } from 'lucide-react';

const DeveloperInfo = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Developer Information</h2>
          <p className="text-gray-600">Full-Stack Developer & UI/UX Designer</p>
        </div>

        {/* Developer Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">Md Sharior Hossain Farhan</p>
              <p className="text-sm text-gray-600">Full-Stack Developer</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <a 
                href="mailto:shariorfarhan07@gmail.com" 
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                shariorfarhan07@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-semibold text-gray-900">Phone</p>
              <a 
                href="tel:+8801749555777" 
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                +880 1749 555 777
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Code className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-semibold text-gray-900">Development</p>
              <p className="text-sm text-gray-600">React, Node.js, MongoDB, Express</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Palette className="h-5 w-5 text-pink-600" />
            <div>
              <p className="font-semibold text-gray-900">Design</p>
              <p className="text-sm text-gray-600">UI/UX, Tailwind CSS, Responsive Design</p>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Zartaaz eCommerce Platform</h3>
          <p className="text-sm text-gray-600 mb-2">
            A complete eCommerce solution with admin panel, user management, 
            product catalog, order processing, and more.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">React</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Node.js</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">MongoDB</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Express</span>
            <span className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full">Tailwind CSS</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Developed and Designed by <span className="font-semibold">Md Sharior Hossain Farhan</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            © 2024 All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeveloperInfo;
