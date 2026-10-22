import React from 'react';
import { Play, Volume2, VolumeX, RotateCcw, Award, Users, DollarSign } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  totalCash: number;
  customersServed: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
  totalCash,
  customersServed,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden text-center p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-800">
          <Award className="w-6 h-6 text-emerald-600" />
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-1">Game Paused</h2>
        <p className="text-xs text-slate-500 mb-5">Your supermarket is on hold</p>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 mb-0.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>TOTAL CASH</span>
            </div>
            <div className="text-base font-black text-slate-900 tabular-nums">
              ${totalCash.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 mb-0.5">
              <Users className="w-3.5 h-3.5 text-sky-500" />
              <span>CUSTOMERS</span>
            </div>
            <div className="text-base font-black text-slate-900 tabular-nums">
              {customersServed}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume Game</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span>{isMuted ? 'Unmute Sound' : 'Mute Sound'}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 text-slate-400 hover:text-slate-600 font-semibold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Supermarket</span>
          </button>
        </div>

        <div className="mt-5 text-[11px] font-medium text-slate-400">
          Tip: Stand at the cash register to ring up customers and earn cash!
        </div>
      </div>
    </div>
  );
};
