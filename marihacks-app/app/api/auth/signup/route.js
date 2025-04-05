import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();
    
    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with that email or username' },
        { status: 400 }
      );
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      score: 0,
      xp: 0,
      level: 1,
      achievements: []
    });
    
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return success with token and user info (excluding password)
    const userObj = user.toObject();
    delete userObj.password;
    
    return NextResponse.json({
      success: true,
      token,
      user: userObj
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 