import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Candle, IndicatorDataset, SMCStructure } from '../types';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw, Layers } from 'lucide-react';

interface ChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  indicators?: IndicatorDataset | null;
  fvgs?: SMCStructure[];
  orderBlocks?: SMCStructure[];
  isLoading?: boolean;
}

export const InteractiveChart: React.FC<ChartProps> = ({
  candles,
  symbol,
  timeframe,
  onTimeframeChange,
  indicators,
  fvgs = [],
  orderBlocks = [],
  isLoading = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Chart configuration state
  const [chartType, setChartType] = useState<'CANDLE' | 'LINE' | 'AREA' | 'HEIKIN_ASHI'>('CANDLE');
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showCPR, setShowCPR] = useState(false);
  const [showFVG, setShowFVG] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Mouse hover & Crosshair state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Viewport / Zoom slice
  const [visibleCount, setVisibleCount] = useState<number>(60);
  const [offsetRight, setOffsetRight] = useState<number>(0);

  // Transform to Heikin-Ashi if selected
  const processedCandles = useMemo(() => {
    if (chartType !== 'HEIKIN_ASHI' || candles.length === 0) return candles;
    const ha: Candle[] = [];
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const haClose = (c.open + c.high + c.low + c.close) / 4;
      const haOpen = i === 0 ? (c.open + c.close) / 2 : (ha[i - 1].open + ha[i - 1].close) / 2;
      const haHigh = Math.max(c.high, haOpen, haClose);
      const haLow = Math.min(c.low, haOpen, haClose);
      ha.push({
        ...c,
        open: Number(haOpen.toFixed(2)),
        high: Number(haHigh.toFixed(2)),
        low: Number(haLow.toFixed(2)),
        close: Number(haClose.toFixed(2))
      });
    }
    return ha;
  }, [candles, chartType]);

  // Sliced candles for the viewport
  const displaySlice = useMemo(() => {
    if (processedCandles.length === 0) return [];
    const count = Math.min(visibleCount, processedCandles.length);
    const start = Math.max(0, processedCandles.length - count - offsetRight);
    const end = processedCandles.length - offsetRight;
    return processedCandles.slice(start, end);
  }, [processedCandles, visibleCount, offsetRight]);

  const activeCandle = hoverIndex !== null && displaySlice[hoverIndex] 
    ? displaySlice[hoverIndex] 
    : displaySlice[displaySlice.length - 1];

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Dark terminal background
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, width, height);

    if (displaySlice.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isLoading ? 'Loading market data...' : 'No historical data available for this timeframe', width / 2, height / 2);
      return;
    }

    const paddingRight = 75; // Y-axis price scale width
    const paddingBottom = 30; // X-axis time scale height
    const chartW = width - paddingRight;
    const chartH = height - paddingBottom;
    const volHeight = showVolume ? chartH * 0.18 : 0;
    const priceH = chartH - volHeight;

    // Determine min/max price for the visible window
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    displaySlice.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    // Add padding to price scale (1.5%)
    const priceRange = maxPrice - minPrice || 1;
    const yMin = minPrice - priceRange * 0.03;
    const yMax = maxPrice + priceRange * 0.03;
    const yRange = yMax - yMin;

    const getY = (p: number) => priceH - ((p - yMin) / yRange) * priceH;
    const barWidth = Math.max(3, chartW / displaySlice.length);
    const candleW = Math.max(2, barWidth * 0.75);

    // Draw grid lines
    ctx.strokeStyle = '#182030';
    ctx.lineWidth = 1;
    const gridRows = 6;
    for (let i = 0; i <= gridRows; i++) {
      const y = (priceH / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();

      // Price labels on the right axis
      const pVal = yMax - (yRange / gridRows) * i;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(pVal.toFixed(2), chartW + 8, y + 3);
    }

    // Draw FVGs (Fair Value Gaps)
    if (showFVG && fvgs.length > 0) {
      fvgs.forEach(fvg => {
        const topY = getY(fvg.top);
        const botY = getY(fvg.bottom);
        const h = Math.abs(botY - topY);
        ctx.fillStyle = fvg.direction === 'BULLISH' 
          ? (fvg.status === 'UNMITIGATED' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.06)')
          : (fvg.status === 'UNMITIGATED' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.06)');
        ctx.fillRect(0, Math.min(topY, botY), chartW, Math.max(2, h));

        // Border line for unmitigated FVG
        if (fvg.status === 'UNMITIGATED') {
          ctx.strokeStyle = fvg.direction === 'BULLISH' ? '#10b981' : '#ef4444';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(0, Math.min(topY, botY));
          ctx.lineTo(chartW, Math.min(topY, botY));
          ctx.moveTo(0, Math.max(topY, botY));
          ctx.lineTo(chartW, Math.max(topY, botY));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // Draw Volume Bars
    if (showVolume && maxVolume > 0) {
      const volBaseY = chartH;
      displaySlice.forEach((c, i) => {
        const x = i * barWidth + barWidth / 2;
        const vH = (c.volume / maxVolume) * volHeight;
        const isBullish = c.close >= c.open;
        ctx.fillStyle = isBullish ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
        ctx.fillRect(x - candleW / 2, volBaseY - vH, candleW, vH);
      });
    }

    // Draw Candlesticks / Bars
    displaySlice.forEach((c, i) => {
      const x = i * barWidth + barWidth / 2;
      const isBullish = c.close >= c.open;
      const bodyColor = isBullish ? '#10b981' : '#ef4444';

      if (chartType === 'CANDLE' || chartType === 'HEIKIN_ASHI') {
        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);

        // Shadow / Wick
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Real Body
        ctx.fillStyle = bodyColor;
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(1.5, Math.abs(closeY - openY));
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
      } else if (chartType === 'LINE') {
        // Line chart path handled after loop
      } else if (chartType === 'AREA') {
        // Area path handled after loop
      }
    });

    // If Line or Area Chart
    if (chartType === 'LINE' || chartType === 'AREA') {
      ctx.beginPath();
      displaySlice.forEach((c, i) => {
        const x = i * barWidth + barWidth / 2;
        const y = getY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      if (chartType === 'AREA') {
        ctx.lineTo((displaySlice.length - 1) * barWidth + barWidth / 2, priceH);
        ctx.lineTo(barWidth / 2, priceH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, priceH);
        grad.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
        grad.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      displaySlice.forEach((c, i) => {
        const x = i * barWidth + barWidth / 2;
        const y = getY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Draw Indicators (SMA 20, SMA 50, Supertrend)
    if (indicators && indicators.timestamps) {
      const globalIndices = displaySlice.map(c => 
        indicators.timestamps.indexOf(c.datetime_str)
      );

      // SMA 20
      if (showSMA20 && indicators.sma_20) {
        ctx.strokeStyle = '#06b6d4'; // Cyan
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        globalIndices.forEach((gIdx, i) => {
          if (gIdx !== -1 && indicators.sma_20[gIdx] !== null) {
            const x = i * barWidth + barWidth / 2;
            const y = getY(indicators.sma_20[gIdx]!);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else { ctx.lineTo(x, y); }
          }
        });
        ctx.stroke();
      }

      // SMA 50
      if (showSMA50 && indicators.sma_50) {
        ctx.strokeStyle = '#f59e0b'; // Amber
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        globalIndices.forEach((gIdx, i) => {
          if (gIdx !== -1 && indicators.sma_50[gIdx] !== null) {
            const x = i * barWidth + barWidth / 2;
            const y = getY(indicators.sma_50[gIdx]!);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else { ctx.lineTo(x, y); }
          }
        });
        ctx.stroke();
      }

      // Supertrend (Dynamic Green / Red)
      if (showSupertrend && indicators.supertrend && indicators.supertrend_direction) {
        ctx.lineWidth = 2;
        for (let i = 1; i < globalIndices.length; i++) {
          const gPrev = globalIndices[i - 1];
          const gCurr = globalIndices[i];
          if (gPrev !== -1 && gCurr !== -1 && indicators.supertrend[gPrev] !== null && indicators.supertrend[gCurr] !== null) {
            const x1 = (i - 1) * barWidth + barWidth / 2;
            const y1 = getY(indicators.supertrend[gPrev]!);
            const x2 = i * barWidth + barWidth / 2;
            const y2 = getY(indicators.supertrend[gCurr]!);
            const dir = indicators.supertrend_direction[gCurr];

            ctx.strokeStyle = dir === 1 ? '#10b981' : '#ef4444';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      // CPR (Central Pivot Range)
      if (showCPR && indicators.cpr) {
        const cpr = indicators.cpr;
        const levels = [
          { name: 'TC', val: cpr.tc, color: '#3b82f6' },
          { name: 'Pivot', val: cpr.pivot, color: '#8b5cf6' },
          { name: 'BC', val: cpr.bc, color: '#3b82f6' },
          { name: 'R1', val: cpr.r1, color: '#ef4444' },
          { name: 'S1', val: cpr.s1, color: '#10b981' }
        ];

        levels.forEach(lvl => {
          if (lvl.val >= yMin && lvl.val <= yMax) {
            const y = getY(lvl.val);
            ctx.strokeStyle = lvl.color;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(chartW, y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = lvl.color;
            ctx.font = '9px monospace';
            ctx.fillText(`${lvl.name}: ${lvl.val}`, 10, y - 3);
          }
        });
      }
    }

    // Draw Crosshair & Axis tooltips
    if (mousePos && mousePos.x <= chartW && mousePos.y <= height) {
      ctx.strokeStyle = '#475569';
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartW, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price Tag on Right Axis
      const hoverPrice = yMax - (mousePos.y / priceH) * yRange;
      if (mousePos.y <= priceH) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(chartW, mousePos.y - 10, paddingRight, 20);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`₹${hoverPrice.toFixed(2)}`, chartW + 6, mousePos.y + 4);
      }

      // Time Tag on Bottom Axis
      if (hoverIndex !== null && displaySlice[hoverIndex]) {
        const timeStr = displaySlice[hoverIndex].datetime_str;
        ctx.fillStyle = '#1e293b';
        const txtW = 110;
        ctx.fillRect(Math.max(0, mousePos.x - txtW / 2), height - 24, txtW, 20);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, Math.max(txtW / 2, mousePos.x), height - 10);
      }
    }

  }, [displaySlice, chartType, showSMA20, showSMA50, showSupertrend, showBollinger, showCPR, showFVG, showVolume, indicators, fvgs, mousePos, hoverIndex, isLoading]);

  // Handle Mouse movement for Crosshair & Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const chartW = canvas.clientWidth - 75;
    if (x <= chartW && displaySlice.length > 0) {
      const barW = chartW / displaySlice.length;
      const idx = Math.min(displaySlice.length - 1, Math.max(0, Math.floor(x / barW)));
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoverIndex(null);
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#0b0e14] border border-[#1e2638] rounded-lg overflow-hidden shadow-2xl">
      {/* Top Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#0f1422] border-b border-[#1e2638] text-xs gap-2">
        {/* Symbol & Timeframe */}
        <div className="flex items-center space-x-2">
          <div className="font-bold text-white text-sm tracking-wide bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/30">
            {symbol}
          </div>
          <div className="flex items-center bg-[#151c2e] rounded border border-[#232d42] p-0.5">
            {['1m', '5m', '15m', '1h', '1d', '1wk'].map(tf => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  timeframe === tf ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Chart Style Switcher */}
          <div className="flex items-center bg-[#151c2e] rounded border border-[#232d42] p-0.5">
            <button
              onClick={() => setChartType('CANDLE')}
              className={`px-2 py-0.5 rounded transition ${chartType === 'CANDLE' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              title="Candlesticks"
            >
              Candle
            </button>
            <button
              onClick={() => setChartType('HEIKIN_ASHI')}
              className={`px-2 py-0.5 rounded transition ${chartType === 'HEIKIN_ASHI' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              title="Heikin Ashi"
            >
              HA
            </button>
            <button
              onClick={() => setChartType('AREA')}
              className={`px-2 py-0.5 rounded transition ${chartType === 'AREA' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              title="Area"
            >
              Area
            </button>
          </div>
        </div>

        {/* Indicators Toggle Strip */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-1 cursor-pointer text-cyan-400 hover:text-cyan-300">
            <input type="checkbox" checked={showSMA20} onChange={e => setShowSMA20(e.target.checked)} className="rounded bg-[#1a2336] text-cyan-500 text-xs" />
            <span className="font-mono">SMA 20</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer text-amber-400 hover:text-amber-300">
            <input type="checkbox" checked={showSMA50} onChange={e => setShowSMA50(e.target.checked)} className="rounded bg-[#1a2336] text-amber-500 text-xs" />
            <span className="font-mono">SMA 50</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer text-emerald-400 hover:text-emerald-300">
            <input type="checkbox" checked={showSupertrend} onChange={e => setShowSupertrend(e.target.checked)} className="rounded bg-[#1a2336] text-emerald-500 text-xs" />
            <span className="font-mono">Supertrend</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer text-purple-400 hover:text-purple-300">
            <input type="checkbox" checked={showCPR} onChange={e => setShowCPR(e.target.checked)} className="rounded bg-[#1a2336] text-purple-500 text-xs" />
            <span className="font-mono">CPR</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer text-rose-400 hover:text-rose-300">
            <input type="checkbox" checked={showFVG} onChange={e => setShowFVG(e.target.checked)} className="rounded bg-[#1a2336] text-rose-500 text-xs" />
            <span className="font-mono">SMC FVG</span>
          </label>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setVisibleCount(c => Math.max(20, c - 15))}
            className="p-1 rounded bg-[#1a2336] text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setVisibleCount(c => Math.min(processedCandles.length || 100, c + 15))}
            className="p-1 rounded bg-[#1a2336] text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setVisibleCount(60); setOffsetRight(0); }}
            className="p-1 rounded bg-[#1a2336] text-slate-300 hover:text-white"
            title="Reset View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time OHLCV HUD Banner */}
      {activeCandle && (
        <div className="flex items-center space-x-4 px-3 py-1.5 bg-[#0e1320] text-xs border-b border-[#1b2234] font-mono">
          <span className="text-slate-400">{activeCandle.datetime_str}</span>
          <span>O: <span className="text-slate-200">₹{activeCandle.open.toFixed(2)}</span></span>
          <span>H: <span className="text-emerald-400">₹{activeCandle.high.toFixed(2)}</span></span>
          <span>L: <span className="text-rose-400">₹{activeCandle.low.toFixed(2)}</span></span>
          <span>C: <span className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>₹{activeCandle.close.toFixed(2)}</span></span>
          <span>Vol: <span className="text-slate-300">{activeCandle.volume.toLocaleString()}</span></span>
          <span>Change: <span className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
            {((activeCandle.close - activeCandle.open) / activeCandle.open * 100).toFixed(2)}%
          </span></span>
        </div>
      )}

      {/* Main Interactive Canvas */}
      <div className="relative flex-1 w-full min-h-[380px]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-[#0b0e14]/70 flex items-center justify-center backdrop-blur-sm z-10">
            <div className="flex items-center space-x-2 text-blue-400 font-medium">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Fetching Verified Exchange Data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
