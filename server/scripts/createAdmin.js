#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zartaaz');
    console.log('📦 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@zartaaz.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@zartaaz.com');
      console.log('🔑 Password: admin123');
      console.log('👤 Role:', existingAdmin.role);
      console.log('🟢 Active:', existingAdmin.isActive);
    } else {
      // Create new admin user
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@zartaaz.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });

      console.log('🎉 Admin user created successfully!');
      console.log('📧 Email: admin@zartaaz.com');
      console.log('🔑 Password: admin123');
      console.log('👤 Role:', admin.role);
    }

    // List all admin users
    const allAdmins = await User.find({ role: 'admin' }).select('name email role isActive createdAt');
    console.log('\n👥 All Admin Users:');
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.isActive ? 'Active' : 'Inactive'}`);
    });

    console.log('\n🌐 Access Admin Panel:');
    console.log('1. Go to: http://localhost:3000/login');
    console.log('2. Login with: admin@zartaaz.com / admin123');
    console.log('3. Navigate to: http://localhost:3000/admin');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  // List all users
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zartaaz')
    .then(async () => {
      const users = await User.find().select('name email role isActive createdAt');
      console.log('\n👥 All Users:');
      users.forEach((user, index) => {
        const roleIcon = user.role === 'admin' ? '👑' : '👤';
        const statusIcon = user.isActive ? '🟢' : '🔴';
        console.log(`${index + 1}. ${roleIcon} ${user.name} (${user.email}) - ${user.role} ${statusIcon}`);
      });
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
} else {
  createAdmin();
}