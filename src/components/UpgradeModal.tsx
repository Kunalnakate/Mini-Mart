import React from 'react';
import { X, Zap, Backpack, Gauge, Sprout, Bot, Coins, Layers } from 'lucide-react';
import { UpgradeState } from '../game/types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCash: number;
  upgrades: UpgradeState;
  onUpgrade: (key: keyof UpgradeState, cost: number) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  playerCash,
  upgrades,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const UPGRADE_CONFIGS: Array<{
    key: keyof UpgradeState;
    title: string;
    description: string;
    icon: React.ReactNode;
    baseCost: number;
    costMultiplier: number;
    iconBg: string;
  }> = [
    {
      key: 'carryCapacity',
      title: 'Backpack Capacity',
      description: 'Stack +2 extra items in hands (up to 22)',
      icon: <Backpack className="w-5 h-5 text-emerald-600" />,
      baseCost: 35,
      costMultiplier: 1.52,
      iconBg: 'bg-emerald-50 border-emerald-200',
    },
    {
      key: 'moveSpeed',
      title: 'Runner Sprint',
      description: 'Increase player running speed by +10%',
      icon: <Gauge className="w-5 h-5 text-sky-600" />,
      baseCost: 30,
      costMultiplier: 1.48,
      iconBg: 'bg-sky-50 border-sky-200',
    },
    {
      key: 'cropGrowthRate',
      title: 'Organic Fertilizer',
      description: 'Crops, hens & kitchens produce 25% faster',
      icon: <Sprout className="w-5 h-5 text-amber-600" />,
      baseCost: 45,
      costMultiplier: 1.55,
      iconBg: 'bg-amber-50 border-amber-200',
    },
    {
      key: 'helperSpeed',
      title: 'Helper Bot Overclock',
      description: 'Boost stocker helper bots travel & stock speed',
      icon: <Bot className="w-5 h-5 text-purple-600" />,
      baseCost: 60,
      costMultiplier: 1.58,
      iconBg: 'bg-purple-50 border-purple-200',
    },
    {
      key: 'tipJar',
      title: 'Customer Tip Jar',
      description: 'Shoppers leave +5% extra cash tips at register',
      icon: <Coins className="w-5 h-5 text-yellow-600" />,
      baseCost: 75,
      costMultiplier: 1.58,
      iconBg: 'bg-yellow-50 border-yellow-200',
    },
    {
      key: 'shelfCapacity',
      title: 'Shelf Restock Volume',
      description: 'Display shelves hold up to 32 items',
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      baseCost: 90,
      costMultiplier: 1.6,
      iconBg: 'bg-indigo-50 border-indigo-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-sm">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Supermarket Upgrades</h2>
              <p className="text-xs font-semibold text-slate-500">Boost efficiency, automate, and scale to 10 levels</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Banner */}
        <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800">Available Revenue:</span>
          <span className="text-lg font-black text-emerald-900 tabular-nums">${playerCash.toLocaleString()}</span>
        </div>

        {/* Upgrade Cards List */}
        <div className="p-5 flex flex-col gap-3 max-h-[62vh] overflow-y-auto">
          {UPGRADE_CONFIGS.map((cfg) => {
            const currentLevel = upgrades[cfg.key] || 1;
            const isMax = currentLevel >= 10;
            const cost = Math.floor(cfg.baseCost * Math.pow(cfg.costMultiplier, currentLevel - 1));
            const canAfford = playerCash >= cost && !isMax;

            return (
              <div
                key={cfg.key}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                    {cfg.icon}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{cfg.title}</div>
                    <div className="text-xs text-slate-500">{cfg.description}</div>

                    {/* Level Progress Bar (1-10) */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${(currentLevel / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {isMax ? 'MAX' : `Lv. ${currentLevel}/10`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upgrade Action Button */}
                <button
                  disabled={!canAfford}
                  onClick={() => onUpgrade(cfg.key, cost)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs shrink-0 cursor-pointer ${
                    isMax
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : canAfford
                      ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isMax ? 'MAX' : `$${cost.toLocaleString()}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            Back to Supermarket
          </button>
        </div>
      </div>
    </div>
  );
};
