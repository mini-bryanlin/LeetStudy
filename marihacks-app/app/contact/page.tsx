import Link from "next/link";

export default function Contact() {
  return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-indigo-700">Contact Us</h1>
      
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <p className="text-gray-700 mb-8 text-center">
          Have questions or feedback? We'd love to hear from you. Fill out the form below or reach out to us directly.
        </p>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your first name"
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your last name"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your.email@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="How can we help you?"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your message here..."
            ></textarea>
          </div>
          
          <div>
            <button
              type="submit"
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              Send Message
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-8">
        <h2 className="text-xl font-semibold mb-4 text-indigo-600">Other Ways to Reach Us</h2>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Email</h3>
              <p className="text-gray-600">info@leetstudy.com</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Live Chat</h3>
              <p className="text-gray-600">Available Monday-Friday, 9am-5pm EST</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Phone</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-8">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
} 