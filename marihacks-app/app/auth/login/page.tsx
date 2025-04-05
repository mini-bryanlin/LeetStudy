"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { FaStar, FaLock, FaEnvelope } from 'react-icons/fa';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      // Redirect to play page without alert
      router.push('/play');
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="py-12 px-4 max-w-md mx-auto">
      <div className="relative mb-8">
        <div className="absolute -top-6 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400 rounded-full animate-pulse"></div>
        <h1 className="text-3xl font-bold mb-2 text-center text-yellow-500">✨ Hero Login ✨</h1>
        <p className="text-lg text-gray-600 mb-4 text-center">
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-md mr-2">+50 XP</span>
          Return to your epic quest!
        </p>
        <div className="flex justify-center gap-2 mb-2">
          {[1,2,3,4,5].map(star => (
            <FaStar key={star} className="text-yellow-400 text-xl animate-bounce" style={{animationDelay: `${star*0.1}s`}} />
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-yellow-300 relative">
        <div className="absolute -right-4 -top-4 bg-yellow-400 text-white px-4 py-1 rotate-12 shadow-md font-bold">
          LEVEL UP!
        </div>
        
        {errorMsg && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{errorMsg}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaEnvelope className="text-yellow-500 mr-1" /> Magic Scroll (Email)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 py-2 px-3"
              placeholder="Enter your magical email"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaLock className="text-yellow-500 mr-1" /> Secret Spell (Password)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 py-2 px-3"
              placeholder="Enter your secret spell"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Summoning...' : 'BEGIN ADVENTURE!'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            No magical powers yet?{' '}
            <Link 
              href="/auth/signup" 
              className="text-green-600 hover:text-green-800 font-medium transition-colors"
            >
              Create a hero account!
            </Link>
          </p>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <Link 
          href="/"
          className="text-green-600 hover:text-green-800 font-medium transition-colors flex items-center justify-center"
        >
          ← Return to Home Base
        </Link>
      </div>
    </div>
  );
} 