import React, { useRef } from 'react';
import { Moon, Sun, Download, Upload, Trash2, ChevronRight, Save, ShieldAlert } from 'lucide-react';

interface SettingsProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, toggleTheme }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = localStorage.getItem('loan_records');
    if (!data || data === '[]') {
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
              const parsed = JSON.parse(json);
              if (Array.isArray(parsed)) {
                  if (window.confirm("This will overwrite all current data. This action cannot be undone. Proceed?")) {
                      localStorage.setItem('loan_records', json);
                      window.location.reload();
                  }
              } else {
                  alert("Invalid backup file format.");
              }
          } catch (err) {
              alert("Error reading file.");
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleWipeData = () => {
      if (window.confirm("ARE YOU SURE? This will delete ALL loan records permanently.")) {
          localStorage.removeItem('loan_records');
          window.location.reload();
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Settings</h2>

        {/* Appearance */}
        <section className="bg-white dark:bg-carddark rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Appearance</h3>
            </div>
            <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-blue-100 text-blue-600'}`}>
                        {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-slate-700 dark:text-gray-200">Dark Mode</p>
                        <p className="text-xs text-gray-500">Toggle app theme</p>
                    </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            </button>
        </section>

        {/* Data Management */}
        <section className="bg-white dark:bg-carddark rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Management</h3>
            </div>
            
            <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between p-4 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        <Save size={20} />
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-slate-700 dark:text-gray-200">Backup Data</p>
                        <p className="text-xs text-gray-500">Save a copy to your device</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
            </button>

            <button 
                onClick={handleImportClick}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Upload size={20} />
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-slate-700 dark:text-gray-200">Restore Data</p>
                        <p className="text-xs text-gray-500">Import from backup file</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
            </button>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-carddark rounded-xl border border-red-100 dark:border-red-900/30 overflow-hidden shadow-sm">
             <button 
                onClick={handleWipeData}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                        <Trash2 size={20} />
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-red-600 dark:text-red-400">Erase All Data</p>
                        <p className="text-xs text-red-400/70">Permanently delete all records</p>
                    </div>
                </div>
                <ShieldAlert size={18} className="text-red-400" />
            </button>
        </section>

        <div className="text-center text-xs text-gray-400 mt-8">
            <p>Daily Interest Tracker v1.2</p>
            <p>Offline Mode Active</p>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
    </div>
  );
};

export default Settings;