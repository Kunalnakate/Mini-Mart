import React, { useEffect } from 'react';
import { Play, Volume2, VolumeX, Sparkles, ShoppingBag, DollarSign, Store } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  isMuted,
  onToggleMute,
}) => {
  // Listen for Enter / Space key to start immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 pointer-events-none select-none z-30">
      {/* Top Bar: Brand tag & Audio Toggle */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto pointer-events-auto">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-none px-4 py-2 rounded-2xl shadow-md border border-emerald-100">
          <Store className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            YouTube Playables Edition
          </span>
        </div>

        <button
          onClick={onToggleMute}
          className="p-3 bg-white/90 rounded-2xl shadow-md border border-slate-200 hover:bg-slate-50 transition-transform active:scale-95 text-slate-700"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
        </button>
      </div>

      {/* Center Hero Lockup over 35% negative space */}
      <div className="flex flex-col items-center justify-center text-center my-auto pointer-events-auto max-w-xl mx-auto">
        {/* Bespoke SVG Title Lockup */}
        <div className="relative mb-3">
          <svg
            viewBox="0 0 540 120"
            className="w-72 sm:w-96 md:w-[480px] filter drop-shadow-xl overflow-visible"
          >
            <defs>
              <linearGradient id="martGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>

            {/* Background 3D Extrusion Stroke */}
            <text
              x="270"
              y="58"
              textAnchor="middle"
              className="font-black text-6xl tracking-tight"
              fill="#064e3b"
              stroke="#064e3b"
              strokeWidth="10"
              strokeLinejoin="round"
            >
              MINI MART 3D
            </text>

            {/* Front Gradient Text */}
            <text
              x="270"
              y="58"
              textAnchor="middle"
              className="font-black text-6xl tracking-tight"
              fill="url(#martGrad)"
              stroke="#ffffff"
              strokeWidth="3"
            >
              MINI MART 3D
            </text>

            {/* Playable Ribbon Subtitle */}
            <rect x="155" y="78" width="230" height="30" rx="15" fill="url(#goldGrad)" stroke="#ca8a04" strokeWidth="2" />
            <text
              x="270"
              y="99"
              textAnchor="middle"
              className="font-extrabold text-sm tracking-widest fill-amber-950 uppercase"
            >
              ARCADE SUPERMARKET
            </text>
          </svg>
        </div>

        <p className="text-sm md:text-base font-semibold text-slate-800 bg-white/90 px-4 py-1.5 rounded-full shadow-sm mb-6 border border-slate-100">
          Plant crops, stock shelves, serve hungry shoppers, and build an idle grocery empire!
        </p>

        {/* Big Start Button */}
        <button
          onClick={onStart}
          className="group relative flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-600/30 border-b-4 border-emerald-800 transition-all hover:-translate-y-0.5 active:translate-y-1 active:border-b-0 cursor-pointer"
        >
          <Play className="w-7 h-7 fill-white transition-transform group-hover:scale-110" />
          <span>START PLAYING</span>
        </button>

        {/* Flat Control-Hint Line */}
        <div className="mt-4 text-xs font-bold text-slate-700 bg-white/80 px-4 py-1.5 rounded-xl border border-slate-200">
          WASD / Arrow Keys or Drag to Move · Walk to Interact · Esc to Pause
        </div>
      </div>

      {/* Bottom Game-Loop Showcase Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full pointer-events-auto">
        <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl shrink-0">
            🍅
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">1. Harvest</div>
            <div className="text-[11px] text-slate-500">Pick ripe tomatoes & apples</div>
          </div>
        </div>

        <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-xl shrink-0">
            🛒
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">2. Restock</div>
            <div className="text-[11px] text-slate-500">Keep market shelves full</div>
          </div>
        </div>

        <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
            💵
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">3. Cash Out</div>
            <div className="text-[11px] text-slate-500">Scan orders & gather cash</div>
          </div>
        </div>

        <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl shrink-0">
            🤖
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">4. Automate</div>
            <div className="text-[11px] text-slate-500">Hire bot helpers & juicers</div>
          </div>
        </div>
      </div>
    </div>
  );
};
