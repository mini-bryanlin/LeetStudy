"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { FaStar, FaTrophy, FaArrowRight, FaArrowLeft } from "react-icons/fa";

export default function RoomClient({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  const router = useRouter();
  const { user, loading: authLoading, updateUserScore } = useAuth();
  
  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rooms/${roomId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load room data");
        }
        
        const data = await response.json();
        setRoom(data.room);
      } catch (error: any) {
        setError(error.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (!authLoading) {
      fetchRoom();
    }
  }, [roomId, user, authLoading, router]);
  
  // Handle selecting an answer
  const handleSelectAnswer = (answerIndex: number) => {
    if (quizSubmitted) return;
    
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
  };
  
  // Navigate to the next question
  const goToNextQuestion = () => {
    if (currentQuestion < room.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  // Navigate to the previous question
  const goToPrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  // Submit the quiz
  const handleSubmitQuiz = async () => {
    let newScore = 0;
    
    // Calculate score
    for (let i = 0; i < room.questions.length; i++) {
      if (selectedAnswers[i] === room.questions[i].correctAnswer) {
        newScore++;
      }
    }
    
    setScore(newScore);
    setQuizSubmitted(true);
    
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
  
  const currentQuestionData = room.questions[currentQuestion];
  
  return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <div className="relative mb-8">
        <div className="absolute -top-6 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400 rounded-full animate-pulse"></div>
        <h1 className="text-3xl font-bold mb-2 text-center text-yellow-500">✨ {room.roomName} ✨</h1>
        <p className="text-lg text-gray-600 mb-4 text-center">
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-md mr-2">
            {room.subject}
          </span>
          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">
            {room.difficulty.charAt(0).toUpperCase() + room.difficulty.slice(1)} Mode
          </span>
        </p>
      </div>
      
      {quizSubmitted ? (
        // Results screen
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-yellow-300 relative">
          <div className="absolute -right-4 -top-4 bg-yellow-400 text-white px-4 py-1 rotate-12 shadow-md font-bold">
            QUEST COMPLETE!
          </div>
          
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-yellow-500 mb-2">Quest Complete!</h2>
            <p className="text-lg text-gray-700 mb-4">
              You scored <span className="font-bold text-yellow-500">{score}</span> out of <span className="font-bold">{room.questions.length}</span>
            </p>
            <div className="mb-4">
              <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md font-medium">
                +{score * 20} XP earned!
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-yellow-700 mb-2">Your Results</h3>
            
            {room.questions.map((question: any, index: number) => (
              <div key={index} className="mb-2 border-b border-yellow-100 pb-2 last:border-0">
                <div className="flex items-center">
                  {selectedAnswers[index] === question.correctAnswer ? (
                    <span className="inline-block bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center mr-2">✓</span>
                  ) : (
                    <span className="inline-block bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center mr-2">✗</span>
                  )}
                  <span className="font-medium">Question {index + 1}</span>
                </div>
                {selectedAnswers[index] !== question.correctAnswer && (
                  <div className="ml-8 mt-1 text-sm">
                    <div className="text-red-600">
                      Your answer: {question.options[selectedAnswers[index]]}
                    </div>
                    <div className="text-green-600">
                      Correct answer: {question.options[question.correctAnswer]}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between">
            <Link 
              href="/play" 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-all transform hover:scale-105 shadow-md flex items-center"
            >
              Start New Quest
            </Link>
            
            <button
              onClick={() => {
                setQuizSubmitted(false);
                setCurrentQuestion(0);
              }}
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-full transition-all transform hover:scale-105 shadow-md flex items-center"
            >
              Review Answers
            </button>
          </div>
        </div>
      ) : (
        // Quiz screen
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-yellow-300 relative">
          <div className="absolute -right-4 -top-4 bg-yellow-400 text-white px-4 py-1 rotate-12 shadow-md font-bold">
            QUESTION {currentQuestion + 1}
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-1">
                {Array.from({ length: room.questions.length }).map((_, i) => (
                  <div 
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i === currentQuestion 
                        ? 'bg-yellow-500' 
                        : selectedAnswers[i] !== undefined 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                    }`}
                  ></div>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {room.questions.length}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {currentQuestionData.question}
            </h2>
            
            <div className="space-y-3 mb-6">
              {currentQuestionData.options.map((option: string, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-300'
                      : 'border-gray-200 hover:border-yellow-300'
                  } cursor-pointer transition-all`}
                  onClick={() => handleSelectAnswer(index)}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      selectedAnswers[currentQuestion] === index
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>{option}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={goToPrevQuestion}
              disabled={currentQuestion === 0}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaArrowLeft className="mr-2" /> Previous
            </button>
            
            {currentQuestion < room.questions.length - 1 ? (
              <button
                onClick={goToNextQuestion}
                disabled={selectedAnswers[currentQuestion] === undefined}
                className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={selectedAnswers.length !== room.questions.length || selectedAnswers.some(answer => answer === undefined)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz <FaTrophy className="ml-2" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 