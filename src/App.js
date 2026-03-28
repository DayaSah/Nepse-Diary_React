import React, { useState, useEffect } from 'react';

const API_BASE = 'https://nepse-diary-api.onrender.com/api';

const formatNum = (num) => parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatInt = (num) => parseInt(num).toLocaleString('en-IN');

export default function App() {
  // --- APP MEMORY (STATE) ---
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

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    fetchActivePortfolio();
  }, []);

  // --- API: LOAD PORTFOLIO ---
  const fetchActivePortfolio = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/active_portfolio`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const json = await response.json();
      
      // Update state with your Render API data
      if (json.summary) setSummaryData(json.summary);
      if (json.data) setPortfolioData(json.data);
      
    } catch (error) {
      console.error("API Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- API: SYNC GITHUB ACTION ---
  const handleSync = async () => {
    if (isSyncing) return; // Prevent double-clicks
    
    setIsSyncing(true);
    setSyncMessage('Triggering GitHub...');

    try {
      const response = await fetch(`${API_BASE}/sync`, { method: 'POST' });
      
      if (response.ok) {
        setSyncMessage('✅ Sync Started!');
        
        // Wait 45 seconds for GitHub Actions to finish, then reload table
        setTimeout(() => {
          fetchActivePortfolio();
        }, 45000);
      } else {
        throw new Error("Backend failed to trigger sync.");
      }
    } catch (error) {
      console.error("Sync Error:", error);
      setSyncMessage('⚠️ Sync Failed');
    } finally {
      // Reset button UI after 5 seconds
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
      <nav className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">ND</div>
          <h1 className="text-xl font-bold tracking-tight text-white">NEPSE Diary</h1>
        </div>
        
        {/* SYNC BUTTON */}
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors border flex items-center gap-2 
            ${isSyncing 
              ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 cursor-not-allowed' 
              : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'}`}
        >
          <span>{isSyncing ? '⏳' : '🔄'}</span> 
          {syncMessage}
        </button>
      </nav>

      {/* --- MAIN DASHBOARD AREA --- */}
      <main className="p-6 max-w-7xl mx-auto mt-4">
        
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl shadow-sm">
            <p className="text-slate-400 text-sm font-medium mb-1">Total Invested</p>
            <h3 className="text-2xl font-bold">Rs. {isLoading ? '...' : formatNum(summaryData.total_invested)}</h3>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl border-t-4 border-t-emerald-500 shadow-sm">
            <p className="text-slate-400 text-sm font-medium mb-1">Current Value</p>
            <h3 className="text-2xl font-bold text-white">Rs. {isLoading ? '...' : formatNum(summaryData.total_current_value)}</h3>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl shadow-sm">
            <p className="text-slate-400 text-sm font-medium mb-1">Unrealized P&L</p>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-2xl font-bold ${isTotalProfit && !isLoading ? 'text-emerald-400' : isLoading ? 'text-white' : 'text-rose-500'}`}>
                {isTotalProfit && !isLoading ? '+' : ''}Rs. {isLoading ? '...' : formatNum(summaryData.total_unrealized_pl)}
              </h3>
              {!isLoading && (
                 <span className={`text-sm font-bold px-2 py-0.5 rounded bg-slate-900/80 ${isTotalProfit ? 'text-emerald-400' : 'text-rose-500'}`}>
                   {isTotalProfit ? '+' : ''}{formatNum(summaryData.total_pl_pct)}%
                 </span>
              )}
            </div>
          </div>
        </div>

        {/* --- PORTFOLIO TABLE --- */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Symbol</th>
                  <th className="px-6 py-4 font-semibold text-right">Qty</th>
                  <th className="px-6 py-4 font-semibold text-right">WACC</th>
                  <th className="px-6 py-4 font-semibold text-right">Breakeven</th>
                  <th className="px-6 py-4 font-semibold text-right">LTP</th>
                  <th className="px-6 py-4 font-semibold text-right">Current Val</th>
                  <th className="px-6 py-4 font-semibold text-right">P&L</th>
                  <th className="px-6 py-4 font-semibold text-right">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-400 animate-pulse">Fetching from Render API...</td>
                  </tr>
                ) : portfolioData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-400">No active holdings found.</td>
                  </tr>
                ) : (
                  portfolioData.map((stock, index) => {
                    const isProfit = stock.pl_amt >= 0;
                    const textColor = isProfit ? 'text-emerald-400' : 'text-rose-500';
                    const bgColor = isProfit ? 'bg-emerald-500/10' : 'bg-rose-500/10';
                    const sign = isProfit ? '+' : '';
                    
                    return (
                      <tr key={stock.symbol || index} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">
                           <span className="bg-slate-700/50 px-2 py-1 rounded">{stock.symbol}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-300">{formatInt(stock.net_qty)}</td>
                        <td className="px-6 py-4 text-right text-slate-300">Rs. {formatNum(stock.wacc)}</td>
                        <td className="px-6 py-4 text-right text-slate-400">Rs. {formatNum(stock.breakeven)}</td>
                        <td className="px-6 py-4 text-right font-bold text-white">Rs. {formatNum(stock.ltp)}</td>
                        <td className="px-6 py-4 text-right text-slate-300">Rs. {formatNum(stock.current_val)}</td>
                        
                        {/* Beautifully styled P&L column */}
                        <td className={`px-6 py-4 text-right font-bold ${textColor} ${bgColor}`}>
                          {sign}Rs. {formatNum(stock.pl_amt)} <br/>
                          <span className="text-xs opacity-90">{sign}{formatNum(stock.pl_pct)}%</span>
                        </td>
                        
                        <td className="px-6 py-4 text-right text-slate-400">{formatNum(stock.weight)}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}