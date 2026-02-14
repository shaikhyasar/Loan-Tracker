import React, { useEffect, useState, useRef } from 'react';
import { Home, PlusCircle, Moon, Sun, Download, Upload, Settings, Save } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { BeforeInstallPromptEvent } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleTheme }) => {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = () => {
    const data = localStorage.getItem('loan_records');
    if (!data) {
        alert("No data to export");
        return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowSettings(false);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = event.target?.result as string;
              // Validate JSON basic structure
              const parsed = JSON.parse(json);
              if (Array.isArray(parsed)) {
                  if (window.confirm("This will overwrite your current current data. Are you sure?")) {
                      localStorage.setItem('loan_records', json);
                      window.location.reload();
                  }
              } else {
                  alert("Invalid file format.");
              }
          } catch (err) {
              alert("Error reading file.");
          }
      };
      reader.readAsText(file);
      setShowSettings(false);
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
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-gray-300"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Settings Dropdown */}
      {showSettings && (
          <div className="absolute top-14 right-2 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 p-2 animate-fade-in origin-top-right">
              <button onClick={handleExport} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg">
                  <Save size={16} className="text-blue-500" />
                  Backup Data
              </button>
              <button onClick={handleImportClick} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg border-t border-gray-100 dark:border-slate-700">
                  <Upload size={16} className="text-green-500" />
                  Restore Data
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24" onClick={() => setShowSettings(false)}>
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
      
      {showSettings && <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setShowSettings(false)}></div>}
    </div>
  );
};

export default Layout;