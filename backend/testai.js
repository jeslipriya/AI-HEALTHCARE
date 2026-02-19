require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const groqService = require('./src/services/GroqAIService');

async function testChatRoute() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user (replace with an actual user ID from your DB)
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No user found in database');
      return;
    }
    
    console.log('✅ Found user:', user.email);

    // Test the chat service directly
    console.log('\nTesting GroqService.chat() directly...');
    const response = await groqService.chat(
      "Say hello",
      [],
      user.profile
    );
    
    console.log('✅ Chat service response:', response);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testChatRoute();