import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';

// PUT method to update user progress in a room
export async function PUT(request, context) {
  try {
    // Get roomId from URL params
    const params = await context.params;
    const roomId = params.roomId;
    
    if (!roomId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Room ID is required' 
      }, { status: 400 });
    }
    
    // Parse request body
    const data = await request.json();
    const { userId, username, questionIndex, isCorrect, completed, score } = data;
    
    if (!userId || !username) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and username are required' 
      }, { status: 400 });
    }
    
    // Connect to database
    const { mongoose, models } = await connectToDatabase();
    const { Room } = models;
    
    // Find the room
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return NextResponse.json({ 
        success: false, 
        error: 'Room not found' 
      }, { status: 404 });
    }
    
    // Check if user already exists in the room
    let userEntry = room.users?.find(u => u.userId === userId);
    
    // If user doesn't exist, create a new entry
    if (!userEntry) {
      if (!room.users) {
        room.users = [];
      }
      
      userEntry = {
        userId,
        username,
        joinedAt: new Date(),
        completedQuestions: [],
        score: 0,
        completed: false
      };
      
      room.users.push(userEntry);
    } else {
      // Update existing user
      userEntry.username = username; // Update username in case it changed
    }
    
    // If questionIndex is provided, update completed questions
    if (questionIndex !== undefined) {
      if (!userEntry.completedQuestions.includes(questionIndex)) {
        userEntry.completedQuestions.push(questionIndex);
      }
      
      if (isCorrect) {
        userEntry.score += 1;
      }
    }
    
    // If user completed the quiz, update completion status
    if (completed !== undefined) {
      userEntry.completed = completed;
    }
    
    // If score is provided, update score
    if (score !== undefined) {
      userEntry.score = score;
    }
    
    // Save changes to database
    await room.save();
    
    // Return updated user data
    return NextResponse.json({
      success: true,
      user: userEntry
    });
    
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to update progress' 
    }, { status: 500 });
  }
} 