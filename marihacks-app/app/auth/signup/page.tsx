"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { FaStar, FaLock, FaEnvelope, FaUser, FaShieldAlt } from 'react-icons/fa';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { signup } = useAuth();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match!');
      return;
    }
    
    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signup(formData.username, formData.email, formData.password);
      // Redirect to play page without alert
      router.push('/play');
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="py-12 px-4 max-w-md mx-auto">
      <div className="relative mb-8">
        <div className="absolute -top-6 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400 rounded-full animate-pulse"></div>
        <h1 className="text-3xl font-bold mb-2 text-center text-yellow-500">✨ Create Your Hero ✨</h1>
        <p className="text-lg text-gray-600 mb-4 text-center">
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-md mr-2">+100 XP</span>
          Begin your knowledge adventure!
        </p>
        <div className="flex justify-center gap-2 mb-2">
          {[1,2,3,4,5].map(star => (
            <FaStar key={star} className="text-yellow-400 text-xl animate-bounce" style={{animationDelay: `${star*0.1}s`}} />
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-yellow-300 relative">
        <div className="absolute -right-4 -top-4 bg-yellow-400 text-white px-4 py-1 rotate-12 shadow-md font-bold">
          NEW HERO!
        </div>
        
        {errorMsg && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{errorMsg}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaUser className="text-yellow-500 mr-1" /> Hero Name
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-lg border border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 py-2 px-3"
              placeholder="Choose your hero name"
              required
              minLength={3}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaEnvelope className="text-yellow-500 mr-1" /> Magic Scroll (Email)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 py-2 px-3"
              placeholder="Enter your magical email"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaLock className="text-yellow-500 mr-1" /> Secret Spell (Password)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 py-2 px-3"
              placeholder="Create your secret spell"
              required
              minLength={6}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaShieldAlt className="text-yellow-500 mr-1" /> Confirm Secret Spell
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 py-2 px-3"
              placeholder="Confirm your secret spell"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Hero...' : 'CREATE YOUR HERO!'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already a hero?{' '}
            <Link 
              href="/auth/login" 
              className="text-green-600 hover:text-green-800 font-medium transition-colors"
            >
              Login to your adventure!
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