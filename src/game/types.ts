export type ItemType = 'tomato' | 'apple' | 'egg' | 'bread' | 'juice' | 'coffee' | 'cheese';

export interface ItemInfo {
  type: ItemType;
  name: string;
  icon: string;
  color: number;
  price: number;
}

export const ITEM_DEFS: Record<ItemType, ItemInfo> = {
  tomato: { type: 'tomato', name: 'Fresh Tomato', icon: '🍅', color: 0xef4444, price: 10 },
  apple: { type: 'apple', name: 'Crisp Apple', icon: '🍎', color: 0xe11d48, price: 18 },
  egg: { type: 'egg', name: 'Farm Egg', icon: '🥚', color: 0xfef08a, price: 30 },
  bread: { type: 'bread', name: 'Artisan Baguette', icon: '🥖', color: 0xd97706, price: 55 },
  juice: { type: 'juice', name: 'Blended Juice', icon: '🧃', color: 0xf97316, price: 90 },
  coffee: { type: 'coffee', name: 'Espresso Latte', icon: '☕', color: 0x78350f, price: 150 },
  cheese: { type: 'cheese', name: 'Gourmet Cheese', icon: '🧀', color: 0xfacc15, price: 240 },
};

export interface UpgradeState {
  carryCapacity: number; // level 1..10 (base 4, +2 per level -> up to 22)
  moveSpeed: number; // level 1..10 (+10% per level)
  cropGrowthRate: number; // level 1..10 (+25% speed per level)
  helperSpeed: number; // level 1..10 (+0.6m/s per level)
  tipJar: number; // level 1..10 (+5% customer tip bonus per level)
  shelfCapacity: number; // level 1..10 (max items per shelf 12..30)
}

export interface QuestGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface StoreEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number; // seconds remaining
  multiplierType: 'spawn_surge' | 'growth_boost' | 'cafe_surge' | 'vip_wave';
  multiplier: number;
  bannerColor: string;
}

export interface UnlockPad {
  id: string;
  label: string;
  cost: number;
  currentPaid: number;
  unlocked: boolean;
  x: number;
  z: number;
  radius: number;
  category: 'crop' | 'shelf' | 'helper' | 'machine' | 'wing';
  icon: string;
  targetId: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  scale: number;
}

export interface FlyingCoin {
  id: string;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  progress: number;
  speed: number;
  value: number;
}
