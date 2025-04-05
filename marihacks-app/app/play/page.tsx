"use client";

import Link from "next/link";
import { useState } from "react";
import { FaTrophy, FaGamepad, FaFire, FaStar, FaDragon, FaBrain, FaTrash, FaDoorOpen, FaUpload } from 'react-icons/fa';
import { GiTakeMyMoney, GiSpellBook, GiUpgrade, GiMagicSwirl, GiScrollUnfurled, GiDoorway } from 'react-icons/gi';

export default function PlayPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState<string>('');
  const [roomNameError, setRoomNameError] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isPrivateRoom, setIsPrivateRoom] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles?.length) {
      const filesArray = Array.from(newFiles);
      setUploadedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateRoomName = (value: string) => {
    // Only allow letters, numbers, and spaces
    const isValid = /^[a-zA-Z0-9 ]+$/.test(value);
    
    if (!isValid && value) {
      setRoomNameError('Room names can only contain letters, numbers, and spaces');
    } else {
      setRoomNameError('');
    }
    
    setRoomName(value);
  };

  return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <div className="relative mb-8">
        <div className="absolute -top-6 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400 rounded-full animate-pulse"></div>
        <h1 className="text-3xl font-bold mb-2 text-center text-yellow-500">✨ Epic Knowledge Quest ✨</h1>
        <p className="text-lg text-gray-600 mb-4 text-center">
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-md mr-2">+25 XP</span>
          Choose your path: Create a quest or join an existing adventure!
        </p>
        <div className="flex justify-center gap-2 mb-2">
          {[1,2,3,4,5].map(star => (
            <FaStar key={star} className="text-yellow-400 text-xl animate-bounce" style={{animationDelay: `${star*0.1}s`}} />
          ))}
        </div>
      </div>
      
      {/* Tab Selection */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`flex-1 py-3 px-4 font-medium rounded-t-lg flex items-center justify-center gap-2 ${
            activeTab === 'create' 
              ? 'bg-yellow-400 text-white border-yellow-400' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('create')}
        >
          <FaUpload /> Create New Quest
        </button>
        <button
          className={`flex-1 py-3 px-4 font-medium rounded-t-lg flex items-center justify-center gap-2 ${
            activeTab === 'join' 
              ? 'bg-green-500 text-white border-green-500' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('join')}
        >
          <FaDoorOpen /> Join Existing Quest
        </button>
      </div>
      
      {activeTab === 'create' ? (
        <>
          <div className="bg-white rounded-xl shadow-md p-8 mb-8 relative overflow-hidden border-2 border-yellow-300">
            <div className="absolute -right-4 -top-4 bg-yellow-400 text-white px-4 py-1 rotate-12 shadow-md font-bold">
              LEVEL 1
            </div>
            <div className="border-2 border-dashed border-yellow-300 rounded-lg p-12 flex flex-col items-center justify-center relative">
              <div className="absolute top-2 left-2 bg-green-100 text-green-800 rounded-full px-2 py-1 text-xs font-bold">
                +50 XP per scroll!
              </div>
              <GiSpellBook className="h-16 w-16 text-yellow-500 mb-4" />
              <p className="text-lg mb-2 font-medium">Drop your magical scrolls here, or <span className="text-green-600 font-bold">summon</span> them</p>
              <p className="text-sm text-gray-500 mb-4">Your spell book accepts PDF, DOCX, TXT, and image scrolls</p>
              
              <label htmlFor="file-upload" className="w-full max-w-xs">
                <div className="bg-yellow-400 hover:bg-yellow-500 text-white font-medium py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-md flex items-center justify-center cursor-pointer">
                  <GiUpgrade className="mr-2" /> UPLOAD QUEST ITEMS
                </div>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  multiple
                />
              </label>
              
              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-8 w-full">
                  <h3 className="text-lg font-bold text-green-600 mb-2 flex items-center">
                    <GiSpellBook className="mr-2" /> Your Magical Scrolls ({uploadedFiles.length})
                  </h3>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 max-h-60 overflow-y-auto">
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-white p-2 rounded-md border border-yellow-100">
                          <div className="flex items-center">
                            <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="truncate max-w-[200px]">{file.name}</span>
                            <span className="ml-2 text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button 
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label="Remove file"
                          >
                            <FaTrash />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2">
                  1
                </div>
                <h3 className="text-lg font-bold text-yellow-500">Create Your Adventure</h3>
              </div>
              
              <div>
                <label htmlFor="character-name-create" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaDragon className="text-yellow-500 mr-1" /> Choose Your Hero Name
                </label>
                <input 
                  type="text" 
                  id="character-name-create" 
                  placeholder="Enter your hero name" 
                  className="w-full rounded-lg border border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 py-2 px-3 mb-3"
                />
                
                <label htmlFor="room-name-create" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaTrophy className="text-yellow-500 mr-1" /> Name Your Quest Room
                </label>
                <input 
                  type="text" 
                  id="room-name-create" 
                  placeholder="Enter a unique room name" 
                  className={`w-full rounded-lg border ${roomNameError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500'} py-2 px-3`}
                  value={roomName}
                  onChange={(e) => validateRoomName(e.target.value)}
                />
                {roomNameError ? (
                  <p className="text-xs text-red-500 mt-1">{roomNameError}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Others can join your quest using this name</p>
                )}
                
                <div className="mt-4 bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                  <div className="flex justify-between items-center">
                    <label htmlFor="room-privacy" className="text-sm font-medium text-gray-700 flex items-center">
                      <div className={`mr-2 text-lg ${isPrivateRoom ? 'text-yellow-500' : 'text-green-500'}`}>
                        {isPrivateRoom ? '🔒' : '🌎'}
                      </div>
                      <div>
                        <div>Room Privacy</div>
                        <div className="text-xs text-gray-500">{isPrivateRoom ? 'Invite-only access' : 'Anyone can discover and join'}</div>
                      </div>
                    </label>
                    <div className="relative inline-block w-12 align-middle select-none">
                      <input
                        type="checkbox"
                        id="room-privacy"
                        checked={isPrivateRoom}
                        onChange={() => setIsPrivateRoom(!isPrivateRoom)}
                        className="opacity-0 absolute h-0 w-0"
                      />
                      <label
                        htmlFor="room-privacy"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                          isPrivateRoom ? 'bg-yellow-400' : 'bg-green-500'
                        }`}
                      >
                        <span
                          className={`block bg-white rounded-full h-5 w-5 mt-0.5 transform transition-transform duration-200 ease-in-out ${
                            isPrivateRoom ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-2 text-xs p-2 rounded bg-white">
                    {isPrivateRoom ? (
                      <div className="flex items-start">
                        <div className="text-yellow-500 mr-2 mt-0.5">💡</div>
                        <div>Private rooms won't appear in public listings. Share your room name directly with friends. <span className="text-yellow-600 font-medium">+10 XP for enhanced security!</span></div>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <div className="text-green-500 mr-2 mt-0.5">💡</div>
                        <div>Public rooms appear in the quest listings for all adventurers to discover. <span className="text-green-600 font-medium">+5 XP for community spirit!</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 mb-8 border-2 border-green-200 relative">
            <div className="absolute -right-2 -top-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-xl font-semibold mb-4 text-green-600">Choose Your Class 🧙‍♂️</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                {name: "Mathematics", icon: "🧮", color: "bg-blue-100"},
                {name: "Physics", icon: "⚡", color: "bg-purple-100"},
                {name: "Chemistry", icon: "🧪", color: "bg-pink-100"},
                {name: "Biology", icon: "🧬", color: "bg-green-100"},
                {name: "History", icon: "📜", color: "bg-amber-100"},
                {name: "Literature", icon: "📚", color: "bg-red-100"},
                {name: "Computer Science", icon: "💻", color: "bg-cyan-100"},
                {name: "Economics", icon: "📊", color: "bg-emerald-100"},
                {name: "Psychology", icon: "🧠", color: "bg-indigo-100"},
                {name: "Art", icon: "🎨", color: "bg-rose-100"},
              ].map((subject, i) => (
                <div key={i} className={`flex items-center ${subject.color} p-2 rounded-lg border border-gray-200 hover:border-yellow-400 cursor-pointer transition-all hover:transform hover:scale-105`}>
                  <input
                    id={`subject-${i}`}
                    type="checkbox"
                    className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <label htmlFor={`subject-${i}`} className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                    <span className="mr-1">{subject.icon}</span> {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-2 border-yellow-300 relative">
            <div className="absolute -right-2 -top-2 bg-yellow-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-xl font-semibold mb-4 text-yellow-500 flex items-center">
              <FaFire className="mr-2" /> Power Settings ⚡
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Challenge Level 🔥
                </label>
                <select 
                  id="difficulty" 
                  className="bg-gray-50 border-2 border-green-200 text-gray-900 text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full p-2.5"
                >
                  <option value="beginner">Novice (Easy Mode)</option>
                  <option value="intermediate">Adept (Normal Mode)</option>
                  <option value="advanced">Master (Hard Mode)</option>
                  <option value="mixed">Random Encounter (Mixed Levels)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="question-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Quest Length 📏
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    id="question-count"
                    min="5"
                    max="25"
                    step="1"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                  <div className="bg-yellow-400 text-white rounded-full min-w-[3rem] h-8 flex items-center justify-center font-bold text-sm">
                    {questionCount}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 (Quick)</span>
                  <span className="text-center">15 (Standard)</span>
                  <span className="text-right">25 (Epic)</span>
                </div>
                <p className="text-center text-xs text-gray-600 mt-2">
                  {questionCount < 10 
                    ? "A short adventure, perfect for quick breaks!" 
                    : questionCount < 20 
                      ? "The classic quest length, balanced for most adventurers." 
                      : "A legendary challenge for the bravest heroes!"}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Join Existing Quest Tab
        <div className="bg-green-50 rounded-xl p-8 mb-8 border-2 border-green-300 relative">
          <div className="absolute -right-4 -top-4 bg-green-500 text-white px-4 py-1 rotate-12 shadow-md font-bold">
            +30 XP
          </div>
          
          <h2 className="text-2xl font-bold mb-6 text-green-600 flex items-center justify-center">
            <GiDoorway className="mr-2 text-3xl" /> Join an Existing Quest
          </h2>
          
          <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
            <div className="mb-4">
              <label htmlFor="character-name-join" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaDragon className="text-yellow-500 mr-1" /> Choose Your Hero Name
              </label>
              <input 
                type="text" 
                id="character-name-join" 
                placeholder="Enter your hero name" 
                className="w-full rounded-lg border border-green-300 focus:ring-yellow-500 focus:border-yellow-500 py-2 px-3"
              />
              <p className="text-xs text-gray-500 mt-1">This is how other players will know you (+15 XP for choosing a name)</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="room-code" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaGamepad className="text-yellow-500 mr-1" /> Quest Room Code
              </label>
              <div className="flex">
                <input 
                  type="text" 
                  id="room-code" 
                  placeholder="Enter room name to join" 
                  className="flex-grow rounded-l-lg border border-green-300 focus:ring-yellow-500 focus:border-yellow-500 py-2 px-3"
                  pattern="[a-zA-Z0-9 ]+"
                  title="Room names can only contain letters, numbers, and spaces"
                />
                <button 
                  className="bg-green-500 text-white px-4 py-2 rounded-r-lg hover:bg-green-600 transition-all transform hover:scale-105"
                  onClick={() => alert("🎮 Joining quest room... +30 XP gained!")}
                >
                  JOIN
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter the room name created by your friend</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-medium text-green-800 mb-2 flex items-center">
                <GiTakeMyMoney className="mr-1 text-yellow-500" /> Party Member Perks 💎
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="h-5 w-5 text-yellow-500 mr-2 flex items-center justify-center">🔮</div>
                  Access to quest materials shared by party leader
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 text-yellow-500 mr-2 flex items-center justify-center">🏆</div>
                  Earn bonus XP for every correct answer
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 text-yellow-500 mr-2 flex items-center justify-center">💬</div>
                  Chat with fellow adventurers in real-time
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 text-yellow-500 mr-2 flex items-center justify-center">🎯</div>
                  Compare your scores with others in the party
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h3 className="font-bold text-yellow-600 mb-2 flex items-center">
              <FaStar className="mr-1" /> Active Quest Rooms
            </h3>
            <div className="space-y-2">
              {[
                {name: "Chemistry Masters", players: 4, difficulty: "Hard", subject: "🧪 Chemistry"},
                {name: "Math Explorers", players: 2, difficulty: "Medium", subject: "🧮 Mathematics"},
                {name: "History Quest", players: 3, difficulty: "Easy", subject: "📜 History"},
              ].map((room, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-yellow-100 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{room.name}</div>
                    <div className="text-xs text-gray-500">{room.subject} • {room.difficulty} • {room.players} players</div>
                  </div>
                  <button 
                    className="bg-yellow-400 hover:bg-yellow-500 text-white text-sm px-3 py-1 rounded-full"
                    onClick={() => alert(`🎮 Joining ${room.name}... +30 XP gained!`)}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center relative">
        <div className="absolute -top-6 left-0 right-0 flex justify-center">
          <div className="animate-bounce">👇</div>
        </div>
        <button 
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg mb-6 flex items-center mx-auto"
          onClick={() => alert("⚔️ Your adventure begins! +100 XP gained!")}
        >
          <FaGamepad className="mr-2" /> BEGIN YOUR ADVENTURE!
        </button>
        <div>
          <Link 
            href="/" 
            className="text-green-600 hover:text-green-800 font-medium transition-colors flex items-center justify-center"
          >
            ← Return to Home Base
          </Link>
        </div>
        
        <div className="mt-6 text-xs text-gray-400">
          You're currently Level 1 Apprentice • 75/100 XP to next level • 3 achievements unlocked
        </div>
      </div>
    </div>
  );
} 