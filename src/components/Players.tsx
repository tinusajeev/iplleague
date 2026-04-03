import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Check, ImagePlus } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  avatar?: string;
}

export default function Players({ adminPin }: { adminPin: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/players?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        // Sort by ID to keep the player numbers consistent
        setPlayers(data.sort((a: Player, b: Player) => a.id - b.id));
        setLoading(false);
      });
  }, []);

  const handleNameChange = (id: number, newName: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const saveName = async (id: number, name: string) => {
    setSavingId(id);
    try {
      await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin
        },
        body: JSON.stringify({ name })
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save name');
    }
    setSavingId(null);
  };

  const handleAvatarUpload = async (id: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Compress/resize image before uploading
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        setUploadingId(id);
        try {
          const player = players.find(p => p.id === id);
          await fetch(`/api/players/${id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'x-admin-pin': adminPin
            },
            body: JSON.stringify({ name: player?.name, avatar: dataUrl })
          });
          
          setPlayers(players.map(p => p.id === id ? { ...p, avatar: dataUrl } : p));
        } catch (err) {
          console.error(err);
          alert('Failed to upload avatar');
        }
        setUploadingId(null);
      };
    };
  };

  const handleAddPlayer = async () => {
    setIsAdding(true);
    try {
      const newName = `Player ${players.length + 1}`;
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin
        },
        body: JSON.stringify({ name: newName })
      });
      
      if (res.ok) {
        const data = await fetch(`/api/players?t=${Date.now()}`).then(r => r.json());
        setPlayers(data.sort((a: Player, b: Player) => a.id - b.id));
      } else {
        alert('Failed to add player');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add player');
    }
    setIsAdding(false);
  };

  const handleDeletePlayer = async (id: number) => {
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-pin': adminPin
        }
      });
      
      if (res.ok) {
        setPlayers(players.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete player');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete player');
    }
    setConfirmDeleteId(null);
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">Loading players...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-sky-400">⚙️</span> Edit Player Names
      </h2>
      
      <div className="space-y-3">
        {players.map((player, index) => (
          <div key={player.id} className="flex items-center gap-3">
            <div 
              className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden group ${
                !player.avatar ? (
                  index % 13 === 0 ? 'bg-red-600' :
                  index % 13 === 1 ? 'bg-amber-600' :
                  index % 13 === 2 ? 'bg-lime-600' :
                  index % 13 === 3 ? 'bg-emerald-600' :
                  index % 13 === 4 ? 'bg-teal-600' :
                  index % 13 === 5 ? 'bg-cyan-600' :
                  index % 13 === 6 ? 'bg-blue-600' :
                  index % 13 === 7 ? 'bg-indigo-600' :
                  index % 13 === 8 ? 'bg-violet-600' :
                  index % 13 === 9 ? 'bg-purple-600' :
                  index % 13 === 10 ? 'bg-fuchsia-600' :
                  index % 13 === 11 ? 'bg-pink-600' :
                  'bg-rose-600'
                ) : 'bg-slate-800'
              }`}
            >
              {player.avatar ? (
                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                index + 1
              )}
              
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingId === player.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="flex gap-2">
                    <button
                      className="text-white hover:text-sky-400 p-1"
                      title="Upload avatar"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => {
                          if (e.target.files && e.target.files[0]) {
                            handleAvatarUpload(player.id, e.target.files[0]);
                          }
                        };
                        input.click();
                      }}
                    >
                      <ImagePlus size={16} />
                    </button>
                    {player.avatar && (
                      <button 
                        className="text-rose-400 hover:text-rose-500 p-1"
                        title="Remove avatar"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (confirm('Remove avatar?')) {
                            setUploadingId(player.id);
                            fetch(`/api/players/${player.id}`, {
                              method: 'PUT',
                              headers: { 
                                'Content-Type': 'application/json',
                                'x-admin-pin': adminPin
                              },
                              body: JSON.stringify({ name: player.name, avatar: null })
                            }).then(() => {
                              setPlayers(players.map(p => p.id === player.id ? { ...p, avatar: undefined } : p));
                              setUploadingId(null);
                            }).catch(err => {
                              console.error(err);
                              alert('Failed to remove avatar');
                              setUploadingId(null);
                            });
                          }
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={player.name}
                onChange={(e) => handleNameChange(player.id, e.target.value)}
                onBlur={() => saveName(player.id, player.name)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                placeholder={`Player ${index + 1}`}
              />
              {savingId === player.id && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-400">
                  Saving...
                </div>
              )}
            </div>
            
            {confirmDeleteId === player.id ? (
              <div className="flex items-center gap-1 ml-1">
                <button 
                  onClick={() => handleDeletePlayer(player.id)} 
                  className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                  title="Confirm Delete"
                >
                  <Check size={18} />
                </button>
                <button 
                  onClick={() => setConfirmDeleteId(null)} 
                  className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setConfirmDeleteId(player.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
                title="Delete Player"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleAddPlayer}
        disabled={isAdding}
        className="mt-6 w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={20} />
        {isAdding ? 'Adding...' : 'Add New Player'}
      </button>
    </div>
  );
}
