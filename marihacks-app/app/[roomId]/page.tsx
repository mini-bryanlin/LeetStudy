// This file is a Server Component
import ClientRoom from "./ClientRoom";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { use } from "react";

// Define params type
interface PageParams {
  params: Promise<{ roomId: string }>;
}

// In Next.js 14, params must be awaited
export default function RoomPage({ params }: PageParams) {
  // Safely await/unwrap the params
  const unwrappedParams = use(params);
  const roomId = unwrappedParams?.roomId;
  
  console.log('Server component unwrapped params:', unwrappedParams);
  
  // Critical error check - we must have a roomId
  if (!roomId) {
    console.error('CRITICAL ERROR: roomId is undefined in server component');
    notFound(); // This will show a 404 page
    return null;
  }
  
  console.log('Using roomId for rendering:', roomId);
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-gray-600">Loading your quest...</p>
        </div>
      </div>
    }>
      <ClientRoom params={{ roomId }} />
    </Suspense>
  );
} 