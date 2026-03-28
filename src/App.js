import React, { useState, useEffect } from 'react';

const API_BASE = 'https://nepse-diary-api.onrender.com/api';

const formatNum = (num) => parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatInt = (num) => parseInt(num).toLocaleString('en-IN');

export default function App() {
  const [summaryData, setSummaryData] = useState({
    total_invested: 0,
    total_current_value: 0,
    total_unrealized_pl: 0,
    total_pl_pct: 0,
  });
  const [portfolioData, setPortfolioData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('Sync Market');

  useEffect(() => {
    fetchActivePortfolio();
  }, []);

  const fetchActivePortfolio = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/active_portfolio`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const json = await response.json();
      if (json.summary) setSummaryData(json.summary);
      if (json.data) setPortfolioData(json.data);
    } catch (error) {
      console.error("API Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Triggering GitHub...');
    try {
      const response = await fetch(`${API_BASE}/sync`, { method: 'POST' });
      if (response.ok) {
        setSyncMessage('✅ Sync Started!');
        setTimeout(() => { fetchActivePortfolio(); }, 45000);
      } else {
        throw new Error("Backend failed to trigger sync.");
      }
    } catch (error) {
      setSyncMessage('⚠️ Sync Failed');
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncMessage('Sync Market');
      }, 5000);
    }
  };

  const isTotalProfit = summaryData.total_unrealized_pl >= 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-10">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 md:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20 text-sm md:text-base">ND</div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">NEPSE Diary</h1>
        </div>
        
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-md transition-all border flex items-center gap-2 
            ${isSyncing 
              ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 cursor-not-allowed' 
              : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'}`}
        >
          <span>{isSyncing ? '⏳' : '🔄'}</span> 
          <span className="hidden xs:inline">{syncMessage}</span>
          <span className="xs:hidden">{isSyncing ? 'Wait' : 'Sync'}</span>
        </button>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        
        {/* SUMMARY CARDS: 1 column on mobile, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <SummaryCard title="Total Invested" value={summaryData.total_invested} loading={isLoading} />
          <SummaryCard title="Current Value" value={summaryData.total_current_value} loading={isLoading} highlight />
          <SummaryCard 
            title="Unrealized P&L" 
            value={summaryData.total_unrealized_pl} 
            pct={summaryData.total_pl_pct} 
            loading={isLoading} 
            isPnl 
          />
        </div>

        {/* --- PORTFOLIO DATA --- */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-300">Active Holdings</h2>
          <span className="text-xs text-slate-500 font-mono">{portfolioData.length} Stocks</span>
        </div>

        {/* DESKTOP TABLE VIEW (Visible on screens > 768px) */}
        <div className="hidden md:block bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Symbol</th>
                <th className="px-6 py-4 font-semibold text-right">Qty</th>
                <th className="px-6 py-4 font-semibold text-right">WACC</th>
                <th className="px-6 py-4 font-semibold text-right">LTP</th>
                <th className="px-6 py-4 font-semibold text-right">Current Val</th>
                <th className="px-6 py-4 font-semibold text-right">P&L</th>
                <th className="px-6 py-4 font-semibold text-right">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? <StatusRow message="Fetching from Render API..." pulse /> :
               isSyncing ? <StatusRow message="🚀 Syncing... Refreshes in 45s" pulse color="text-emerald-400" /> :
               portfolioData.length === 0 ? <StatusRow message="No active holdings found." /> :
               portfolioData.map((stock, i) => <DesktopRow key={i} stock={stock} />)}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (Visible on screens < 768px) */}
        <div className="md:hidden space-y-4">
          {isLoading ? <div className="text-center py-10 animate-pulse text-slate-500">Loading Mobile View...</div> :
           isSyncing ? <div className="text-center py-10 animate-pulse text-emerald-500">Syncing...</div> :
           portfolioData.length === 0 ? <div className="text-center py-10 text-slate-500">No data.</div> :
           portfolioData.map((stock, i) => <MobileCard key={i} stock={stock} />)}
        </div>

      </main>
    </div>
  );
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

function SummaryCard({ title, value, pct, loading, highlight, isPnl }) {
  const isProfit = value >= 0;
  return (
    <div className={`p-5 rounded-xl border border-slate-700 bg-slate-800/50 shadow-sm ${highlight ? 'border-t-4 border-t-emerald-500' : ''}`}>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
      <div className="flex items-baseline justify-between">
        <h3 className={`text-2xl font-bold ${isPnl && !loading ? (isProfit ? 'text-emerald-400' : 'text-rose-500') : 'text-white'}`}>
          {loading ? '...' : `Rs. ${formatNum(value)}`}
        </h3>
        {isPnl && !loading && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
            {isProfit ? '+' : ''}{formatNum(pct)}%
          </span>
        )}
      </div>
    </div>
  );
}

function DesktopRow({ stock }) {
  const isProfit = stock.pl_amt >= 0;
  return (
    <tr className="hover:bg-slate-700/20 transition-colors">
      <td className="px-6 py-4 font-bold text-white"><span className="bg-slate-700/50 px-2 py-1 rounded">{stock.symbol}</span></td>
      <td className="px-6 py-4 text-right text-slate-300">{formatInt(stock.net_qty)}</td>
      <td className="px-6 py-4 text-right text-slate-300">{formatNum(stock.wacc)}</td>
      <td className="px-6 py-4 text-right font-bold text-white">{formatNum(stock.ltp)}</td>
      <td className="px-6 py-4 text-right text-slate-300">{formatNum(stock.current_val)}</td>
      <td className={`px-6 py-4 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-500'}`}>
        {isProfit ? '+' : ''}{formatNum(stock.pl_amt)}<br/>
        <span className="text-xs opacity-70">{formatNum(stock.pl_pct)}%</span>
      </td>
      <td className="px-6 py-4 text-right text-slate-400">{formatNum(stock.weight)}%</td>
    </tr>
  );
}

function MobileCard({ stock }) {
  const isProfit = stock.pl_amt >= 0;
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-lg font-black text-white">{stock.symbol}</span>
          <p className="text-xs text-slate-500 mt-0.5">Qty: {formatInt(stock.net_qty)} | WACC: {formatNum(stock.wacc)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase font-semibold">LTP</p>
          <p className="text-base font-bold text-white">Rs. {formatNum(stock.ltp)}</p>
        </div>
      </div>
      <div className={`flex justify-between items-center p-2 rounded-md ${isProfit ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-rose-500/5 border border-rose-500/20'}`}>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Net P&L</span>
        <div className={`text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-500'}`}>
          {isProfit ? '+' : ''}{formatNum(stock.pl_amt)} ({formatNum(stock.pl_pct)}%)
        </div>
      </div>
    </div>
  );
}

function StatusRow({ message, pulse, color = "text-slate-400" }) {
  return (
    <tr>
      <td colSpan="8" className={`px-6 py-12 text-center ${color} ${pulse ? 'animate-pulse' : ''}`}>{message}</td>
    </tr>
  );
}