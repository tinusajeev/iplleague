import { useState, useEffect } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Trash2, Search, Filter, ArrowUpDown } from 'lucide-react';

const TEAM_LOGOS: Record<string, string> = {
  'CSK': 'https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg',
  'MI': 'https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg',
  'RCB': 'https://upload.wikimedia.org/wikipedia/en/2/2a/Royal_Challengers_Bangalore_2020.svg',
  'KKR': 'https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg',
  'SRH': 'https://upload.wikimedia.org/wikipedia/en/8/81/Sunrisers_Hyderabad.svg',
  'DC': 'https://upload.wikimedia.org/wikipedia/en/2/2f/Delhi_Capitals.svg',
  'RR': 'https://upload.wikimedia.org/wikipedia/en/6/60/Rajasthan_Royals_Logo.svg',
  'PBKS': 'https://upload.wikimedia.org/wikipedia/en/d/d4/Punjab_Kings_Logo.svg',
  'GT': 'https://upload.wikimedia.org/wikipedia/en/0/09/Gujarat_Titans_Logo.svg',
  'LSG': 'https://upload.wikimedia.org/wikipedia/en/a/a9/Lucknow_Super_Giants_IPL_Logo.svg'
};

const TEAM_COLORS: Record<string, string> = {
  'CSK': 'F9CD05',
  'MI': '004BA0',
  'RCB': 'EC1C24', // Red
  'KKR': '2E0854',
  'SRH': 'F26522', // Orange
  'DC': '00008B',
  'RR': 'EA1EA8',
  'PBKS': 'DD1F2D',
  'GT': '1B2133',
  'LSG': '0050A0'
};

const getFallbackLogo = (teamName: string) => {
  const abbr = teamName.toUpperCase();
  const color = TEAM_COLORS[abbr] || '718096';
  return `https://ui-avatars.com/api/?name=${abbr}&background=${color}&color=fff&rounded=true&bold=true`;
};

const getTeamLogo = (teamName: string) => {
  const abbr = teamName.toUpperCase();
  return TEAM_LOGOS[abbr] || getFallbackLogo(teamName);
};

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

export default function History({ adminPin }: { adminPin: string | null }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'team'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [deleteMatchId, setDeleteMatchId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMatches = () => {
    fetch(`/api/matches?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMatches();
    fetch(`/api/players?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        const playerMap: Record<number, string> = {};
        data.forEach((p: any) => {
          playerMap[p.id] = p.name;
        });
        setPlayers(playerMap);
      });
  }, []);

  const handleDeleteClick = (id: number) => {
    if (!adminPin) return;
    setDeleteMatchId(id);
  };

  const confirmDelete = async () => {
    if (!adminPin || deleteMatchId === null) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/matches/${deleteMatchId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-pin': adminPin
        }
      });
      if (res.ok) {
        fetchMatches();
        setDeleteMatchId(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete match');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting match');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400 h-full flex items-center justify-center">Loading history...</div>;
  }

  if (matches.length === 0 && !searchTerm) {
    return (
      <div className="p-6 text-center h-full flex flex-col items-center justify-center mt-20">
        <div className="text-6xl mb-4">🏏</div>
        <h2 className="text-xl font-bold text-white mb-2">No matches added yet</h2>
      </div>
    );
  }

  const filteredMatches = matches.filter(match => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (match.matchLabel && match.matchLabel.toLowerCase().includes(searchLower)) ||
      (match.team1 && match.team1.toLowerCase().includes(searchLower)) ||
      (match.team2 && match.team2.toLowerCase().includes(searchLower)) ||
      (match.firstName && match.firstName.toLowerCase().includes(searchLower)) ||
      (match.secondName && match.secondName.toLowerCase().includes(searchLower)) ||
      (match.thirdName && match.thirdName.toLowerCase().includes(searchLower)) ||
      (match.extraName && match.extraName.toLowerCase().includes(searchLower));

    let matchesDate = true;
    if (startDate || endDate) {
      const matchD = match.matchDate ? parseISO(match.matchDate) : parseISO(match.date);
      const start = startDate ? parseISO(startDate) : new Date(2000, 0, 1);
      const end = endDate ? parseISO(endDate) : new Date(2100, 0, 1);
      
      // Set end date to end of day for inclusive filtering
      end.setHours(23, 59, 59, 999);
      
      matchesDate = isWithinInterval(matchD, { start, end });
    }

    let matchesTeamFilter = true;
    if (filterTeam) {
      matchesTeamFilter = (match.team1?.toUpperCase() === filterTeam) || (match.team2?.toUpperCase() === filterTeam);
    }

    return matchesSearch && matchesDate && matchesTeamFilter;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.matchDate ? new Date(a.matchDate).getTime() : new Date(a.date).getTime();
      const dateB = b.matchDate ? new Date(b.matchDate).getTime() : new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      const teamA = (a.team1 || '').toLowerCase();
      const teamB = (b.team1 || '').toLowerCase();
      return sortOrder === 'desc' ? teamB.localeCompare(teamA) : teamA.localeCompare(teamB);
    }
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        📅 Match History
      </h2>
      
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search match, team, or player..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${showFilters ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
          >
            <Filter size={20} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Date Range</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-slate-500">to</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Filter Team</label>
                <select 
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">All Teams</option>
                  {Object.keys(TEAM_LOGOS).map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Sort By</label>
                <div className="flex items-center gap-2">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'team')}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="date">Match Date</option>
                    <option value="team">Team Name</option>
                  </select>
                  <button 
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
                  >
                    <ArrowUpDown size={18} className={sortOrder === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                  </button>
                </div>
              </div>
            </div>
            
            {(startDate || endDate || sortBy !== 'date' || sortOrder !== 'desc' || filterTeam) && (
              <div className="flex justify-end pt-2 border-t border-slate-700">
                <button 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setFilterTeam('');
                    setSortBy('date');
                    setSortOrder('desc');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center text-slate-400 py-10">
          No matches found matching "{searchTerm}"
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => {
            const displayDate = match.matchDate ? new Date(match.matchDate) : new Date(match.date);
            
            let scores: Record<string, any> = {};
            if (match.playerScores) {
              if (typeof match.playerScores === 'string') {
                try { scores = JSON.parse(match.playerScores); } catch (e) {}
              } else {
                scores = match.playerScores;
              }
            }
            
            return (
            <div key={match.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg relative">
              {adminPin && (
                <button 
                  onClick={() => handleDeleteClick(match.id)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors p-2 bg-slate-900/50 rounded-full"
                  title="Delete Match"
                >
                  <Trash2 size={16} />
                </button>
              )}
              
              <div className="flex justify-between items-start mb-3 border-b border-slate-700 pb-3 pr-10">
                <div>
                  <h3 className="text-white font-bold text-lg">{match.matchLabel || 'Match'}</h3>
                  <div className="text-xs text-slate-400 font-medium tracking-wider mt-1">
                    {format(displayDate, 'MMM d, yyyy')}
                  </div>
                </div>
                {match.team1 && match.team2 && (
                  <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <img src={getTeamLogo(match.team1)} alt={match.team1} className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = getFallbackLogo(match.team1); }} />
                      <span className="text-white font-bold text-sm">{match.team1}</span>
                    </div>
                    <span className="text-rose-500 text-[10px] font-black mx-1">VS</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-sm">{match.team2}</span>
                      <img src={getTeamLogo(match.team2)} alt={match.team2} className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = getFallbackLogo(match.team2); }} />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/50 text-amber-500 text-xs overflow-hidden">
                      {match.firstAvatar ? <img src={match.firstAvatar} alt={match.firstName} className="w-full h-full object-cover" /> : '🥇'}
                    </div>
                    <span className="font-bold text-amber-400">{match.firstName}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">+3 pts</span>
                </div>
                
                <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-400/20 flex items-center justify-center border border-slate-400/50 text-slate-300 text-xs overflow-hidden">
                      {match.secondAvatar ? <img src={match.secondAvatar} alt={match.secondName} className="w-full h-full object-cover" /> : '🥈'}
                    </div>
                    <span className="font-bold text-slate-300">{match.secondName}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">+2 pts</span>
                </div>
                
                <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-700/20 flex items-center justify-center border border-orange-700/50 text-orange-500 text-xs overflow-hidden">
                      {match.thirdAvatar ? <img src={match.thirdAvatar} alt={match.thirdName} className="w-full h-full object-cover" /> : '🥉'}
                    </div>
                    <span className="font-bold text-orange-400">{match.thirdName}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">+1 pt</span>
                </div>
                
                {match.extraName && (
                  <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs overflow-hidden ${match.extraPlacePosition === 1 ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : match.extraPlacePosition === 2 ? 'bg-slate-400/20 border-slate-400/50 text-slate-300' : 'bg-orange-700/20 border-orange-700/50 text-orange-500'}`}>
                        {match.extraAvatar ? <img src={match.extraAvatar} alt={match.extraName} className="w-full h-full object-cover" /> : match.extraPlacePosition === 1 ? '🥇' : match.extraPlacePosition === 2 ? '🥈' : '🥉'}
                      </div>
                      <span className={`font-bold ${match.extraPlacePosition === 1 ? 'text-amber-400' : match.extraPlacePosition === 2 ? 'text-slate-300' : 'text-orange-400'}`}>{match.extraName}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">+{match.extraPlacePosition === 1 ? 3 : match.extraPlacePosition === 2 ? 2 : 1} {match.extraPlacePosition === 1 ? 'pts' : match.extraPlacePosition === 2 ? 'pts' : 'pt'}</span>
                  </div>
                )}
              </div>
              
              {Object.keys(scores).length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">My11 Points</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(scores)
                      .sort(([, scoreA], [, scoreB]) => Number(scoreB) - Number(scoreA))
                      .map(([playerId, score]) => {
                      const playerName = players[parseInt(playerId)] || `Player ${playerId}`;
                      return (
                        <div key={playerId} className="bg-slate-900/80 border border-slate-700 px-2 py-1 rounded text-xs flex items-center gap-1.5">
                          <span className="text-slate-300">{playerName}</span>
                          <span className="text-rose-400 font-bold">{Number(score)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteMatchId !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/50">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Match?</h3>
            </div>
            
            <div className="text-slate-300 space-y-3 mb-6">
              <p>Are you absolutely sure you want to delete this match?</p>
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-sm text-rose-200">
                <strong>Warning:</strong> This action cannot be undone. All points, placements, and My11 scores awarded in this match will be permanently deducted from the players' totals.
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteMatchId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
