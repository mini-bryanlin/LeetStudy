import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full overflow-hidden">
        <svg preserveAspectRatio="none" width="100%" height="24" viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 48H1440V0C1440 0 1088 48 720 48C352 48 0 0 0 0V48Z" fill="#065f46" />
        </svg>
      </div>
      
      <div className="container mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <span className="text-white">Leet</span>
                <span className="text-yellow-300">Study</span>
              </h3>
              <div className="flex ml-3">
                {Array(5).fill(0).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-300">
              Turn studying into a game! Earn XP, unlock achievements, and level up your brain! 🧠✨
            </p>
            <div className="mt-4 text-xs bg-emerald-800 text-emerald-200 p-2 rounded-lg">
              <div className="font-bold text-emerald-100 mb-1">ACHIEVEMENTS UNLOCKED TODAY:</div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-emerald-900 px-2 py-1 rounded-full flex items-center">
                  <span className="mr-1">🔥</span> 3-Day Streak
                </span>
                <span className="bg-emerald-900 px-2 py-1 rounded-full flex items-center">
                  <span className="mr-1">🎯</span> First Quiz
                </span>
                <span className="bg-emerald-900 px-2 py-1 rounded-full flex items-center">
                  <span className="mr-1">👑</span> Top Score
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <span className="text-yellow-300 mr-2">⚡</span>
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-yellow-300 transition-colors flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Home Base
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-yellow-300 transition-colors flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  About Our Quest
                </Link>
              </li>
              <li>
                <Link href="/play" className="text-gray-300 hover:text-yellow-300 transition-colors flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Start Game
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-yellow-300 transition-colors flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Send a Message
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <span className="text-yellow-300 mr-2">🏆</span>
              High Scores
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between bg-gray-700 p-2 rounded">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-gray-800 font-bold mr-2">1</span>
                  <span>Sarah W.</span>
                </div>
                <span className="text-yellow-300 font-mono">5,210 XP</span>
              </li>
              <li className="flex items-center justify-between bg-gray-700 p-2 rounded">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-gray-800 font-bold mr-2">2</span>
                  <span>Emily D.</span>
                </div>
                <span className="text-yellow-300 font-mono">3,150 XP</span>
              </li>
              <li className="flex items-center justify-between bg-gray-700 p-2 rounded">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-yellow-800 rounded-full flex items-center justify-center text-yellow-300 font-bold mr-2">3</span>
                  <span>Alex J.</span>
                </div>
                <span className="text-yellow-300 font-mono">2,340 XP</span>
              </li>
            </ul>
            <div className="mt-4">
              <Link 
                href="/leaderboard" 
                className="text-emerald-300 hover:text-yellow-300 transition-colors text-sm flex items-center"
              >
                <span>View full leaderboard</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-400 flex flex-col md:flex-row justify-between items-center">
          <p className="mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} LeetStudy. Level up your brain! 🚀
          </p>
          <div className="flex space-x-3">
            <a href="#" className="text-gray-400 hover:text-yellow-300 transition-colors">
              <span className="sr-only">Discord</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.39-.444.883-.608 1.282a18.301 18.301 0 0 0-5.487 0c-.164-.399-.398-.893-.608-1.282a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.834 19.834 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-yellow-300 transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-yellow-300 transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 