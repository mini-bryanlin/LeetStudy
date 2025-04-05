"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { FaCheck, FaTimes, FaUserAlt, FaCheckCircle, FaTrophy, FaUserFriends, FaRedoAlt, FaExclamationTriangle } from 'react-icons/fa';

interface TeamMember {
  id: string;
  username: string;
  completedQuestions: number[];
  currentQuestion: number;
  score: number;
  completed?: boolean;
}

interface TeamRoomProgressProps {
  roomId: string;
  totalQuestions: number;
  roomProgress: TeamMember[];
}

// Keep a cache of progress data to prevent UI flicker when props change
const progressCache = new Map<string, TeamMember[]>(); // roomId -> progress data

export default function TeamRoomProgress({ roomId, totalQuestions, roomProgress }: TeamRoomProgressProps) {
  const [recentActivities, setRecentActivities] = useState<string[]>([]);
  const prevProgressRef = useRef<Map<string, TeamMember>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [hasError, setHasError] = useState(false);
  
  // Debug log the input props
  useEffect(() => {
    console.log(`TeamRoomProgress render with ${roomProgress?.length || 0} members for room ${roomId}`);
    
    if (roomProgress && roomProgress.length > 0) {
      setHasError(false);
    }
  }, [roomProgress, roomId]);
  
  // Cache valid progress data to prevent flickering
  useEffect(() => {
    if (roomProgress && roomProgress.length > 0) {
      console.log(`Caching ${roomProgress.length} members for room ${roomId}`);
      progressCache.set(roomId, roomProgress);
      setLastUpdate(new Date());
    }
  }, [roomProgress, roomId]);
  
  // Use cached data if available and current data is empty
  const effectiveProgress = useMemo(() => {
    if (roomProgress && roomProgress.length > 0) {
      return roomProgress;
    }
    
    // Use cached data if we have it
    if (progressCache.has(roomId)) {
      const cached = progressCache.get(roomId) || [];
      console.log(`Using cached data with ${cached.length} members for room ${roomId}`);
      return cached;
    }
    
    return [];
  }, [roomProgress, roomId]);
  
  // After 5 seconds of no data, set an error state
  useEffect(() => {
    if ((!roomProgress || roomProgress.length === 0) && (!effectiveProgress || effectiveProgress.length === 0)) {
      const timer = setTimeout(() => {
        setHasError(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [roomProgress, effectiveProgress]);
  
  // Memoize sorted members to avoid unnecessary re-renders
  const sortedMembers = useMemo(() => {
    if (!effectiveProgress || effectiveProgress.length === 0) {
      return [];
    }
    
    console.log(`Sorting ${effectiveProgress.length} members for display`);
    return [...effectiveProgress].sort((a, b) => b.score - a.score);
  }, [effectiveProgress]);
  
  // Track changes in progress to generate activity feed
  useEffect(() => {
    if (!effectiveProgress || effectiveProgress.length === 0) {
      return;
    }
    
    const newActivities: string[] = [];
    const currentProgressMap = new Map<string, TeamMember>();
    const prevProgress = prevProgressRef.current;
    
    // Create a map of the current progress data
    effectiveProgress.forEach(member => {
      currentProgressMap.set(member.id, member);
    });
    
    // Compare with previous progress to detect changes
    effectiveProgress.forEach(member => {
      const prevMember = prevProgress.get(member.id);
      
      // New user joined
      if (!prevMember) {
        newActivities.push(`${member.username} joined the room`);
      } 
      // User completed quiz
      else if (member.completed && !prevMember.completed) {
        newActivities.push(`${member.username} completed the quiz with score ${member.score}/${totalQuestions}`);
      }
      // User answered new questions
      else if (prevMember.completedQuestions && 
               member.completedQuestions?.length > prevMember.completedQuestions.length) {
        // Find the most recent completed question
        const newQuestions = member.completedQuestions.filter(
          q => !prevMember.completedQuestions.includes(q)
        );
        
        if (newQuestions.length > 0) {
          newActivities.push(`${member.username} answered question #${newQuestions[0] + 1}`);
        }
      }
    });
    
    // Check for users who left
    prevProgress.forEach((prevMember, userId) => {
      if (!currentProgressMap.has(userId)) {
        newActivities.push(`${prevMember.username} left the room`);
      }
    });
    
    // Update activity feed with new activities
    if (newActivities.length > 0) {
      setRecentActivities(prev => {
        // Only add new unique activities
        const combined = [...newActivities, ...prev];
        return [...new Set(combined)].slice(0, 5); // Keep only the 5 most recent
      });
    }
    
    // Update previous progress for next comparison
    prevProgressRef.current = currentProgressMap;
    
  }, [effectiveProgress, totalQuestions]);

  // Show time since last update
  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else {
      return `${Math.floor(seconds / 3600)}h ago`;
    }
  };

  // Function to manually trigger data refresh
  const handleRefresh = () => {
    setLastUpdate(new Date());
    setHasError(false);
    
    // Use location reload for simplicity
    window.location.reload();
  };

  // If no data yet, show loading
  if ((!effectiveProgress || effectiveProgress.length === 0) && !hasError) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <FaUserFriends className="mr-2 text-green-600" />
          Team Members
        </h3>
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-sm text-gray-500">Looking for team members...</p>
        </div>
      </div>
    );
  }
  
  // If we have an error, show error state
  if (hasError) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <FaUserFriends className="mr-2 text-green-600" />
          Team Members
        </h3>
        <div className="text-center py-4">
          <FaExclamationTriangle className="mx-auto text-2xl text-yellow-500 mb-2" />
          <p className="text-sm text-gray-500 mb-4">Unable to load team data.</p>
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            <FaRedoAlt className="mr-1" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold flex items-center">
          <FaUserFriends className="mr-2 text-green-600" />
          Team Members ({sortedMembers.length})
        </h3>
        <div className="text-xs text-gray-500 flex items-center">
          <span>Updated {getTimeSinceUpdate()}</span>
          <button 
            onClick={handleRefresh} 
            className="ml-2 p-1 text-gray-500 hover:text-green-600"
            title="Refresh data"
          >
            <FaRedoAlt />
          </button>
        </div>
      </div>
      
      {sortedMembers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaUserFriends className="mx-auto text-4xl mb-2 text-gray-300" />
          <p>No other team members yet</p>
          <p className="text-sm mt-2">Share the room ID with friends to study together!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedMembers.map((member, index) => (
            <div key={`${member.id}-${index}`} className="border-b pb-3 last:border-b-0">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  {index === 0 && sortedMembers.length > 1 && member.score > 0 && (
                    <span className="mr-2 text-yellow-500">
                      <FaTrophy />
                    </span>
                  )}
                  <span className="font-medium">{member.username}</span>
                  {member.completed && (
                    <span className="ml-2 text-green-600 flex items-center text-sm">
                      <FaCheckCircle className="mr-1" /> Completed
                    </span>
                  )}
                </div>
                <div className="text-sm bg-gray-100 px-2 py-1 rounded">
                  Score: {member.score}/{totalQuestions}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: totalQuestions }).map((_, i) => {
                  const isCompleted = member.completedQuestions?.includes?.(i) || false;
                  return (
                    <div 
                      key={i}
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-xs
                        ${isCompleted 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                      title={`Question ${i+1}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
              
              {!member.completed && member.currentQuestion > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Currently on question #{member.currentQuestion + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Live activity feed */}
      {recentActivities.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Live Activity
          </h4>
          <ul className="text-sm space-y-1 text-gray-700">
            {recentActivities.map((activity, index) => (
              <li key={index} className="py-1 px-2 hover:bg-gray-50 rounded transition-colors">
                {activity}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 