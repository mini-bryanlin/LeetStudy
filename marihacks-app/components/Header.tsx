"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useState } from 'react';

const Header = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Calculate XP needed for next level
  const xpNeeded = user ? (user.level * 100) : 100;
  const xpProgress = user ? Math.min(Math.round((user.xp / xpNeeded) * 100), 100) : 0;

  return (
    <header className="bg-emerald-500 text-white shadow-md relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-emerald-300 to-yellow-300"></div>
      
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold flex items-center">
            <span className="text-white">Leet</span>
            <span className="text-yellow-300">Study</span>
            <span className="ml-1 text-xs bg-yellow-400 text-emerald-800 px-1 py-0.5 rounded">
              BETA
            </span>
          </Link>
        </div>
        
        <nav className="flex items-center">
          {/* User score display - only shown when logged in */}
          {user && (
            <div className="hidden md:flex items-center mr-8 bg-emerald-600 rounded-full px-3 py-1 text-sm">
              <div className="mr-3 flex items-center">
                <svg className="w-4 h-4 mr-1 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>{user.xp} / {xpNeeded} XP</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Level {user.level}</span>
              </div>
            </div>
          )}
          
          <ul className="flex space-x-1 md:space-x-4 items-center">
            <li>
              <Link href="/" className="hover:text-yellow-300 transition-colors px-2 py-1 rounded-full hover:bg-emerald-600">
                🏠 Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-yellow-300 transition-colors px-2 py-1 rounded-full hover:bg-emerald-600">
                📚 About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-yellow-300 transition-colors px-2 py-1 rounded-full hover:bg-emerald-600">
                📝 Contact
              </Link>
            </li>
            <li>
              <Link 
                href={user ? "/play" : "/auth/login"} 
                className="bg-yellow-400 hover:bg-yellow-500 text-emerald-800 font-bold px-3 py-1 rounded-full transition-colors flex items-center"
              >
                🎮 {user ? "Play!" : "Login to Play!"}
              </Link>
            </li>
            
            {/* Auth menu */}
            {user ? (
              <li className="relative ml-2">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-full transition-colors"
                >
                  <FaUser className="mr-1" />
                  <span className="hidden md:inline">{user.username}</span>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-emerald-800 font-medium">{user.username}</div>
                      <div className="text-gray-500 text-sm truncate">{user.email}</div>
                    </div>
                    
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm text-gray-600">Level {user.level}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${xpProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{user.xp} / {xpNeeded} XP</div>
                    </div>
                    
                    <button
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <FaSignOutAlt className="inline mr-1" /> Logout
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <>
                <li>
                  <Link 
                    href="/auth/login" 
                    className="flex items-center text-white hover:text-yellow-300 transition-colors px-2 py-1"
                  >
                    <FaSignInAlt className="mr-1" />
                    <span className="hidden md:inline">Login</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/auth/signup" 
                    className="flex items-center bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-full transition-colors"
                  >
                    <FaUserPlus className="mr-1" />
                    <span className="hidden md:inline">Sign Up</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 