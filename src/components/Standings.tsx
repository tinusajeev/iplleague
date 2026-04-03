import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface Match {
  id: number;
  date: string;
  matchDate: string;
  matchLabel: string;
  team1: string;
  team2: string;
  firstName: string;
  firstAvatar?: string;
  secondName: string;
  secondAvatar?: string;
  thirdName: string;
  thirdAvatar?: string;
  extraName?: string;
  extraAvatar?: string;
  extraPlacePosition?: number;
  playerScores?: string | Record<string, string | number>;
}

interface Player {
  id: number;
  name: string;
  totalPoints: number;
  matchesPlaced: number;
  matchesPlayed: number;
  totalDream11Points: number;
  avatar?: string;
  firstPlaces?: number;
  secondPlaces?: number;
  thirdPlaces?: number;
}

export default function Standings() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerMatches, setPlayerMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    fetch(`/api/players?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        // Filter out unnamed players who haven't participated
        const activePlayers = data.filter((p: Player) => {
          const isUnnamed = /^Player \d+$/.test(p.name);
          return !(isUnnamed && p.matchesPlaced === 0);
        });
        setPlayers(activePlayers);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-slate-400">Loading leaderboard...</div>;
  }

  const handlePlayerClick = async (player: Player) => {
    setSelectedPlayer(player);
    setLoadingMatches(true);
    try {
      const res = await fetch(`/api/matches?t=${Date.now()}`);
      const data: Match[] = await res.json();
      
      const filtered = data.filter(m => {
        let played = false;
        if (m.playerScores) {
          let scores: Record<string, any> = {};
          if (typeof m.playerScores === 'string') {
            try { scores = JSON.parse(m.playerScores); } catch (e) {}
          } else {
            scores = m.playerScores;
          }
          if (scores[player.id]) played = true;
        }
        
        return played || 
          m.firstName === player.name || 
          m.secondName === player.name || 
          m.thirdName === player.name ||
          m.extraName === player.name;
      });
      
      setPlayerMatches(filtered);
    } catch (err) {
      console.error(err);
    }
    setLoadingMatches(false);
  };

  const totalMatches = players.reduce((max, p) => Math.max(max, p.matchesPlaced), 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          <p className="text-sm text-slate-400">{totalMatches} matches • {players.length} players</p>
        </div>
        <div className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          IPL 2026
        </div>
      </div>

      <div className="space-y-3">
        {players.map((player, index) => {
          const rank = index + 1;
          return (
            <div 
              key={player.id} 
              onClick={() => handlePlayerClick(player)}
              className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors hover:bg-slate-700/50 ${
                rank === 1 ? 'bg-slate-800/80 border-amber-500/30' :
                rank === 2 ? 'bg-slate-800/60 border-slate-400/30' :
                rank === 3 ? 'bg-slate-800/40 border-orange-700/30' :
                'bg-slate-800/20 border-slate-700/50'
              }`}
            >
              <div className="w-8 flex justify-center mr-2">
                {rank === 1 ? <span className="text-2xl">🥇</span> :
                 rank === 2 ? <span className="text-2xl">🥈</span> :
                 rank === 3 ? <span className="text-2xl">🥉</span> :
                 <span className="text-slate-500 font-bold">{rank}</span>}
              </div>
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 shrink-0 overflow-hidden ${
                !player.avatar ? (
                  rank === 1 ? 'bg-red-600' :
                  rank === 2 ? 'bg-amber-600' :
                  rank === 3 ? 'bg-lime-600' :
                  rank === 4 ? 'bg-emerald-600' :
                  rank === 5 ? 'bg-teal-600' :
                  rank === 6 ? 'bg-cyan-600' :
                  rank === 7 ? 'bg-blue-600' :
                  rank === 8 ? 'bg-indigo-600' :
                  rank === 9 ? 'bg-violet-600' :
                  rank === 10 ? 'bg-purple-600' :
                  rank === 11 ? 'bg-fuchsia-600' :
                  rank === 12 ? 'bg-pink-600' :
                  'bg-rose-600'
                ) : 'bg-slate-800'
              }`}>
                {player.avatar ? (
                  <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  player.name.split(' ').length > 1 
                    ? player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : player.name.substring(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">{player.name}</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400 mb-2">
                  <span><strong className="text-slate-300">{player.matchesPlayed || 0}</strong> played</span>
                  <span>•</span>
                  <span><strong className="text-slate-300">{player.matchesPlaced}</strong> placed</span>
                  <span>•</span>
                  <span><strong className="text-rose-400">{player.totalDream11Points || 0}</strong> My11 pts</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded text-xs">
                    <span title="1st Place">🥇</span>
                    <span className="text-amber-500 font-bold">{player.firstPlaces || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-400/10 border border-slate-400/20 px-2 py-1 rounded text-xs">
                    <span title="2nd Place">🥈</span>
                    <span className="text-slate-300 font-bold">{player.secondPlaces || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-orange-700/10 border border-orange-700/20 px-2 py-1 rounded text-xs">
                    <span title="3rd Place">🥉</span>
                    <span className="text-orange-400 font-bold">{player.thirdPlaces || 0}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-2xl font-bold ${
                  rank === 1 ? 'text-amber-400' :
                  rank === 2 ? 'text-slate-300' :
                  rank === 3 ? 'text-orange-400' :
                  'text-white'
                }`}>{player.totalPoints}</span>
                <span className="text-xs text-slate-400 ml-1">pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl my-8 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-white font-bold">
                  {selectedPlayer.avatar ? (
                    <img src={selectedPlayer.avatar} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedPlayer.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{selectedPlayer.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                    <div className="flex gap-2 text-xs text-slate-400">
                      <span><strong className="text-slate-300">{selectedPlayer.matchesPlayed || 0}</strong> played</span>
                      <span>•</span>
                      <span><strong className="text-rose-400">{selectedPlayer.totalDream11Points || 0}</strong> My11 pts</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">
                        <span title="1st Place">🥇</span>
                        <span className="text-amber-500 font-bold">{selectedPlayer.firstPlaces || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-400/10 border border-slate-400/20 px-1.5 py-0.5 rounded text-[10px]">
                        <span title="2nd Place">🥈</span>
                        <span className="text-slate-300 font-bold">{selectedPlayer.secondPlaces || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-orange-700/10 border border-orange-700/20 px-1.5 py-0.5 rounded text-[10px]">
                        <span title="3rd Place">🥉</span>
                        <span className="text-orange-400 font-bold">{selectedPlayer.thirdPlaces || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {loadingMatches ? (
                <div className="text-center text-slate-400 py-10">Loading matches...</div>
              ) : playerMatches.length === 0 ? (
                <div className="text-center text-slate-400 py-10">No matches found for this player.</div>
              ) : (
                <div className="space-y-4">
                  {playerMatches.map(match => {
                    const displayDate = match.matchDate ? new Date(match.matchDate) : new Date(match.date);
                    
                    let myScore = null;
                    if (match.playerScores) {
                      let scores: Record<string, any> = {};
                      if (typeof match.playerScores === 'string') {
                        try { scores = JSON.parse(match.playerScores); } catch (e) {}
                      } else {
                        scores = match.playerScores;
                      }
                      if (scores[selectedPlayer.id] !== undefined) {
                        myScore = scores[selectedPlayer.id];
                      }
                    }
                    
                    return (
                      <div key={match.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 relative">
                        <div className="flex justify-between items-start mb-3 border-b border-slate-700 pb-3">
                          <div>
                            <h4 className="text-white font-bold text-md">{match.matchLabel || 'Match'}</h4>
                            <div className="text-xs text-slate-400 font-medium tracking-wider mt-1">
                              {format(displayDate, 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {match.team1 && match.team2 && (
                              <div className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
                                <span className="text-white font-bold text-xs">{match.team1}</span>
                                <span className="text-rose-500 text-[8px] font-black">VS</span>
                                <span className="text-white font-bold text-xs">{match.team2}</span>
                              </div>
                            )}
                            {myScore !== null && (
                              <div className="bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg text-xs font-bold text-rose-400">
                                {myScore} My11 pts
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-3">
                          <div className={`flex items-center justify-between p-2 rounded-lg ${match.firstName === selectedPlayer.name ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-slate-900/50'}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/50 text-amber-500 text-xs overflow-hidden">
                                {match.firstAvatar ? <img src={match.firstAvatar} alt={match.firstName} className="w-full h-full object-cover" /> : '🥇'}
                              </div>
                              <span className={`font-bold ${match.firstName === selectedPlayer.name ? 'text-amber-400' : 'text-slate-400'}`}>{match.firstName}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">+3 pts</span>
                          </div>
                          
                          <div className={`flex items-center justify-between p-2 rounded-lg ${match.secondName === selectedPlayer.name ? 'bg-slate-400/20 border border-slate-400/30' : 'bg-slate-900/50'}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-slate-400/20 flex items-center justify-center border border-slate-400/50 text-slate-300 text-xs overflow-hidden">
                                {match.secondAvatar ? <img src={match.secondAvatar} alt={match.secondName} className="w-full h-full object-cover" /> : '🥈'}
                              </div>
                              <span className={`font-bold ${match.secondName === selectedPlayer.name ? 'text-slate-200' : 'text-slate-400'}`}>{match.secondName}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">+2 pts</span>
                          </div>
                          
                          <div className={`flex items-center justify-between p-2 rounded-lg ${match.thirdName === selectedPlayer.name ? 'bg-orange-700/20 border border-orange-700/30' : 'bg-slate-900/50'}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-orange-700/20 flex items-center justify-center border border-orange-700/50 text-orange-500 text-xs overflow-hidden">
                                {match.thirdAvatar ? <img src={match.thirdAvatar} alt={match.thirdName} className="w-full h-full object-cover" /> : '🥉'}
                              </div>
                              <span className={`font-bold ${match.thirdName === selectedPlayer.name ? 'text-orange-400' : 'text-slate-400'}`}>{match.thirdName}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">+1 pt</span>
                          </div>
                          
                          {match.extraName && (
                            <div className={`flex items-center justify-between p-2 rounded-lg ${match.extraName === selectedPlayer.name ? (match.extraPlacePosition === 1 ? 'bg-amber-500/20 border border-amber-500/30' : match.extraPlacePosition === 2 ? 'bg-slate-400/20 border border-slate-400/30' : 'bg-orange-700/20 border border-orange-700/30') : 'bg-slate-900/50'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs overflow-hidden ${match.extraPlacePosition === 1 ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : match.extraPlacePosition === 2 ? 'bg-slate-400/20 border-slate-400/50 text-slate-300' : 'bg-orange-700/20 border-orange-700/50 text-orange-500'}`}>
                                  {match.extraAvatar ? <img src={match.extraAvatar} alt={match.extraName} className="w-full h-full object-cover" /> : match.extraPlacePosition === 1 ? '🥇' : match.extraPlacePosition === 2 ? '🥈' : '🥉'}
                                </div>
                                <span className={`font-bold ${match.extraName === selectedPlayer.name ? (match.extraPlacePosition === 1 ? 'text-amber-400' : match.extraPlacePosition === 2 ? 'text-slate-200' : 'text-orange-400') : 'text-slate-400'}`}>{match.extraName}</span>
                              </div>
                              <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">+{match.extraPlacePosition === 1 ? 3 : match.extraPlacePosition === 2 ? 2 : 1} {match.extraPlacePosition === 1 ? 'pts' : match.extraPlacePosition === 2 ? 'pts' : 'pt'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
