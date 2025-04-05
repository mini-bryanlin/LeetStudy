import Image from "next/image";
import Link from "next/link";

export default function Home() {
  // Sample user data for the panel
  const users = [
    { id: 1, name: "Alex J.", role: "Level 12 Scholar", avatar: "https://randomuser.me/api/portraits/men/32.jpg", subjects: ["Physics", "Chemistry"], points: 2340 },
    { id: 2, name: "Sarah W.", role: "Knowledge Master", avatar: "https://randomuser.me/api/portraits/women/44.jpg", subjects: ["Math", "Computer Science"], points: 5210 },
    { id: 3, name: "Michael B.", role: "Rising Star", avatar: "https://randomuser.me/api/portraits/men/67.jpg", subjects: ["Biology", "History"], points: 1870 },
    { id: 4, name: "Emily D.", role: "Question Wizard", avatar: "https://randomuser.me/api/portraits/women/17.jpg", subjects: ["Literature", "Economics"], points: 3150 },
  ];

  return (
    <div className="py-10 px-4 md:px-8 max-w-5xl mx-auto bg-gradient-to-b from-emerald-50 to-white">
      {/* Hero Section */}
      <div className="text-center mb-16 bg-white p-8 rounded-xl shadow-sm border-2 border-dashed border-emerald-300">
        <div className="mb-6 relative">
          <h1 className="text-4xl md:text-6xl font-bold mb-2 relative z-10">
            <span className="text-emerald-600">Learn</span> <span className="text-yellow-500">•</span> <span className="text-emerald-500">Play</span> <span className="text-yellow-500">•</span> <span className="text-emerald-400">Win!</span>
          </h1>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-100 rounded-full -z-0 opacity-50 animate-ping"></div>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Turn boring study sessions into exciting quests! Upload your notes, earn XP, compete with friends, and become a learning legend! 🚀
        </p>
        <Link href="/play" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 inline-block shadow-lg hover:shadow-xl transform hover:scale-105 hover:-rotate-1">
          Start Your Adventure! 🎮
        </Link>
        <div className="mt-6 text-emerald-600 font-medium animate-bounce">
          ▼ Scroll to see the magic ▼
        </div>
      </div>

      {/* Features Section - now with badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-emerald-200 hover:shadow-lg transition-all hover:transform hover:scale-105">
          <div className="absolute -right-2 -top-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full text-white">
            +50 XP
          </div>
          <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Upload Quest</h3>
          <p className="text-gray-600 text-center">
            Drop your notes and unlock secret knowledge challenges. Your first achievement awaits!
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-emerald-200 hover:shadow-lg transition-all hover:transform hover:scale-105">
          <div className="absolute -right-2 -top-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full text-white">
            +100 XP
          </div>
          <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Brain Battles</h3>
          <p className="text-gray-600 text-center">
            Take on AI-powered challenges tailored just for you. Beat your high score!
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-emerald-200 hover:shadow-lg transition-all hover:transform hover:scale-105">
          <div className="absolute -right-2 -top-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full text-white">
            +75 XP
          </div>
          <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Level Up!</h3>
          <p className="text-gray-600 text-center">
            Get instant feedback and watch your knowledge power grow with each correct answer!
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-emerald-200 hover:shadow-lg transition-all hover:transform hover:scale-105">
          <div className="absolute -right-2 -top-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full text-white">
            +150 XP
          </div>
          <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-center mb-2">Squad Goals</h3>
          <p className="text-gray-600 text-center">
            Team up, challenge friends, and climb the leaderboards together!
          </p>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="mb-16 bg-white p-8 rounded-xl shadow-sm border-2 border-emerald-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-100 rounded-full -mr-10 -mt-10 z-0"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100 rounded-full -ml-10 -mb-10 z-0"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <h2 className="text-3xl font-bold text-center text-emerald-600">Legends Leaderboard</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {users.map((user, index) => (
              <div key={user.id} className="bg-white rounded-xl shadow-md p-6 border-2 border-emerald-100 hover:border-emerald-300 transition-all relative">
                <div className="absolute -right-3 -top-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  #{index + 1}
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-emerald-300"
                    />
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 w-8 h-8">
                        <svg className="w-full h-full text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{user.name}</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">
                    {user.role}
                  </span>
                  <div className="text-yellow-500 font-bold mb-2">
                    {user.points} XP
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {user.subjects.map((subject, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/community" className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center justify-center">
              <span>See full leaderboard</span>
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-2xl p-8 text-center text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-opacity-20 bg-white">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="5,5" />
              <path d="M0,50 Q25,30 50,50 T100,50" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="5,5" />
              <path d="M0,70 Q25,50 50,70" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="5,5" />
            </svg>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4 text-emerald-600">Ready for a Learning Adventure?</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto text-emerald-500">
            Join thousands of happy learners who are having fun while leveling up their knowledge!
          </p>
          <Link href="/play" className="bg-yellow-400 hover:bg-yellow-500 text-emerald-900 font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 inline-block transform hover:scale-105">
            Begin Your Quest! 🎯
          </Link>
        </div>
      </div>
    </div>
  );
}
