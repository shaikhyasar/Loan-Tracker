import React, { useEffect, useState } from 'react';
import { Home, PlusCircle, Moon, Sun, Download, Settings } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { BeforeInstallPromptEvent } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isActive = (path: string) => location.pathname === path ? 'text-primary' : 'text-gray-400 dark:text-gray-500';

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      setDeferredPrompt(null);
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Top Bar */}
      <header className="bg-white dark:bg-carddark shadow-sm px-4 py-3 sticky top-0 z-10 flex justify-between items-center transition-colors">
        <h1 className="text-xl font-bold tracking-tight text-primary">InterestTracker</h1>
        
        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-bold transition-all mr-1"
            >
              <Download size={14} />
              App
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
          
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-gray-300"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-carddark border-t dark:border-slate-700 py-3 flex justify-around items-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link to="/" className={`flex flex-col items-center gap-1 p-2 w-full ${isActive('/')}`}>
          <Home size={28} />
          <span className="text-[10px] font-bold uppercase tracking-wide">Home</span>
        </Link>
        
        <Link to="/add" className={`flex flex-col items-center gap-1 p-2 w-full ${isActive('/add')}`}>
           <PlusCircle size={28} />
           <span className="text-[10px] font-bold uppercase tracking-wide">Add Record</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;