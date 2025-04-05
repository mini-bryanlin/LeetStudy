import Link from "next/link";

export default function PlayPage() {
  return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-emerald-600">Upload Your Study Materials</h1>
      <p className="text-lg text-gray-600 mb-8 text-center">
        Start by uploading your notes, textbooks, or any study materials, and our AI will generate custom questions for you to practice
      </p>
      
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-emerald-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg mb-2 font-medium">Drop your file here, or <span className="text-emerald-600">browse</span></p>
          <p className="text-sm text-gray-500 mb-4">Supports PDF, DOCX, TXT, and image files</p>
          <button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Select File
          </button>
        </div>
      </div>
      
      <div className="bg-emerald-50 rounded-xl p-6 mb-8 border border-emerald-100">
        <h2 className="text-xl font-semibold mb-4 text-emerald-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Group Study
        </h2>
        <p className="mb-4 text-gray-600">
          Learn together with friends, classmates, or study groups. Share materials and practice questions in real-time.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="group-code" className="block text-sm font-medium text-gray-700 mb-1">
              Join Existing Group
            </label>
            <div className="flex">
              <input 
                type="text" 
                id="group-code" 
                placeholder="Enter 6-digit group code" 
                className="flex-grow rounded-l-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 py-2 px-3"
              />
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-r-lg hover:bg-emerald-700 transition-colors">
                Join
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="new-group" className="block text-sm font-medium text-gray-700 mb-1">
              Create New Group
            </label>
            <div className="flex">
              <input 
                type="text" 
                id="new-group" 
                placeholder="Enter group name" 
                className="flex-grow rounded-l-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 py-2 px-3"
              />
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-r-lg hover:bg-emerald-700 transition-colors">
                Create
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <h3 className="font-medium text-emerald-800 mb-2">Group Study Benefits</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-center">
              <svg className="h-4 w-4 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Share study materials with your group
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Compete on practice questions with a live leaderboard
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Discuss answers and explanations in real-time chat
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Track group progress over time
            </li>
          </ul>
        </div>
      </div>
      
      <div className="bg-emerald-50 rounded-xl p-6 mb-8 border border-emerald-100">
        <h2 className="text-xl font-semibold mb-4 text-emerald-700">Subject Selection</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {["Mathematics", "Physics", "Chemistry", "Biology", "History", "Literature", 
            "Computer Science", "Economics", "Psychology", "Art"].map((subject, i) => (
            <div key={i} className="flex items-center">
              <input
                id={`subject-${i}`}
                type="checkbox"
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor={`subject-${i}`} className="ml-2 text-sm font-medium text-gray-700">
                {subject}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-emerald-600">Study Preferences</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level
            </label>
            <select 
              id="difficulty" 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="mixed">Mixed Levels</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="question-count" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Questions
            </label>
            <input
              type="range"
              id="question-count"
              min="5"
              max="50"
              step="5"
              defaultValue="10"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-colors mb-6">
          Generate Questions
        </button>
        <div>
          <Link 
            href="/" 
            className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 