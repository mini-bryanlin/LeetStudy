import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Testing database connection...');
    const conn = await connectToDatabase();
    console.log('Connection successful!');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      dbName: conn.connection.name
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      },
      { status: 500 }
    );
  }
} 