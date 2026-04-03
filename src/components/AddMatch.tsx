import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

interface Player {
  id: number;
  name: string;
}

const IPL_TEAMS = ['CSK', 'DC', 'GT', 'KKR', 'LSG', 'MI', 'PBKS', 'RR', 'RCB', 'SRH'];

export default function AddMatch({ adminPin, onMatchAdded }: { adminPin: string, onMatchAdded: () => void }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchLabel, setMatchLabel] = useState('');
  const [matchDate, setMatchDate] = useState<Date>(new Date());
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [firstPlace, setFirstPlace] = useState('');
  const [secondPlace, setSecondPlace] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [extraPlace, setExtraPlace] = useState('');
  const [extraPosition, setExtraPosition] = useState('3');
  const [playerScores, setPlayerScores] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetch(`/api/players?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setPlayers(data));
      
    fetch(`/api/draft?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          if (data.matchLabel) setMatchLabel(data.matchLabel);
          if (data.matchDate) setMatchDate(new Date(data.matchDate));
          if (data.team1) setTeam1(data.team1);
          if (data.team2) setTeam2(data.team2);
          if (data.firstPlace) setFirstPlace(data.firstPlace);
          if (data.secondPlace) setSecondPlace(data.secondPlace);
          if (data.thirdPlace) setThirdPlace(data.thirdPlace);
          if (data.showExtra !== undefined) setShowExtra(data.showExtra);
          if (data.extraPlace) setExtraPlace(data.extraPlace);
          if (data.extraPosition) setExtraPosition(data.extraPosition);
          if (data.playerScores) setPlayerScores(data.playerScores);
        }
        setInitialLoad(false);
      })
      .catch(() => setInitialLoad(false));
  }, []);

  useEffect(() => {
    if (initialLoad) return;
    
    const saveDraft = async () => {
      try {
        await fetch('/api/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchLabel, matchDate: matchDate.toISOString(), team1, team2, 
            firstPlace, secondPlace, thirdPlace, showExtra, extraPlace, 
            extraPosition, playerScores
          })
        });
      } catch (e) {}
    };
    
    const timeoutId = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timeoutId);
  }, [matchLabel, matchDate, team1, team2, firstPlace, secondPlace, thirdPlace, showExtra, extraPlace, extraPosition, playerScores, initialLoad]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchLabel || !matchDate || !team1 || !team2 || !firstPlace || !secondPlace || !thirdPlace) {
      alert('Please fill in all fields');
      return;
    }
    if (showExtra && !extraPlace) {
      alert('Please select the tie-breaker player');
      return;
    }
    if (team1 === team2) {
      alert('Teams must be different');
      return;
    }
    
    const selectedPlayers = [firstPlace, secondPlace, thirdPlace];
    if (showExtra && extraPlace) selectedPlayers.push(extraPlace);
    if (new Set(selectedPlayers).size !== selectedPlayers.length) {
      alert('Players must be unique for each place');
      return;
    }

    const scoresToSubmit: Record<number, number> = {};
    for (const [id, score] of Object.entries(playerScores)) {
      if (score !== undefined && score !== null && String(score).trim() !== '') {
        const num = parseFloat(String(score));
        if (!isNaN(num)) {
          scoresToSubmit[parseInt(id)] = num;
        }
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin
        },
        body: JSON.stringify({
          matchLabel,
          matchDate: format(matchDate, 'yyyy-MM-dd'),
          team1,
          team2,
          firstPlaceId: parseInt(firstPlace),
          secondPlaceId: parseInt(secondPlace),
          thirdPlaceId: parseInt(thirdPlace),
          extraPlaceId: showExtra && extraPlace ? parseInt(extraPlace) : null,
          extraPlacePosition: showExtra && extraPlace ? parseInt(extraPosition) : null,
          playerScores: Object.keys(scoresToSubmit).length > 0 ? scoresToSubmit : null
        })
      });
      if (res.ok) {
        // Clear draft
        await fetch('/api/draft', { method: 'DELETE' });
        
        // Reset state
        setMatchLabel('');
        setMatchDate(new Date());
        setTeam1('');
        setTeam2('');
        setFirstPlace('');
        setSecondPlace('');
        setThirdPlace('');
        setShowExtra(false);
        setExtraPlace('');
        setExtraPosition('3');
        setPlayerScores({});
        
        onMatchAdded();
      } else {
        const errorData = await res.json().catch(() => null);
        alert(`Failed to add match: ${errorData?.error || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error adding match: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Match Label & Date */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
          <div>
            <label className="block text-slate-400 text-xs font-bold tracking-wider mb-2 uppercase">
              Match Label
            </label>
            <input 
              type="text"
              value={matchLabel}
              onChange={e => setMatchLabel(e.target.value)}
              placeholder="e.g. MI vs CSK, Match 1"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-bold tracking-wider mb-2 uppercase">
              Match Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-slate-400" />
              </div>
              <DatePicker
                selected={matchDate}
                onChange={(date: Date | null) => date && setMatchDate(date)}
                dateFormat="MMMM d, yyyy"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-3 text-white focus:outline-none focus:border-rose-500"
                wrapperClassName="w-full"
                popperClassName="!z-50"
                withPortal
              />
            </div>
          </div>
        </div>

        {/* Teams Playing */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <label className="block text-slate-400 text-xs font-bold tracking-wider mb-2 uppercase">
            Teams Playing
          </label>
          <div className="flex items-center gap-3">
            <select 
              value={team1} 
              onChange={e => setTeam1(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500"
            >
              <option value="">Select Team</option>
              {IPL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-rose-500 font-bold text-lg">VS</span>
            <select 
              value={team2} 
              onChange={e => setTeam2(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500"
            >
              <option value="">Select Team</option>
              {IPL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Top 3 Predictors */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <label className="block text-slate-400 text-xs font-bold tracking-wider mb-4 uppercase">
            Top 3 Predictors
          </label>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                🥇
              </div>
              <select 
                value={firstPlace} 
                onChange={e => setFirstPlace(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Select 1st (3 pts) --</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-400/20 flex items-center justify-center border border-slate-400/50 text-slate-300 shadow-[0_0_10px_rgba(148,163,184,0.2)]">
                🥈
              </div>
              <select 
                value={secondPlace} 
                onChange={e => setSecondPlace(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-slate-400"
              >
                <option value="">-- Select 2nd (2 pts) --</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-700/20 flex items-center justify-center border border-orange-700/50 text-orange-500 shadow-[0_0_10px_rgba(194,65,12,0.2)]">
                🥉
              </div>
              <select 
                value={thirdPlace} 
                onChange={e => setThirdPlace(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">-- Select 3rd (1 pt) --</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer mb-3">
              <input 
                type="checkbox" 
                checked={showExtra}
                onChange={e => {
                  setShowExtra(e.target.checked);
                  if (!e.target.checked) setExtraPlace('');
                }}
                className="w-4 h-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500 bg-slate-900"
              />
              <span className="text-sm font-bold">Add Tie-Breaker (4th Player)</span>
            </label>
            
            {showExtra && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <select
                  value={extraPosition}
                  onChange={e => setExtraPosition(e.target.value)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="1">1st Tie (3 pts)</option>
                  <option value="2">2nd Tie (2 pts)</option>
                  <option value="3">3rd Tie (1 pt)</option>
                </select>
                
                <select 
                  value={extraPlace} 
                  onChange={e => setExtraPlace(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Select Player --</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* My11 Scores */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <label className="block text-slate-400 text-xs font-bold tracking-wider mb-4 uppercase">
            My11 Points (Optional)
          </label>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                <span className="text-slate-300 font-medium text-sm">{player.name}</span>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Points"
                  value={playerScores[player.id] ?? ''}
                  onChange={e => setPlayerScores(prev => ({ ...prev, [player.id]: e.target.value }))}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-right focus:outline-none focus:border-rose-500 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg py-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
        >
          ✅ {loading ? 'Saving...' : 'Save Match Result'}
        </button>
      </form>
    </div>
  );
}
