import React, { useState, useEffect } from 'react';

const API_BASE = 'https://nepse-diary-api.onrender.com/api';
const formatNum = (num) => parseFloat(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio'); 
  const [portfolioData, setPortfolioData] = useState([]);
  const [history, setHistory] = useState({ realized: [], unsettled: [], ledger: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([
        fetch(`${API_BASE}/active_portfolio`),
        fetch(`${API_BASE}/trade_history`)
      ]);
      const pJson = await pRes.json();
      const hJson = await hRes.json();
      setPortfolioData(pJson.data || []);
      setHistory(hJson);
    } catch (e) { console.error("Fetch error:", e); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-10">
      {/* HEADER & TAB NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-white">ND</div>
          <h1 className="text-lg font-bold">Terminal</h1>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full no-scrollbar">
          {['portfolio', 'realized', 'settlements', 'ledger'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="text-center py-20 animate-pulse text-slate-500 font-mono">INITIALIZING ANALYTICS...</div>
        ) : (
          <div className="animate-in fade-in duration-500">
            
            {/* 📈 TAB: ACTIVE PORTFOLIO */}
            {activeTab === 'portfolio' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioData.map((s, i) => <StockCard key={i} stock={s} />)}
              </div>
            )}

            {/* 🏆 TAB: REALIZED HISTORY */}
            {activeTab === 'realized' && (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-800/30">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-950 text-slate-500 text-xs uppercase tracking-widest">
                    <tr>
                      <th className="p-4">Symbol</th>
                      <th className="p-4">Qty</th>
                      <th className="p-4">Buy Date</th>
                      <th className="p-4">Sell Date</th>
                      <th className="p-4 text-right">Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {history.realized.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-white">{row.symbol}</td>
                        <td className="p-4 text-slate-400">{row.qty}</td>
                        <td className="p-4 text-xs text-slate-500">{row.buy_date}</td>
                        <td className="p-4 text-xs text-slate-500">{row.sell_date}</td>
                        <td className={`p-4 text-right font-mono font-bold ${row.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {row.pnl >= 0 ? '+' : ''}Rs. {formatNum(row.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ⏳ TAB: SETTLEMENTS */}
            {activeTab === 'settlements' && (
              <div className="space-y-4">
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <p className="text-emerald-400 text-sm font-bold uppercase mb-1">T+2 Settlement Status</p>
                    <p className="text-slate-400 text-xs italic">Only transactions from the last 3 days are shown as "Pending".</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {history.unsettled.map((trx, i) => (
                        <div key={i} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold text-slate-500 uppercase">{trx.transaction_type}</span>
                                <p className="font-bold text-lg">{trx.symbol}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-amber-500 text-xs font-black animate-pulse uppercase">⏳ Unsettled</span>
                                <p className="text-white font-mono">Rs. {formatNum(trx.total_invested || trx.total_received)}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            )}

            {/* 📜 TAB: MASTER LEDGER */}
            {activeTab === 'ledger' && (
              <div className="bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 sticky top-0 text-slate-500 p-4 border-b border-slate-800">
                            <tr><th className="p-4">Date</th><th className="p-4">Trx</th><th className="p-4">Symbol</th><th className="p-4 text-right">Total</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                            {history.ledger.map((l, i) => (
                                <tr key={i} className="hover:bg-slate-800/20">
                                    <td className="p-4 text-slate-500">{l.date}</td>
                                    <td className={`p-4 font-bold ${l.transaction_type === 'BUY' ? 'text-blue-400' : 'text-orange-400'}`}>{l.transaction_type}</td>
                                    <td className="p-4 font-bold text-white">{l.symbol}</td>
                                    <td className="p-4 text-right font-mono text-slate-300">Rs. {formatNum(l.total_invested || l.total_received)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

// Minimal Card Component
function StockCard({ stock }) {
  const isProfit = stock.pl_amt >= 0;
  return (
    <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700 hover:border-emerald-500/40 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-black tracking-tighter group-hover:text-emerald-400 transition-colors">{stock.symbol}</h3>
        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
           {formatNum(stock.pl_pct)}%
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Net Value</p>
            <p className="text-lg font-bold text-slate-200">Rs. {formatNum(stock.current_val)}</p>
        </div>
        <div className="text-right">
            <p className={`text-sm font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-500'}`}>
                {isProfit ? '+' : ''}{formatNum(stock.pl_amt)}
            </p>
        </div>
      </div>
    </div>
  );
}