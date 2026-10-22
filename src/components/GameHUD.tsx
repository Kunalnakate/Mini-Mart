import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  ChevronUp,
  ChevronDown,
  Zap,
  Users,
  Star,
  ArrowUpRight,
  Sun,
  CloudRain,
  CloudSun,
  Gift,
  Sparkles,
} from 'lucide-react';
import { ItemType, QuestGoal, StoreEvent } from '../game/types';
import { WeatherType } from '../game/weather';

interface GameHUDProps {
  cash: number;
  stackCount: number;
  maxStack: number;
  customersServed: number;
  shelfStock: Record<ItemType, number>;
  storeStars?: number;
  currentEvent?: StoreEvent | null;
  activeQuest?: QuestGoal | null;
  onClaimQuest?: (questId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenUpgrades: () => void;
  weather?: WeatherType;
  onCycleWeather?: () => void;
  nextUnlockLabel?: string;
  nextUnlockCost?: number;
  joystick?: {
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  };
  floatingRewards?: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
  }>;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  cash,
  stackCount,
  maxStack,
  customersServed,
  shelfStock,
  storeStars = 1,
  currentEvent,
  activeQuest,
  onClaimQuest,
  isMuted,
  onToggleMute,
  onPause,
  onOpenUpgrades,
  weather = 'clear',
  onCycleWeather,
  nextUnlockLabel,
  nextUnlockCost,
  joystick,
  floatingRewards = [],
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Compute joystick knob offset
  const joyDx = joystick?.active ? joystick.currentX - joystick.startX : 0;
  const joyDy = joystick?.active ? joystick.currentY - joystick.startY : 0;
  const joyDist = Math.hypot(joyDx, joyDy);
  const maxJoyDist = 45;
  const clampedJoyDx = joyDist > 0 ? (joyDx / joyDist) * Math.min(joyDist, maxJoyDist) : 0;
  const clampedJoyDy = joyDist > 0 ? (joyDy / joyDist) * Math.min(joyDist, maxJoyDist) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Floating Animated Reward Numbers */}
      {floatingRewards.map((r) => (
        <div
          key={r.id}
          className="absolute font-black text-xl md:text-2xl drop-shadow-md pointer-events-none animate-bounce"
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
            color: r.color,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            transition: 'all 0.6s ease-out',
          }}
        >
          {r.text}
        </div>
      ))}

      {/* On-Screen Virtual Touch / Drag Joystick Indicator */}
      {joystick?.active && (
        <div
          className="absolute w-24 h-24 rounded-full border-2 border-emerald-400/60 bg-emerald-950/20 pointer-events-none flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
          style={{
            left: `${joystick.startX}px`,
            top: `${joystick.startY}px`,
          }}
        >
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300 shadow-md border border-white/60"
            style={{
              transform: `translate(${clampedJoyDx}px, ${clampedJoyDy}px)`,
              transition: 'transform 0.05s ease-out',
            }}
          />
        </div>
      )}

      {/* Top Header Cluster */}
      <div className="flex flex-col gap-2.5 w-full max-w-6xl mx-auto">
        <div className="flex items-start justify-between w-full">
          {/* Top-Left Cluster: Cash, Stack & Store Stars */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            {/* Cash Balance Display */}
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-md border-2 border-emerald-400">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
                $
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Mart Revenue
                </div>
                <div className="text-xl md:text-2xl font-black text-slate-900 tabular-nums">
                  ${cash.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Stack Capacity Bar */}
            <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-200">
              <div className="text-base">🎒</div>
              <div className="flex flex-col">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-500 mb-0.5">
                  <span>CARRY CAPACITY</span>
                  <span className="tabular-nums font-black text-slate-800">
                    {stackCount} / {maxStack}
                  </span>
                </div>
                <div className="w-28 md:w-36 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-200 ${
                      stackCount >= maxStack ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (stackCount / maxStack) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Store Reputation Rating Stars & Customers Served */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-black text-amber-900 shadow-xs" title="Supermarket Reputation Level">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < storeStars
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-1 text-[11px]">{storeStars}-Star Mart</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-lg shadow-xs border border-slate-200 text-xs font-bold text-slate-700">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span className="tabular-nums">{customersServed} Served</span>
              </div>
            </div>
          </div>

          {/* Top-Right Cluster: Weather, Upgrades & Settings Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Weather Indicator & Cycle Toggle Button */}
            <button
              onClick={onCycleWeather}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-sm border transition-all cursor-pointer font-black text-xs select-none active:scale-95 ${
                weather === 'sunny'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-amber-200/50 hover:bg-amber-100'
                  : weather === 'rain'
                  ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-sky-200/50 hover:bg-sky-100'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-200/50 hover:bg-emerald-100'
              }`}
              title="Outdoor weather. Click to toggle weather manually!"
            >
              {weather === 'sunny' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span className="hidden sm:inline">SUNNY</span>
                </>
              ) : weather === 'rain' ? (
                <>
                  <CloudRain className="w-4 h-4 text-sky-600 animate-pulse" />
                  <span className="hidden sm:inline">RAINY</span>
                </>
              ) : (
                <>
                  <CloudSun className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">CLEAR</span>
                </>
              )}
            </button>

            {/* Quick Upgrade Button */}
            <button
              onClick={onOpenUpgrades}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs md:text-sm px-4 py-2.5 rounded-2xl shadow-md border-b-2 border-amber-700 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>BOOSTERS</span>
            </button>

            {/* Mute Button */}
            <button
              onClick={onToggleMute}
              className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform text-slate-700 cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
            </button>

            {/* Pause Button */}
            <button
              onClick={onPause}
              className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform text-slate-700 cursor-pointer"
              title="Pause Game (Esc)"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Timed Store Event Banner */}
        {currentEvent && (
          <div className="w-full flex justify-center pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
            <div className={`flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r ${currentEvent.bannerColor} text-white shadow-lg border border-white/20 max-w-xl w-full`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl animate-bounce">{currentEvent.icon}</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wide leading-tight">
                    {currentEvent.name}
                  </div>
                  <div className="text-[11px] font-medium text-white/90">
                    {currentEvent.description}
                  </div>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-black tabular-nums shrink-0">
                {Math.ceil(currentEvent.duration)}s left
              </div>
            </div>
          </div>
        )}

        {/* Milestone Quest Progress Card */}
        {activeQuest && (
          <div className="w-full flex justify-center pointer-events-auto">
            <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md max-w-xl w-full">
              <div className="flex items-center gap-3">
                <span className="text-xl">{activeQuest.icon}</span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{activeQuest.title}</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {activeQuest.current} / {activeQuest.target}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {activeQuest.description}
                  </span>
                </div>
              </div>

              {activeQuest.completed ? (
                <button
                  onClick={() => onClaimQuest?.(activeQuest.id)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md border-b-2 border-emerald-700 active:translate-y-0.5 transition-all cursor-pointer animate-pulse shrink-0"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>CLAIM +${activeQuest.reward}</span>
                </button>
              ) : (
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  <div
                    className="h-full bg-sky-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (activeQuest.current / activeQuest.target) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Center 85% is completely unobstructed for the 3D scene */}

      {/* Bottom Center Unified Collapsible Control Dock */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center pointer-events-auto transition-transform duration-300">
        {/* Toggle Collapse Pill */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/95 rounded-t-xl text-[11px] font-black text-slate-600 border-t border-x border-slate-200 shadow-xs hover:bg-slate-50 cursor-pointer"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>SHOW SHELVES</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>HIDE DOCK</span>
            </>
          )}
        </button>

        {!isDockCollapsed && (
          <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-3 flex items-center justify-between gap-3">
            {/* Live Shelf Stocks Preview for All 7 Items */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 shrink-0" title="Tomatoes on shelf">
                <span className="text-base">🍅</span>
                <span className="text-xs font-black text-slate-800 tabular-nums">
                  {shelfStock.tomato}
                </span>
              </div>

              {shelfStock.apple !== undefined && (
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 shrink-0" title="Apples on shelf">
                  <span className="text-base">🍎</span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {shelfStock.apple}
                  </span>
                </div>
              )}

              {shelfStock.egg !== undefined && (
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 shrink-0" title="Eggs on shelf">
                  <span className="text-base">🥚</span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {shelfStock.egg}
                  </span>
                </div>
              )}

              {shelfStock.bread !== undefined && shelfStock.bread > 0 && (
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 shrink-0" title="Artisan Bread on shelf">
                  <span className="text-base">🥖</span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {shelfStock.bread}
                  </span>
                </div>
              )}

              {shelfStock.juice !== undefined && shelfStock.juice > 0 && (
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 shrink-0" title="Blended Juice on shelf">
                  <span className="text-base">🧃</span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {shelfStock.juice}
                  </span>
                </div>
              )}

              {shelfStock.coffee !== undefined && shelfStock.coffee > 0 && (
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 shrink-0" title="Espresso Coffee on shelf">
                  <span className="text-base">☕</span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {shelfStock.coffee}
                  </span>
                </div>
              )}

              {shelfStock.cheese !== undefined && shelfStock.cheese > 0 && (
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100 shrink-0" title="Gourmet Cheese on shelf">
                  <span className="text-base">🧀</span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {shelfStock.cheese}
                  </span>
                </div>
              )}
            </div>

            {/* Next Unlock Objective Reminder */}
            {nextUnlockLabel && (
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-bold shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-black text-emerald-800">{nextUnlockLabel}</span>
                {nextUnlockCost !== undefined && (
                  <span className="bg-emerald-200/80 px-1.5 py-0.5 rounded text-[10px] font-black tabular-nums">
                    ${nextUnlockCost}
                  </span>
                )}
              </div>
            )}

            {/* Quick Upgrade Button */}
            <button
              onClick={onOpenUpgrades}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <span>Upgrades</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
