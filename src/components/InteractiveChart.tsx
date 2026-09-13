import React, { useEffect, useRef, useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Activity, 
  Target, 
  ShieldAlert, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Maximize2,
  Minimize2,
  Sliders,
  ChevronDown,
  Edit3,
  Square,
  Minus,
  Trash2,
  Eye,
  EyeOff,
  Crosshair,
  Compass,
  Volume2
} from 'lucide-react';
import { Candle, TechnicalIndicators, SignalPattern, MarketSymbol, ChartDrawingToolItem } from '../types';

interface InteractiveChartProps {
  initialSymbol?: string;
  initialTimeframe?: string;
  symbols: MarketSymbol[];
  onRequestAiAnalysis?: (symbol: string, timeframe: string) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  initialSymbol = 'XAU/USD',
  initialTimeframe = '15m',
  symbols,
  onRequestAiAnalysis,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState(initialTimeframe);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [pattern, setPattern] = useState<SignalPattern | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<{ candle: Candle; index: number } | null>(null);

  // Indicator Visibility Toggles
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showEma200, setShowEma200] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showLevels, setShowLevels] = useState(true);
  const [showPivotPoints, setShowPivotPoints] = useState(false);
  const [showVolumeProfile, setShowVolumeProfile] = useState(false);

  // Drawing Tools State
  const [activeDrawingTool, setActiveDrawingTool] = useState<'NONE' | 'TRENDLINE' | 'HORIZONTAL' | 'FIBONACCI' | 'RECTANGLE'>('NONE');
  const [drawings, setDrawings] = useState<ChartDrawingToolItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rsiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ResizeObserver for dynamic canvas sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchChartData = async (sym: string, tf: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/radar/chart/${encodeURIComponent(sym)}/${tf}`);
      const data = await res.json();
      if (data.success) {
        setCandles(data.candles || []);
        setIndicators(data.indicators || null);
        setPattern(data.pattern || null);
      }
    } catch (err) {
      console.error('Failed to load chart data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData(selectedSymbol, selectedTimeframe);
  }, [selectedSymbol, selectedTimeframe]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const clientW = containerWidth || canvas.parentElement?.clientWidth || window.innerWidth - 32;
    const width = Math.max(280, Math.min(clientW, 1200));
    const height = window.innerWidth < 640 ? 360 : 440;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Dark sleek background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const padTop = 30;
    const padBottom = 40;
    const padRight = 75;
    const plotWidth = width - padRight;
    const plotHeight = height - padTop - padBottom;

    // Determine price scaling range
    const lows = candles.map(c => c.low);
    const highs = candles.map(c => c.high);
    let minPrice = Math.min(...lows);
    let maxPrice = Math.max(...highs);
    const priceRange = maxPrice - minPrice || 1;

    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;
    const effectiveRange = maxPrice - minPrice;

    const getY = (price: number) => {
      return padTop + plotHeight - ((price - minPrice) / effectiveRange) * plotHeight;
    };

    const candleCount = candles.length;
    const candleWidth = Math.max(3, (plotWidth / candleCount) * 0.65);
    const candleSpacing = plotWidth / candleCount;

    const getX = (index: number) => {
      return index * candleSpacing + candleSpacing / 2;
    };

    // Horizontal Price Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const gridLinesCount = 6;
    for (let i = 0; i <= gridLinesCount; i++) {
      const priceVal = minPrice + (effectiveRange / gridLinesCount) * i;
      const y = getY(priceVal);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceVal.toFixed(selectedSymbol.includes('JPY') ? 2 : selectedSymbol.includes('BTC') ? 1 : 4), plotWidth + 8, y + 3);
    }
    ctx.setLineDash([]);

    // Volume Profile Overlay (if enabled)
    if (showVolumeProfile && indicators?.volumeProfile) {
      const vp = indicators.volumeProfile;
      const maxVol = Math.max(...vp.map(v => v.volume));
      const maxBarWidth = plotWidth * 0.22;

      vp.forEach(bar => {
        const y = getY(bar.priceLevel);
        const barW = (bar.volume / maxVol) * maxBarWidth;
        ctx.fillStyle = bar.isPoc ? 'rgba(234, 179, 8, 0.35)' : 'rgba(59, 130, 246, 0.15)';
        ctx.fillRect(plotWidth - barW, y - 4, barW, 8);

        if (bar.isPoc) {
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(plotWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#eab308';
          ctx.fillText('POC', plotWidth + 8, y - 3);
        }
      });
    }

    // Classical Pivot Points Overlay (if enabled)
    if (showPivotPoints && indicators?.pivotPoints) {
      const pp = indicators.pivotPoints;
      const drawPivotLine = (val: number, label: string, color: string) => {
        const y = getY(val);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.fillText(label, plotWidth + 8, y - 2);
      };

      drawPivotLine(pp.pivot, 'P', '#f59e0b');
      drawPivotLine(pp.r1, 'R1', '#ef4444');
      drawPivotLine(pp.r2, 'R2', '#dc2626');
      drawPivotLine(pp.s1, 'S1', '#10b981');
      drawPivotLine(pp.s2, 'S2', '#059669');
    }

    // Render Bollinger Bands
    if (showBollinger && indicators?.bollinger) {
      const closes = candles.map(c => c.close);
      const upperY = getY(indicators.bollinger.upper);
      const lowerY = getY(indicators.bollinger.lower);
      const midY = getY(indicators.bollinger.middle);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.fillRect(0, upperY, plotWidth, Math.abs(lowerY - upperY));

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, upperY);
      ctx.lineTo(plotWidth, upperY);
      ctx.moveTo(0, lowerY);
      ctx.lineTo(plotWidth, lowerY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(plotWidth, midY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Render EMA Moving Averages
    const drawEMA = (period: number, color: string) => {
      const closes = candles.map(c => c.close);
      const k = 2 / (period + 1);
      let ema = closes[0];
      const points: { x: number; y: number }[] = [];

      candles.forEach((c, idx) => {
        ema = c.close * k + ema * (1 - k);
        if (idx >= period - 1) {
          points.push({ x: getX(idx), y: getY(ema) });
        }
      });

      if (points.length > 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let p = 1; p < points.length; p++) {
          ctx.lineTo(points[p].x, points[p].y);
        }
        ctx.stroke();
      }
    };

    if (showEma20) drawEMA(20, '#38bdf8'); // Sky blue
    if (showEma50) drawEMA(50, '#eab308'); // Yellow
    if (showEma200) drawEMA(200, '#a855f7'); // Purple

    // Render Volume Bars
    if (showVolume) {
      const maxVol = Math.max(...candles.map(c => c.volume));
      const volHeight = 55;
      const volBaseY = padTop + plotHeight;

      candles.forEach((c, idx) => {
        const x = getX(idx);
        const barH = (c.volume / maxVol) * volHeight;
        const isBull = c.close >= c.open;
        ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(x - candleWidth / 2, volBaseY - barH, candleWidth, barH);
      });
    }

    // Render Candlesticks
    candles.forEach((c, idx) => {
      const x = getX(idx);
      const isBull = c.close >= c.open;
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      const color = isBull ? '#10b981' : '#ef4444';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Real Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyH);
    });

    // Render User Drawings
    drawings.forEach(d => {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 2;

      if (d.type === 'HORIZONTAL' && d.points[0]) {
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(0, d.points[0].y);
        ctx.lineTo(plotWidth, d.points[0].y);
        ctx.stroke();
        ctx.setLineDash([]);
        if (d.label) {
          ctx.fillStyle = d.color;
          ctx.fillText(d.label, 10, d.points[0].y - 5);
        }
      } else if (d.type === 'TRENDLINE' && d.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(d.points[0].x, d.points[0].y);
        ctx.lineTo(d.points[1].x, d.points[1].y);
        ctx.stroke();
      } else if (d.type === 'RECTANGLE' && d.points.length >= 2) {
        const rx = Math.min(d.points[0].x, d.points[1].x);
        const ry = Math.min(d.points[0].y, d.points[1].y);
        const rw = Math.abs(d.points[1].x - d.points[0].x);
        const rh = Math.abs(d.points[1].y - d.points[0].y);
        ctx.fillStyle = `${d.color}22`;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (d.type === 'FIBONACCI' && d.points.length >= 2) {
        const y1 = d.points[0].y;
        const y2 = d.points[1].y;
        const diff = y2 - y1;
        const fibRatios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
        fibRatios.forEach(r => {
          const fy = y1 + diff * r;
          ctx.strokeStyle = r === 0.618 || r === 0.5 ? '#f59e0b' : 'rgba(148, 163, 184, 0.5)';
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(0, fy);
          ctx.lineTo(plotWidth, fy);
          ctx.stroke();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillText(`${(r * 100).toFixed(1)}%`, plotWidth - 45, fy - 3);
        });
        ctx.setLineDash([]);
      }
    });

    // Active Drawing In-Progress Preview
    if (isDrawing && currentPoints.length > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      if (activeDrawingTool === 'TRENDLINE' && currentPoints.length === 2) {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        ctx.lineTo(currentPoints[1].x, currentPoints[1].y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

  }, [candles, indicators, showEma20, showEma50, showEma200, showBollinger, showVolume, showPivotPoints, showVolumeProfile, drawings, currentPoints, isDrawing]);

  // RSI Sub-Chart Rendering
  useEffect(() => {
    const canvas = rsiCanvasRef.current;
    if (!canvas || candles.length === 0 || !indicators) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const clientW = containerWidth || canvas.parentElement?.clientWidth || window.innerWidth - 32;
    const width = Math.max(280, Math.min(clientW, 1200));
    const height = 95;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const padTop = 15;
    const padBottom = 15;
    const padRight = 75;
    const plotWidth = width - padRight;
    const plotHeight = height - padTop - padBottom;

    const getY = (rsiVal: number) => {
      return padTop + plotHeight - (rsiVal / 100) * plotHeight;
    };

    // Overbought (70) and Oversold (30) zones
    ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
    ctx.fillRect(0, getY(30), plotWidth, getY(0) - getY(30));

    ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
    ctx.fillRect(0, getY(100), plotWidth, getY(70) - getY(100));

    ctx.strokeStyle = '#334155';
    ctx.setLineDash([3, 3]);
    [30, 50, 70].forEach(level => {
      const y = getY(level);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = level === 70 ? '#ef4444' : level === 30 ? '#10b981' : '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(String(level), plotWidth + 8, y + 3);
    });
    ctx.setLineDash([]);

    // Plot RSI Curve
    const closes = candles.map(c => c.close);
    const rsiPoints: { x: number; y: number }[] = [];
    const candleSpacing = plotWidth / candles.length;

    for (let i = 14; i < candles.length; i++) {
      const slice = closes.slice(0, i + 1);
      let gains = 0, losses = 0;
      for (let j = slice.length - 14; j < slice.length; j++) {
        const diff = slice[j] - slice[j - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const rs = losses === 0 ? 100 : gains / losses;
      const rsiVal = 100 - (100 / (1 + rs));
      rsiPoints.push({
        x: i * candleSpacing + candleSpacing / 2,
        y: getY(rsiVal)
      });
    }

    if (rsiPoints.length > 1) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rsiPoints[0].x, rsiPoints[0].y);
      for (let p = 1; p < rsiPoints.length; p++) {
        ctx.lineTo(rsiPoints[p].x, rsiPoints[p].y);
      }
      ctx.stroke();
    }
  }, [candles, indicators]);

  // Canvas Mouse Interactions for Drawing Tools
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeDrawingTool === 'NONE') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeDrawingTool === 'HORIZONTAL') {
      const newD: ChartDrawingToolItem = {
        id: `draw-${Date.now()}`,
        type: 'HORIZONTAL',
        points: [{ x, y }],
        color: '#f59e0b',
        label: `Key Level`
      };
      setDrawings(prev => [...prev, newD]);
      setActiveDrawingTool('NONE');
    } else {
      setIsDrawing(true);
      setCurrentPoints([{ x, y }]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPoints(prev => [prev[0], { x, y }]);
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      return;
    }

    const newD: ChartDrawingToolItem = {
      id: `draw-${Date.now()}`,
      type: activeDrawingTool as any,
      points: currentPoints,
      color: activeDrawingTool === 'FIBONACCI' ? '#f59e0b' : '#38bdf8',
    };

    setDrawings(prev => [...prev, newD]);
    setIsDrawing(false);
    setCurrentPoints([]);
    setActiveDrawingTool('NONE');
  };

  const currentSymObj = symbols.find(s => s.symbol === selectedSymbol) || symbols[0];
  const lastCandle = candles[candles.length - 1];

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden" ref={containerRef}>
      
      {/* Top Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md w-full max-w-full">
        
        {/* Symbol & Timeframe Selectors */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-slate-950 text-white font-mono font-bold text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 max-w-[200px] sm:max-w-xs truncate"
          >
            {symbols.map(s => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} - {s.name}
              </option>
            ))}
          </select>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 sm:p-1 text-xs font-mono overflow-x-auto no-scrollbar">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg font-bold transition text-[11px] sm:text-xs ${
                  selectedTimeframe === tf 
                    ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchChartData(selectedSymbol, selectedTimeframe)}
            disabled={isLoading}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Live Price Badge */}
        <div className="flex items-center justify-between sm:justify-end gap-3 font-mono w-full sm:w-auto border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
          <div className="text-left sm:text-right">
            <div className="text-lg sm:text-xl font-extrabold text-white">
              ${currentSymObj?.price.toLocaleString(undefined, { minimumFractionDigits: currentSymObj?.digits || 2 })}
            </div>
            <div className={`text-xs font-bold ${currentSymObj?.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentSymObj?.change24h >= 0 ? '+' : ''}{currentSymObj?.change24h}% (24h)
            </div>
          </div>

          {onRequestAiAnalysis && (
            <button
              onClick={() => onRequestAiAnalysis(selectedSymbol, selectedTimeframe)}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>AI Next Move</span>
            </button>
          )}
        </div>
      </div>

      {/* Indicator & Drawing Tools Control Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono w-full max-w-full overflow-hidden">
        
        {/* Indicators Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
          <span className="text-slate-400 font-sans font-medium text-[10px] sm:text-[11px] mr-1">Overlays:</span>
          
          <button
            onClick={() => setShowEma20(!showEma20)}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-[11px] border transition ${
              showEma20 ? 'bg-sky-500/10 text-sky-400 border-sky-500/40 font-bold' : 'text-slate-500 border-slate-800'
            }`}
          >
            EMA 20
          </button>

          <button
            onClick={() => setShowEma50(!showEma50)}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-[11px] border transition ${
              showEma50 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 font-bold' : 'text-slate-500 border-slate-800'
            }`}
          >
            EMA 50
          </button>

          <button
            onClick={() => setShowEma200(!showEma200)}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-[11px] border transition ${
              showEma200 ? 'bg-purple-500/10 text-purple-400 border-purple-500/40 font-bold' : 'text-slate-500 border-slate-800'
            }`}
          >
            EMA 200
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-[11px] border transition ${
              showBollinger ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 font-bold' : 'text-slate-500 border-slate-800'
            }`}
          >
            Bollinger
          </button>

          <button
            onClick={() => setShowPivotPoints(!showPivotPoints)}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-[11px] border transition ${
              showPivotPoints ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 font-bold' : 'text-slate-500 border-slate-800'
            }`}
          >
            Pivots
          </button>

          <button
            onClick={() => setShowVolumeProfile(!showVolumeProfile)}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-[11px] border transition ${
              showVolumeProfile ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 font-bold' : 'text-slate-500 border-slate-800'
            }`}
          >
            Volume Profile
          </button>
        </div>

        {/* Drawing Tools Selector */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg shrink-0">
          <span className="text-slate-400 text-[10px] px-1 font-sans">Draw:</span>
          
          <button
            onClick={() => setActiveDrawingTool(activeDrawingTool === 'TRENDLINE' ? 'NONE' : 'TRENDLINE')}
            className={`p-1.5 rounded transition ${activeDrawingTool === 'TRENDLINE' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            title="Trendline Tool"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveDrawingTool(activeDrawingTool === 'HORIZONTAL' ? 'NONE' : 'HORIZONTAL')}
            className={`p-1.5 rounded transition ${activeDrawingTool === 'HORIZONTAL' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            title="Horizontal Support/Resistance Line"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveDrawingTool(activeDrawingTool === 'RECTANGLE' ? 'NONE' : 'RECTANGLE')}
            className={`p-1.5 rounded transition ${activeDrawingTool === 'RECTANGLE' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            title="Order Block / FVG Zone Rectangle"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveDrawingTool(activeDrawingTool === 'FIBONACCI' ? 'NONE' : 'FIBONACCI')}
            className={`p-1.5 rounded transition ${activeDrawingTool === 'FIBONACCI' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            title="Fibonacci Retracement"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {drawings.length > 0 && (
            <button
              onClick={() => setDrawings([])}
              className="p-1.5 rounded text-rose-400 hover:bg-rose-950/40 transition"
              title="Clear All Drawings"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        
        {/* Pattern Banner */}
        {pattern && (
          <div className="absolute top-6 left-6 z-10 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white font-mono">{pattern.name}</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
              {pattern.confidence}% Conviction
            </span>
          </div>
        )}

        {/* Candlestick Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="w-full cursor-crosshair rounded-xl block"
        />

        {/* RSI Sub-Chart */}
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span className="font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Relative Strength Index (RSI 14): <strong className="text-purple-300">{indicators?.rsi.toFixed(1)}</strong>
            </span>
            <span className="text-[11px] text-slate-400">{indicators?.rsiSignal}</span>
          </div>
          <canvas ref={rsiCanvasRef} className="w-full rounded-lg block" />
        </div>
      </div>

      {/* Key Quantitative Metrics Footer */}
      {indicators && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Trend Structure</div>
            <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">{indicators.trend.replace('_', ' ')}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">MACD Hist</div>
            <div className={`text-xs font-bold font-mono mt-0.5 ${indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {indicators.macd.histogram}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">ATR Volatility</div>
            <div className="text-xs font-bold font-mono text-white mt-0.5">{indicators.atr}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">BB Bandwidth</div>
            <div className="text-xs font-bold font-mono text-cyan-400 mt-0.5">{indicators.bollinger.bandwidth}%</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">ADX Strength</div>
            <div className="text-xs font-bold font-mono text-purple-400 mt-0.5">{indicators.adx}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Nearest Pivot (P)</div>
            <div className="text-xs font-bold font-mono text-amber-400 mt-0.5">{indicators.pivotPoints?.pivot || '--'}</div>
          </div>
        </div>
      )}

    </div>
  );
};
