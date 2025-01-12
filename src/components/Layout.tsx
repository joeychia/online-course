import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="layout-container">
      <header className="header">
        <nav>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-xl font-bold text-white hover:text-blue-100 transition-colors">
                Online Course
              </Link>
              <div className="flex gap-6">
                <Link to="/" className="text-blue-100 hover:text-white transition-colors">
                  Home
                </Link>
                <Link to="/courses" className="text-blue-100 hover:text-white transition-colors">
                  Courses
                </Link>
                <Link to="/progress" className="text-blue-100 hover:text-white transition-colors">
                  My Progress
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>
      
      <main className="main-content">
        {children}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">About Us</h3>
              <p className="text-sm">Dedicated to providing high-quality online learning experiences.</p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Connect</h3>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  LinkedIn
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-center">
            <p>&copy; 2024 Online Course. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 