import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Helper function to verify auth token
const verifyToken = (request) => {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return null;
    }
    
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export async function PUT(request) {
  try {
    // Verify the auth token
    const decoded = verifyToken(request);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { score, xp } = await request.json();
    
    // Connect to the database
    await connectToDatabase();
    
    // Find user by ID from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user score and XP
    if (score !== undefined) {
      user.score = score;
    }
    
    if (xp !== undefined) {
      user.xp = xp;
      
      // Level up logic (simple example)
      const xpNeeded = user.level * 100;
      if (user.xp >= xpNeeded) {
        user.level += 1;
        user.xp -= xpNeeded;
      }
    }
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        score: user.score,
        level: user.level,
        xp: user.xp
      }
    });
    
  } catch (error) {
    console.error('Update score error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 