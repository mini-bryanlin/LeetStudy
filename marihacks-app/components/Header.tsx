import Link from 'next/link';

const Header = () => {
  // Mocked user data - in a real app this would come from authentication/state
  const userPoints = 1250;
  const userLevel = 5;

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
          {/* User score display */}
          <div className="hidden md:flex items-center mr-8 bg-emerald-600 rounded-full px-3 py-1 text-sm">
            <div className="mr-3 flex items-center">
              <svg className="w-4 h-4 mr-1 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>{userPoints} XP</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Level {userLevel}</span>
            </div>
          </div>
          
          <ul className="flex space-x-1 md:space-x-4">
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
                href="/play" 
                className="bg-yellow-400 hover:bg-yellow-500 text-emerald-800 font-bold px-3 py-1 rounded-full transition-colors md:ml-4 flex items-center">
                🎮 Play!
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 