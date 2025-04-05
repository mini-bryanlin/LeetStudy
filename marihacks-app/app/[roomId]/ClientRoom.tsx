"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useSocketRoom } from "@/lib/socketClient";
import Link from "next/link";
import { FaStar, FaTrophy, FaArrowRight, FaArrowLeft, FaBug, FaCheck, FaTimes, FaUserFriends, FaCrown } from "react-icons/fa";
import TeamRoomProgress from "@/components/TeamRoomProgress";
import { Socket } from "socket.io-client";

// Define proper interfaces for your data types
interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  type?: "multiple_choice" | "text";
  textAnswer?: string;
  subject?: string; // Added for displaying subject
}

interface Room {
  roomId: string;
  roomName: string;
  questions: Question[];
  isPrivate: boolean;
  subject: string;
  difficulty: string;
  createdBy: string;
  createdAt: Date;
  users?: any[];
}

// Add proper interface for a room user
interface RoomUser {
  id: string;
  username: string;
  joinTime?: number;
  isOwner?: boolean;
}

export default function ClientRoom({ params }: { params: { roomId: string } }) {
  // Make sure we get the roomId correctly from params
  const roomId = params?.roomId;
  
  console.log('ClientRoom initialized with params type:', typeof params);
  console.log('ClientRoom params:', params);
  console.log('ClientRoom using roomId:', roomId);
  
  // Validate roomId
  if (!roomId) {
    console.error('CRITICAL ERROR: No roomId provided to ClientRoom component');
  }
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [textAnswers, setTextAnswers] = useState<{ [key: string]: string }>({});
  const [myTextAnswer, setMyTextAnswer] = useState<string>("");
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState<boolean>(false);
  const [allAnswersSubmitted, setAllAnswersSubmitted] = useState<boolean>(false);
  const [answerScores, setAnswerScores] = useState<{ [key: string]: number }>({});
  const [score, setScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showTeamProgress, setShowTeamProgress] = useState(true);
  
  const router = useRouter();
  const { user, loading: authLoading, updateUserScore } = useAuth();
  
  // Update the component state initialization
  const [socket, setSocket] = useState<any>(null);
  const [localRoomUsers, setLocalRoomUsers] = useState<RoomUser[]>([]);
  
  // Update the useSocketRoom hook call
  const { 
    roomUsers: socketRoomUsers, 
    roomProgress, 
    textAnswers: roomTextAnswers, 
    roomOwner,
    isOwner,
    sendAnswerEvent, 
    sendQuizCompletedEvent,
    submitTextAnswer,
    skipQuestion,
    socket: socketInstance
  } = useSocketRoom(
    roomId,
    user ? {
      id: user.id,
      username: user.username,
      avatar: user.avatar
    } : null
  );
  
  // Update socket reference and room users when they're available
  useEffect(() => {
    if (socketInstance) {
      setSocket(socketInstance);
    }
    
    if (socketRoomUsers && Array.isArray(socketRoomUsers) && socketRoomUsers.length > 0) {
      setLocalRoomUsers(socketRoomUsers as RoomUser[]);
    }
  }, [socketInstance, socketRoomUsers]);
  
  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!roomId) {
          throw new Error('Cannot fetch room: Room ID is missing');
        }
        
        console.log('Fetching room data for roomId:', roomId);
        const apiUrl = `/api/rooms/${roomId}`;
        console.log('API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response from API:', response.status, errorText);
          throw new Error(`Failed to fetch room data: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        if (!data.room) {
          console.error('No room data in response');
          throw new Error('Invalid response format: Missing room data');
        }
        
        setRoom(data.room);
        console.log('Room data loaded successfully with', data.room.questions?.length || 0, 'questions');
        console.log('First question:', data.room.questions?.[0]);
      } catch (error: any) {
        console.error('Error in fetchRoom:', error);
        setError(error.message || 'Failed to load room data');
      } finally {
        setLoading(false);
      }
    };
    
    // Check auth first
    if (user) {
      fetchRoom();
    } else {
      // Only redirect if user is definitely not authenticated (not just loading)
      if (!authLoading) {
        console.log('User not authenticated, redirecting to login');
        router.push('/login');
      }
    }
  }, [roomId, user, authLoading, router]);
  
  // Update local state when room text answers change
  useEffect(() => {
    if (roomTextAnswers && Object.keys(roomTextAnswers).length > 0) {
      setTextAnswers(roomTextAnswers);
      
      // Check if current user has submitted an answer
      if (user?.id && roomTextAnswers && typeof roomTextAnswers === 'object' && user.id in roomTextAnswers) {
        setHasSubmittedAnswer(true);
      }
      
      // Check if all users have submitted answers
      const answeredUsers = Object.keys(roomTextAnswers).length;
      const totalUsers = localRoomUsers?.length || 0;
      
      if (answeredUsers >= totalUsers && totalUsers > 0) {
        setAllAnswersSubmitted(true);
      }
    }
  }, [roomTextAnswers, user?.id, localRoomUsers]);

  // Handle socket events for all answers submitted
  useEffect(() => {
    if (!socket) return;
    
    const handleAllAnswersSubmitted = (data: any) => {
      if (data.questionIndex === currentQuestion) {
        setAllAnswersSubmitted(true);
        
        // Calculate scores based on text answers if in text mode
        if (room?.questions[currentQuestion]?.type === "text") {
          const scores: {[key: string]: number} = {};
          const correctAnswer = room.questions[currentQuestion].textAnswer?.toLowerCase().trim();
          
          Object.entries(data.answers).forEach(([userId, answer]) => {
            const userAnswer = String(answer).toLowerCase().trim();
            scores[userId] = userAnswer === correctAnswer ? 1 : 0;
          });
          
          setAnswerScores(scores);
        }
      }
    };
    
    const handleQuestionSkipped = (data: any) => {
      if (data.questionIndex === currentQuestion) {
        setAllAnswersSubmitted(true);
        setAnswerScores({});
      }
    };
    
    socket.on('all_answers_submitted', handleAllAnswersSubmitted);
    socket.on('question_skipped', handleQuestionSkipped);
    
    return () => {
      socket.off('all_answers_submitted', handleAllAnswersSubmitted);
      socket.off('question_skipped', handleQuestionSkipped);
    };
  }, [socket, currentQuestion, room]);

  // Handle text answer submission
  const handleSubmitTextAnswer = () => {
    if (!myTextAnswer || hasSubmittedAnswer) return;
    
    submitTextAnswer(myTextAnswer, currentQuestion);
    setHasSubmittedAnswer(true);
  };

  // Handle skipping the current question (owner only)
  const handleSkipQuestion = () => {
    if (!isOwner) return;
    skipQuestion();
  };

  // Reset state when moving to the next question
  const goToNextQuestion = () => {
    if (room && currentQuestion < room.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setMyTextAnswer("");
      setHasSubmittedAnswer(false);
      setAllAnswersSubmitted(false);
      setAnswerScores({});
    }
  };
  
  // Handle selecting an answer
  const handleSelectAnswer = (answerIndex: number) => {
    if (quizSubmitted) return;
    
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
    
    // Emit answer event to socket
    const isCorrect = room?.questions[currentQuestion].correctAnswer === answerIndex;
    sendAnswerEvent(currentQuestion, isCorrect);
  };
  
  // Navigate to the previous question
  const goToPrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  // Submit the quiz
  const handleSubmitQuiz = async () => {
    if (!room) return;
    
    let newScore = 0;
    
    // Calculate score
    for (let i = 0; i < room.questions.length; i++) {
      if (selectedAnswers[i] === room.questions[i].correctAnswer) {
        newScore++;
      }
    }
    
    setScore(newScore);
    setQuizSubmitted(true);
    
    // Emit quiz completed event
    sendQuizCompletedEvent(newScore, room.questions.length);
    
    // Update user score in database
    try {
      const scoreXp = newScore * 20; // 20 XP per correct answer
      await updateUserScore(user.score + newScore, user.xp + scoreXp);
    } catch (error) {
      console.error("Failed to update score:", error);
    }
  };
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-gray-600">Loading your quest...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto">
        <div className="bg-red-100 p-4 rounded-lg mb-6 text-red-700">
          <p>{error}</p>
        </div>
        <Link 
          href="/play" 
          className="text-green-600 hover:text-green-800 font-medium transition-colors flex items-center justify-center"
        >
          ← Return to Play Page
        </Link>
      </div>
    );
  }
  
  if (!room) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto">
        <div className="bg-yellow-100 p-4 rounded-lg mb-6">
          <p className="text-yellow-800">Room not found</p>
        </div>
        <Link 
          href="/play" 
          className="text-green-600 hover:text-green-800 font-medium transition-colors flex items-center justify-center"
        >
          ← Return to Play Page
        </Link>
      </div>
    );
  }
  
  // Check if questions array exists and is valid
  const hasValidQuestions = Array.isArray(room.questions) && room.questions.length > 0;
  
  if (!hasValidQuestions) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto">
        <div className="bg-yellow-100 p-4 rounded-lg mb-6">
          <p className="text-yellow-800">This room has no questions. Please try creating a new room.</p>
        </div>
        <div className="mt-4">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaBug className="mr-1" /> {showDebug ? 'Hide' : 'Show'} Debug Info
          </button>
          
          {showDebug && (
            <div className="mt-4 bg-gray-100 p-4 rounded-lg border border-gray-300 text-xs font-mono overflow-auto max-h-96">
              <p className="font-bold mb-2">Room Data:</p>
              <pre>{JSON.stringify(room, null, 2)}</pre>
            </div>
          )}
        </div>
        <Link 
          href="/play" 
          className="text-green-600 hover:text-green-800 font-medium transition-colors flex items-center justify-center mt-4"
        >
          ← Return to Play Page
        </Link>
      </div>
    );
  }
  
  const currentQuestionData = room.questions[currentQuestion];
  
  // Extra validation for the current question
  if (!currentQuestionData || !Array.isArray(currentQuestionData.options) || currentQuestionData.options.length === 0) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto">
        <div className="bg-red-100 p-4 rounded-lg mb-6">
          <p className="text-red-800">There was a problem with the question format. Please try a different room.</p>
        </div>
        <div className="mt-4">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaBug className="mr-1" /> {showDebug ? 'Hide' : 'Show'} Debug Info
          </button>
          
          {showDebug && (
            <div className="mt-4 bg-gray-100 p-4 rounded-lg border border-gray-300 text-xs font-mono overflow-auto max-h-96">
              <p className="font-bold mb-2">Current Question:</p>
              <pre>{JSON.stringify(currentQuestionData, null, 2)}</pre>
              <p className="font-bold mt-2 mb-2">Room Data:</p>
              <pre>{JSON.stringify(room, null, 2)}</pre>
            </div>
          )}
        </div>
        <Link 
          href="/play" 
          className="text-green-600 hover:text-green-800 font-medium transition-colors flex items-center justify-center mt-4"
        >
          ← Return to Play Page
        </Link>
      </div>
    );
  }
  
  // Check if current question is a text question
  let isTextQuestion = false;
  if (room && room.questions && room.questions[currentQuestion]) {
    isTextQuestion = room.questions[currentQuestion].type === "text";
  }
  
  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Team progress (left column on desktop) */}
        <div className="md:col-span-1 order-2 md:order-1">
          {showTeamProgress && (
            <div className="sticky top-4">
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FaUserFriends className="mr-2 text-green-600" />
                  Team Members ({localRoomUsers?.length || 0})
                </h3>
                <div className="space-y-2">
                  {localRoomUsers?.map((member) => (
                    <div key={member.id} className={`flex items-center justify-between p-2 rounded ${
                      textAnswers && member.id in textAnswers ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      <div className="flex items-center">
                        {member.id === roomOwner && (
                          <FaCrown className="text-yellow-500 mr-2" title="Room Owner" />
                        )}
                        <span className="text-md font-medium">{member.username}</span>
                      </div>
                      {allAnswersSubmitted && answerScores[member.id] !== undefined && (
                        <span className={`text-sm px-2 py-1 rounded ${
                          answerScores[member.id] > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          +{answerScores[member.id]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowTeamProgress(false)}
                className="text-gray-500 text-sm hover:text-gray-700 w-full text-center mt-2"
              >
                Hide Team View
              </button>
            </div>
          )}
          
          {!showTeamProgress && (
            <button
              onClick={() => setShowTeamProgress(true)}
              className="bg-green-100 text-green-700 py-2 px-4 rounded-lg w-full"
            >
              Show Team Progress
            </button>
          )}
        </div>
      
        {/* Main quiz content (right column) */}
        <div className="md:col-span-2 order-1 md:order-2">
          <div className="relative mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {room.roomName}
              </h1>
              <div className="bg-gray-100 px-3 py-1 rounded text-sm">
                {room.subject} • {room.difficulty}
              </div>
            </div>
            
            <div className="mt-2 flex items-center text-gray-600 text-sm">
              <span>Question {currentQuestion + 1} of {room.questions.length}</span>
              <div className="ml-auto flex items-center">
                <span className="mr-2">{selectedAnswers.filter((_, i) => i !== currentQuestion).length} answered</span>
                <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(selectedAnswers.filter(a => a !== undefined).length / room.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Question card */}
          {!quizSubmitted ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              {/* Subject and Question */}
              <div className="px-6 py-5 border-b border-gray-100">
                {currentQuestionData.subject && (
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    {currentQuestionData.subject}
                  </div>
                )}
                <h2 className="text-xl font-medium text-gray-800">
                  {currentQuestionData.question}
                </h2>
              </div>
              
              {/* Answer options */}
              <div className="px-6 py-4">
                {!isTextQuestion ? (
                  // Multiple choice question
                  <div className="space-y-3">
                    {currentQuestionData.options.map((option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleSelectAnswer(index)}
                        className={`w-full text-left py-3 px-4 rounded-lg transition border ${
                          selectedAnswers[currentQuestion] === index
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                            selectedAnswers[currentQuestion] === index
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  // Text answer question
                  <div>
                    {allAnswersSubmitted ? (
                      // Display everyone's answers
                      <div className="mt-2 space-y-4">
                        <h3 className="text-md font-medium mb-2">Everyone's Answers:</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          {localRoomUsers?.map(member => (
                            <div key={member.id} className="py-2 border-b last:border-b-0">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  {member.id === roomOwner && (
                                    <FaCrown className="text-yellow-500 mr-2" />
                                  )}
                                  <span className="font-medium">{member.username}</span>
                                </div>
                                <div className={`text-sm px-2 py-1 rounded ${
                                  answerScores[member.id] > 0 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  +{answerScores[member.id] || 0}
                                </div>
                              </div>
                              <div className="mt-1 pl-5">
                                <span className="text-gray-700">{textAnswers && member.id in textAnswers ? textAnswers[member.id] : "No answer provided"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Show text input for answering
                      <div className="space-y-4">
                        <div className="mb-2 text-sm text-gray-600">
                          Enter your answer below:
                        </div>
                        <textarea
                          value={myTextAnswer}
                          onChange={(e) => setMyTextAnswer(e.target.value)}
                          disabled={hasSubmittedAnswer}
                          className={`w-full border border-gray-300 rounded-lg py-3 px-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            hasSubmittedAnswer ? 'bg-gray-100 text-gray-500' : ''
                          }`}
                          placeholder="Type your answer here..."
                        />
                        <button
                          onClick={handleSubmitTextAnswer}
                          disabled={!myTextAnswer || hasSubmittedAnswer}
                          className={`w-full py-3 px-4 rounded-lg font-medium ${
                            !myTextAnswer || hasSubmittedAnswer
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {hasSubmittedAnswer ? 'Answer Submitted' : 'Submit Answer'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Navigation buttons */}
              <div className="px-6 py-4 bg-gray-50 flex justify-between">
                <button
                  onClick={goToPrevQuestion}
                  disabled={currentQuestion === 0}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    currentQuestion === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaArrowLeft className="mr-2" />
                  Previous
                </button>
                
                <div className="flex space-x-3">
                  {isOwner && !allAnswersSubmitted && isTextQuestion && (
                    <button
                      onClick={handleSkipQuestion}
                      className="bg-yellow-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-yellow-600"
                    >
                      Skip Question
                    </button>
                  )}
                  
                  {currentQuestion === room.questions.length - 1 && (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={isTextQuestion ? !allAnswersSubmitted : selectedAnswers.length < room.questions.length}
                      className={`px-5 py-2 rounded-lg font-medium ${
                        isTextQuestion 
                          ? (!allAnswersSubmitted ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700')
                          : (selectedAnswers.length < room.questions.length ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700')
                      }`}
                    >
                      Submit Quiz
                    </button>
                  )}
                  
                  {currentQuestion < room.questions.length - 1 && (
                    <button
                      onClick={goToNextQuestion}
                      disabled={isTextQuestion && !allAnswersSubmitted}
                      className={`bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center ${
                        isTextQuestion && !allAnswersSubmitted ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Next
                      <FaArrowRight className="ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Results screen */
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center">
                  <FaTrophy className="text-yellow-500 text-3xl mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Quiz Completed!
                    </h2>
                    <p className="text-gray-600 mt-1">
                      You scored {score} out of {room.questions.length} questions correctly.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-6">
                <h3 className="text-lg font-medium mb-4">Question Review</h3>
                
                <div className="space-y-6">
                  {room.questions.map((question: Question, qIndex: number) => {
                    const userAnswer = selectedAnswers[qIndex];
                    const isCorrect = userAnswer === question.correctAnswer;
                    
                    return (
                      <div 
                        key={qIndex} 
                        className={`p-4 rounded-lg ${
                          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                            isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {isCorrect ? <FaCheck /> : <FaTimes />}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">
                              {qIndex + 1}. {question.question}
                            </h4>
                            
                            <div className="mt-3 space-y-2">
                              {question.options.map((option: string, oIndex: number) => (
                                <div 
                                  key={oIndex}
                                  className={`py-2 px-3 rounded ${
                                    oIndex === question.correctAnswer
                                      ? 'bg-green-100 text-green-800'
                                      : oIndex === userAnswer && oIndex !== question.correctAnswer
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-50 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-start">
                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-2 text-xs ${
                                      oIndex === question.correctAnswer
                                        ? 'bg-green-500 text-white'
                                        : oIndex === userAnswer && oIndex !== question.correctAnswer
                                          ? 'bg-red-500 text-white'
                                          : 'bg-gray-300 text-gray-700'
                                    }`}>
                                      {String.fromCharCode(65 + oIndex)}
                                    </div>
                                    <span>{option}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="px-8 py-6 bg-gray-50 flex justify-between">
                <Link
                  href="/play"
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Return to Play Page
                </Link>
                
                <button
                  onClick={() => {
                    setQuizSubmitted(false);
                    setSelectedAnswers([]);
                    setCurrentQuestion(0);
                    setScore(0);
                  }}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 