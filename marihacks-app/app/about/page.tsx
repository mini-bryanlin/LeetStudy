import Link from "next/link";

export default function About() {
  return (
    <div className="py-12 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-emerald-600">About LeetStudy</h1>
      
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-emerald-600">Our Mission</h2>
        <p className="text-gray-700 mb-6">
          At LeetStudy, we believe that practice makes perfect. Our mission is to help students of all levels
          improve their knowledge across various subjects through personalized, AI-generated practice questions and feedback.
        </p>
        
        <h2 className="text-xl font-semibold mb-4 text-emerald-600">How It Works</h2>
        <div className="space-y-4 mb-6">
          <div className="flex items-start">
            <div className="bg-emerald-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <span className="text-emerald-700 font-bold">1</span>
            </div>
            <p className="text-gray-700">
              <strong>Upload your materials:</strong> Start by uploading your study materials like notes, textbooks, or articles in various formats.
            </p>
          </div>
          
          <div className="flex items-start">
            <div className="bg-emerald-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <span className="text-emerald-700 font-bold">2</span>
            </div>
            <p className="text-gray-700">
              <strong>AI Analysis:</strong> Our advanced AI analyzes your materials to understand the content, key concepts, and potential areas for focused learning.
            </p>
          </div>
          
          <div className="flex items-start">
            <div className="bg-emerald-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <span className="text-emerald-700 font-bold">3</span>
            </div>
            <p className="text-gray-700">
              <strong>Practice Questions:</strong> Based on the analysis, we generate custom practice questions that target your specific knowledge gaps.
            </p>
          </div>
          
          <div className="flex items-start">
            <div className="bg-emerald-100 rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <span className="text-emerald-700 font-bold">4</span>
            </div>
            <p className="text-gray-700">
              <strong>Instant Feedback:</strong> Get real-time feedback on your answers to improve your understanding faster.
            </p>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-4 text-emerald-600">Why Choose LeetStudy</h2>
        <ul className="list-disc pl-5 text-gray-700 mb-6 space-y-2">
          <li>Personalized learning experience tailored to your knowledge level</li>
          <li>AI-powered question generation that adapts to your progress</li>
          <li>Immediate feedback that helps you learn from mistakes</li>
          <li>Support for multiple subjects and educational levels</li>
          <li>Collaborative learning with peers and teachers</li>
          <li>Accessible anytime, anywhere</li>
        </ul>
      </div>
      
      <div className="text-center">
        <Link href="/play" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-300 inline-block mr-4">
          Try It Now
        </Link>
        <Link href="/" className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
} 