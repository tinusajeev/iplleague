import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function AdminLogin({ onLogin }: { onLogin: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        onLogin(pin);
      } else {
        setError('Invalid PIN');
      }
    } catch (err) {
      setError('Error verifying PIN');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center h-full mt-10">
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 w-full max-w-sm text-center shadow-xl">
        <div className="bg-slate-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 border border-slate-700 shadow-inner">
          <Lock size={36} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Admin Access</h2>
        <p className="text-sm text-slate-400 mb-8">Enter the admin PIN to add matches or edit players.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setError(''); }}
              placeholder="Enter PIN"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-center text-white tracking-[0.5em] text-lg focus:outline-none focus:border-rose-500 transition-colors"
            />
            {error && <p className="text-rose-500 text-sm mt-2 font-medium">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 text-lg"
          >
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
