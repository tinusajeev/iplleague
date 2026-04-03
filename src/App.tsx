import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Calendar, Settings, Share, LockOpen } from 'lucide-react';
import { toBlob } from 'html-to-image';
import Standings from './components/Standings';
import AddMatch from './components/AddMatch';
import History from './components/History';
import Players from './components/Players';
import AdminLogin from './components/AdminLogin';

export default function App() {
  const [activeTab, setActiveTab] = useState('standings');
  const [adminPin, setAdminPin] = useState<string | null>(localStorage.getItem('adminPin'));
  const [isSharing, setIsSharing] = useState(false);

  const handleLogin = (pin: string) => {
    setAdminPin(pin);
    localStorage.setItem('adminPin', pin);
  };

  const handleLogout = () => {
    setAdminPin(null);
    localStorage.removeItem('adminPin');
    setActiveTab('standings');
  };

  const handleShare = async () => {
    const element = document.getElementById('share-content');
    if (!element) return;

    setIsSharing(true);
    try {
      const blob = await toBlob(element, {
        backgroundColor: '#0f172a', // slate-900
        pixelRatio: window.devicePixelRatio || 2,
      });
      
      if (!blob) {
        alert('Could not generate image.');
        setIsSharing(false);
        return;
      }
      
      const file = new File([blob], 'ipl-leaderboard.png', { type: 'image/png' });
      
      const downloadImage = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ipl-leaderboard.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'IPL Predictor League',
            text: 'Check out the latest standings!',
            files: [file]
          });
        } catch (err: any) {
          console.error('Share failed:', err);
          // If user didn't cancel, fallback to download
          if (err.name !== 'AbortError') {
            downloadImage();
          }
        }
      } else {
        // Fallback: download the image
        downloadImage();
      }
      setIsSharing(false);
    } catch (err: any) {
      console.error('Failed to capture screenshot:', err);
      alert('Failed to capture screenshot: ' + (err.message || 'Unknown error'));
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 text-xl">🏏</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">IPL Predictor</h1>
            <p className="text-xs text-rose-500 font-semibold tracking-wider">LEAGUE TRACKER</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {adminPin && (
            <button 
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium py-1.5 px-3 rounded-full flex items-center gap-1.5 transition-colors"
            >
              <LockOpen size={14} />
              Logout
            </button>
          )}
          <button 
            onClick={handleShare}
            disabled={isSharing}
            className={`${isSharing ? 'bg-emerald-500/50 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'} text-white text-sm font-medium py-1.5 px-3 rounded-full flex items-center gap-1.5 transition-colors`}
          >
            <Share size={14} />
            {isSharing ? 'Capturing...' : 'Share'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div id="share-content" className="min-h-full bg-slate-900">
          {activeTab === 'standings' && <Standings />}
          {activeTab === 'add' && (adminPin ? <AddMatch adminPin={adminPin} onMatchAdded={() => setActiveTab('standings')} /> : <AdminLogin onLogin={handleLogin} />)}
          {activeTab === 'history' && <History adminPin={adminPin} />}
          {activeTab === 'players' && (adminPin ? <Players adminPin={adminPin} /> : <AdminLogin onLogin={handleLogin} />)}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-slate-800 border-t border-slate-700 flex justify-around items-center pb-safe z-50">
        <NavItem 
          icon={<Trophy size={24} />} 
          label="STANDINGS" 
          isActive={activeTab === 'standings'} 
          onClick={() => setActiveTab('standings')} 
        />
        <NavItem 
          icon={<Plus size={24} />} 
          label="ADD MATCH" 
          isActive={activeTab === 'add'} 
          onClick={() => setActiveTab('add')} 
        />
        <NavItem 
          icon={<Calendar size={24} />} 
          label="HISTORY" 
          isActive={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
        />
        <NavItem 
          icon={<Settings size={24} />} 
          label="PLAYERS" 
          isActive={activeTab === 'players'} 
          onClick={() => setActiveTab('players')} 
        />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors ${
        isActive ? 'text-rose-500' : 'text-slate-400 hover:text-slate-300'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </button>
  );
}
