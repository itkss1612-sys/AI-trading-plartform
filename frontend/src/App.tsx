import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import {
  MarketOverviewResponse,
  InstrumentItem,
  Quote,
  Candle,
  IndicatorDataset,
  AnalysisSummary,
  SMCStructure
} from './types';

import { TopStatusBar } from './components/TopStatusBar';
import { Sidebar } from './components/Sidebar';
import { WatchlistPanel } from './components/WatchlistPanel';
import { InteractiveChart } from './components/InteractiveChart';
import { AnalysisPanel } from './components/AnalysisPanel';
import { RiskPlanner } from './components/RiskPlanner';
import { TradingJournalView } from './components/TradingJournalView';
import { SMCScannerView } from './components/SMCScannerView';
import { OptionsChainView } from './components/OptionsChainView';
import { StrategyLabView } from './components/StrategyLabView';

export function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<'DASHBOARD' | 'SCANNER' | 'RISK' | 'JOURNAL' | 'OPTIONS' | 'STRATEGY'>('DASHBOARD');

  // Selected Instrument & Timeframe
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE.NS');
  const [timeframe, setTimeframe] = useState<string>('1d');

  // Market Data State
  const [marketOverview, setMarketOverview] = useState<MarketOverviewResponse | null>(null);
  const [instruments, setInstruments] = useState<InstrumentItem[]>([]);
  const [quotesMap, setQuotesMap] = useState<Record<string, Quote>>({});
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDataset | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [fvgs, setFvgs] = useState<SMCStructure[]>([]);

  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);

  // 1. Initial Load: Market Overview & Master Instruments
  useEffect(() => {
    api.getMarketOverview()
      .then(setMarketOverview)
      .catch(err => console.error('Error fetching market overview:', err));

    api.searchInstruments()
      .then(instList => {
        setInstruments(instList);
        // Pre-fetch quotes for top 8 instruments
        const topSymbols = instList.slice(0, 8).map(i => i.symbol);
        topSymbols.forEach(sym => {
          api.getQuote(sym)
            .then(q => {
              setQuotesMap(prev => ({ ...prev, [sym]: q }));
            })
            .catch(console.error);
        });
      })
      .catch(err => console.error('Error fetching instruments:', err));

    // Polling interval for market overview (every 30 seconds)
    const interval = setInterval(() => {
      api.getMarketOverview().then(setMarketOverview).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 2. Fetch Chart Candles & Indicators when symbol or timeframe changes
  useEffect(() => {
    setIsLoadingChart(true);
    setIsLoadingSummary(true);

    // Fetch quote for selected symbol
    api.getQuote(selectedSymbol)
      .then(q => setQuotesMap(prev => ({ ...prev, [selectedSymbol]: q })))
      .catch(console.error);

    // Fetch candles
    api.getHistory(selectedSymbol, timeframe, '6mo')
      .then(data => {
        setCandles(data);
        setIsLoadingChart(false);
      })
      .catch(err => {
        console.error('Error fetching candles:', err);
        setIsLoadingChart(false);
      });

    // Fetch Technical Indicators
    api.getIndicators(selectedSymbol, timeframe, '6mo')
      .then(setIndicators)
      .catch(console.error);

    // Fetch Analysis Summary & SMC
    api.getAnalysisSummary(selectedSymbol, timeframe)
      .then(summary => {
        setAnalysisSummary(summary);
        if (summary.unmitigated_fvgs) {
          setFvgs(summary.unmitigated_fvgs);
        }
        setIsLoadingSummary(false);
      })
      .catch(err => {
        console.error('Error fetching analysis summary:', err);
        setIsLoadingSummary(false);
      });
  }, [selectedSymbol, timeframe]);

  const activeQuote = quotesMap[selectedSymbol];
  const activePrice = activeQuote ? activeQuote.last_price : (candles.length > 0 ? candles[candles.length - 1].close : 1000);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0e14] text-slate-100 antialiased">
      {/* Top Market Status Banner */}
      <TopStatusBar overview={marketOverview} selectedSymbol={selectedSymbol} />

      {/* Main Terminal Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Nav Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-hidden">
          {currentTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 md:grid-cols-12 h-full gap-2 p-2 overflow-y-auto lg:overflow-hidden">
              {/* Left Column: Watchlist (col-span-2) */}
              <div className="md:col-span-3 lg:col-span-2 h-[350px] md:h-full">
                <WatchlistPanel
                  instruments={instruments}
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={setSelectedSymbol}
                  quotesMap={quotesMap}
                />
              </div>

              {/* Center Column: Interactive Financial Chart & Analysis Summary (col-span-7) */}
              <div className="md:col-span-9 lg:col-span-7 flex flex-col h-full space-y-2">
                {/* Main Interactive Chart */}
                <div className="flex-1 min-h-[380px]">
                  <InteractiveChart
                    candles={candles}
                    symbol={selectedSymbol}
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    indicators={indicators}
                    fvgs={fvgs}
                    isLoading={isLoadingChart}
                  />
                </div>

                {/* Bottom Analysis & Key Levels Drawer */}
                <div className="h-[220px] shrink-0">
                  <AnalysisPanel
                    summary={analysisSummary}
                    isLoading={isLoadingSummary}
                  />
                </div>
              </div>

              {/* Right Column: Institutional Risk Management & Trade Planner (col-span-3) */}
              <div className="md:col-span-12 lg:col-span-3 h-full">
                <RiskPlanner
                  symbol={selectedSymbol}
                  currentPrice={activePrice}
                />
              </div>
            </div>
          )}

          {currentTab === 'SCANNER' && (
            <SMCScannerView
              instruments={instruments}
              onSelectInstrument={sym => {
                setSelectedSymbol(sym);
                setCurrentTab('DASHBOARD');
              }}
            />
          )}

          {currentTab === 'RISK' && (
            <div className="h-full p-4 max-w-4xl mx-auto">
              <RiskPlanner
                symbol={selectedSymbol}
                currentPrice={activePrice}
              />
            </div>
          )}

          {currentTab === 'JOURNAL' && (
            <TradingJournalView />
          )}

          {currentTab === 'OPTIONS' && (
            <OptionsChainView
              symbol={selectedSymbol}
              underlyingPrice={activePrice}
            />
          )}

          {currentTab === 'STRATEGY' && (
            <StrategyLabView />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
