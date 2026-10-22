import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { UpgradeModal } from './components/UpgradeModal';
import { PauseModal } from './components/PauseModal';
import { sound } from './game/audio';
import { ItemType, UpgradeState, QuestGoal, StoreEvent } from './game/types';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level App State
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');
  const [isPaused, setIsPaused] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [weather, setWeather] = useState<'clear' | 'sunny' | 'rain'>('clear');

  // HUD Readout stats from engine
  const [cash, setCash] = useState(0);
  const [stackCount, setStackCount] = useState(0);
  const [maxStack, setMaxStack] = useState(4);
  const [customersServed, setCustomersServed] = useState(0);
  const [shelfStock, setShelfStock] = useState<Record<ItemType, number>>({
    tomato: 8,
    apple: 0,
    egg: 0,
    bread: 0,
    juice: 0,
    coffee: 0,
    cheese: 0,
  });

  const [storeStars, setStoreStars] = useState(1);
  const [currentEvent, setCurrentEvent] = useState<StoreEvent | null>(null);
  const [activeQuest, setActiveQuest] = useState<QuestGoal | null>(null);

  const [upgrades, setUpgrades] = useState<UpgradeState>({
    carryCapacity: 1,
    moveSpeed: 1,
    cropGrowthRate: 1,
    helperSpeed: 1,
    tipJar: 1,
    shelfCapacity: 1,
  });

  // Next unlock calculation
  const [nextUnlock, setNextUnlock] = useState<{ label: string; cost: number } | undefined>({
    label: 'Apple Orchard',
    cost: 40,
  });

  // Joystick visual state
  const [joystick, setJoystick] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });

  // Floating reward numbers
  const [floatingRewards, setFloatingRewards] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
  }>>([]);

  // Initialize GameEngine
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current);
    engineRef.current = engine;

    engine.onJoystickState = (joy) => {
      setJoystick(joy);
    };

    engine.onFloatingReward = (reward) => {
      setFloatingRewards((prev) => [...prev, reward]);
      setTimeout(() => {
        setFloatingRewards((prev) => prev.filter((r) => r.id !== reward.id));
      }, 1000);
    };

    engine.onWeatherChange = (w) => {
      setWeather(w);
    };

    engine.onStateUpdate = (data) => {
      setCash(data.cash);
      setStackCount(data.stackCount);
      setMaxStack(data.maxStack);
      setCustomersServed(data.customersServed);
      setShelfStock(data.shelfStock);
      setStoreStars(data.storeStars);
      setCurrentEvent(data.currentEvent);
      setActiveQuest(data.activeQuest);

      // Find first active visible unlock pad
      const activePad = engine.unlockPads.find(
        (p) => !p.unlocked && engine['padMeshes']?.get(p.id)?.root.visible
      );

      if (activePad) {
        setNextUnlock({ label: activePad.label, cost: activePad.cost });
      } else {
        setNextUnlock(undefined);
      }
    };

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Global Key Shortcuts (Escape for pause/resume)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (isUpgradeOpen) {
          setIsUpgradeOpen(false);
        } else if (gameState === 'playing') {
          if (engineRef.current) {
            const paused = engineRef.current.togglePause();
            setIsPaused(paused);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isUpgradeOpen]);

  const handleStartGame = useCallback(() => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  }, [isMuted]);

  const handleTogglePause = useCallback(() => {
    if (engineRef.current) {
      const paused = engineRef.current.togglePause();
      setIsPaused(paused);
    }
  }, []);

  const handleCycleWeather = useCallback(() => {
    if (engineRef.current) {
      const next = engineRef.current.cycleWeather();
      setWeather(next);
    }
  }, []);

  const handleRestart = useCallback(() => {
    window.location.reload();
  }, []);

  const handleClaimQuest = useCallback((questId: string) => {
    if (engineRef.current) {
      engineRef.current.claimQuestReward(questId);
      setCash(engineRef.current.playerCash);
      setActiveQuest(engineRef.current.getActiveQuest());
    }
  }, []);

  const handleUpgrade = useCallback((key: keyof UpgradeState, cost: number) => {
    if (engineRef.current) {
      const success = engineRef.current.upgradeStat(key, cost);
      if (success) {
        setUpgrades({ ...engineRef.current.upgrades });
        setCash(engineRef.current.playerCash);
      }
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
      {/* 3D WebGL Canvas Isolated Mount Ref */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Live Gameplay Perimeter HUD */}
      {gameState === 'playing' && (
        <GameHUD
          cash={cash}
          stackCount={stackCount}
          maxStack={maxStack}
          customersServed={customersServed}
          shelfStock={shelfStock}
          storeStars={storeStars}
          currentEvent={currentEvent}
          activeQuest={activeQuest}
          onClaimQuest={handleClaimQuest}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handleTogglePause}
          onOpenUpgrades={() => setIsUpgradeOpen(true)}
          weather={weather}
          onCycleWeather={handleCycleWeather}
          nextUnlockLabel={nextUnlock?.label}
          nextUnlockCost={nextUnlock?.cost}
          joystick={joystick}
          floatingRewards={floatingRewards}
        />
      )}

      {/* Upgrades Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        playerCash={cash}
        upgrades={upgrades}
        onUpgrade={handleUpgrade}
      />

      {/* Pause Menu Modal */}
      <PauseModal
        isOpen={isPaused}
        onResume={handleTogglePause}
        onRestart={handleRestart}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        totalCash={engineRef.current?.totalCashEarned || 0}
        customersServed={customersServed}
      />
    </div>
  );
}
