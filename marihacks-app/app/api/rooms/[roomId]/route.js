import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';

// Define the route with explicit params
export async function GET(
  request,
  context
) {
  console.log('GET request to /api/rooms/[roomId]', context.params);
  
  try {
    // Properly await the params object
    const params = await context.params;
    const roomId = params.roomId;
    
    if (!roomId) {
      console.error('No roomId provided in API request');
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }
    
    console.log('Fetching room with ID:', roomId);
    
    // Connect to MongoDB
    const { mongoose, models } = await connectToDatabase();
    const { Room } = models;
    
    // Find the room by roomId field, not _id
    const room = await Room.findOne({ roomId: roomId });
    
    if (!room) {
      console.error('Room not found with ID:', roomId);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    console.log('Successfully found room:', room.roomName);
    
    // Return the room data
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error fetching room:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 