import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import confetti from 'canvas-confetti';
import { ItemType, ITEM_DEFS, UnlockPad, UpgradeState, QuestGoal, StoreEvent } from './types';
import { sound } from './audio';
import {
  createFloorTexture,
  createLushGrassTexture,
  createCobblestoneTexture,
  createItemMesh,
  createCharacterModel,
  createCustomerBag,
  createShoppingBasket,
  createToteBag,
  createDiverseCustomerModel,
  CustomerArchetype,
  createTomatoFieldModel,
  createAppleTreeModel,
  createChickenCoopModel,
  createJuicerModel,
  createDisplayShelfModel,
  createCheckoutCounterModel,
  createSupermarketBuilding,
  createUnlockPadMesh,
  createBakeryOvenModel,
  createCoffeeBarModel,
  createCheeseCellarModel,
  createSelfCheckoutModel,
  createEmpireMonumentModel,
  CharacterModelData,
} from './models';
import { WeatherSystem, WeatherType } from './weather';

// Pre-allocated math helpers to ensure zero GC in animation loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export interface CustomerData {
  id: string;
  model: CharacterModelData;
  archetype: CustomerArchetype;
  state: 'entering' | 'shopping' | 'queuing' | 'leaving';
  targetItem: ItemType;
  itemsNeeded: number;
  itemsGathered: number;
  targetPos: THREE.Vector3;
  waitTimer: number;
  walkPhase: number;
  currentAngle: number;
  targetAngle: number;
  moveSpeed: number;
  strideRate: number;
  browseDuration: number;
}

export interface FlyingItem {
  mesh: THREE.Group;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  progress: number;
  speed: number;
  arcHeight: number;
  onComplete: () => void;
}

export interface FloatingCoinFx {
  mesh: THREE.Group;
  startPos: THREE.Vector3;
  targetActor: 'player';
  progress: number;
  value: number;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private lastTime: number = 0;
  private isDestroyed: boolean = false;
  private isPaused: boolean = false;
  private isTitleScreen: boolean = true;

  // Player State
  public playerCash: number = 0;
  public totalCashEarned: number = 0;
  public customersServed: number = 0;
  public playerStack: ItemType[] = [];
  public upgrades: UpgradeState = {
    carryCapacity: 1, // base 4 items (up to 22 at Lv 10)
    moveSpeed: 1,
    cropGrowthRate: 1,
    helperSpeed: 1,
    tipJar: 1,
    shelfCapacity: 1,
  };

  private playerPos = new THREE.Vector3(0, 0, 4);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private playerAngle: number = 0;
  private playerWalkPhase: number = 0;
  private playerStackWobbleX: number = 0;
  private playerStackWobbleZ: number = 0;
  private playerModel!: CharacterModelData;
  private playerStackMeshes: THREE.Group[] = [];

  // Stocker Helper Bot 1
  public helperUnlocked: boolean = false;
  private helperPos = new THREE.Vector3(-4, 0, 2);
  private helperModel!: CharacterModelData;
  private helperStack: ItemType[] = [];
  private helperStackMeshes: THREE.Group[] = [];
  private helperWalkPhase: number = 0;
  private helperState: 'idle' | 'harvesting' | 'stocking' = 'idle';
  private helperTargetItem: ItemType = 'tomato';

  // Stocker Helper Bot 2 (Senior Bot)
  public helper2Unlocked: boolean = false;
  private helper2Pos = new THREE.Vector3(2, 0, 2);
  private helper2Model!: CharacterModelData;
  private helper2Stack: ItemType[] = [];
  private helper2StackMeshes: THREE.Group[] = [];
  private helper2WalkPhase: number = 0;
  private helper2State: 'idle' | 'harvesting' | 'stocking' = 'idle';
  private helper2TargetItem: ItemType = 'bread';

  // Cashier Bot
  public cashierUnlocked: boolean = false;
  private cashierModel!: CharacterModelData;

  // Input State
  private inputVector = new THREE.Vector2(0, 0);
  private keysHeld: Record<string, boolean> = {};

  // World Props & Stations
  private tomatoField!: ReturnType<typeof createTomatoFieldModel>;
  private appleTree!: ReturnType<typeof createAppleTreeModel>;
  private chickenCoop!: ReturnType<typeof createChickenCoopModel>;
  private bakeryOven!: ReturnType<typeof createBakeryOvenModel>;
  private juicer!: ReturnType<typeof createJuicerModel>;
  private coffeeBar!: ReturnType<typeof createCoffeeBarModel>;
  private cheeseCellar!: ReturnType<typeof createCheeseCellarModel>;
  private checkoutCounter!: ReturnType<typeof createCheckoutCounterModel>;
  private selfCheckout!: ReturnType<typeof createSelfCheckoutModel>;
  private empireMonument!: ReturnType<typeof createEmpireMonumentModel>;

  // Display Shelves (7 Total)
  private tomatoShelf!: ReturnType<typeof createDisplayShelfModel>;
  private appleShelf!: ReturnType<typeof createDisplayShelfModel>;
  private eggShelf!: ReturnType<typeof createDisplayShelfModel>;
  private breadShelf!: ReturnType<typeof createDisplayShelfModel>;
  private juiceShelf!: ReturnType<typeof createDisplayShelfModel>;
  private coffeeShelf!: ReturnType<typeof createDisplayShelfModel>;
  private cheeseShelf!: ReturnType<typeof createDisplayShelfModel>;

  // Stock Counts (All 7 Items)
  public shelfStock: Record<ItemType, number> = {
    tomato: 8,
    apple: 0,
    egg: 0,
    bread: 0,
    juice: 0,
    coffee: 0,
    cheese: 0,
  };

  // Station Ready Counts
  private fieldReady: Record<ItemType, number> = {
    tomato: 6,
    apple: 0,
    egg: 0,
    bread: 0,
    juice: 0,
    coffee: 0,
    cheese: 0,
  };
  private fieldTimers: Record<ItemType, number> = {
    tomato: 0,
    apple: 0,
    egg: 0,
    bread: 0,
    juice: 0,
    coffee: 0,
    cheese: 0,
  };

  // Unlocked zones (18 Milestones across 30-min curve)
  public unlockedZones = {
    appleTree: false,
    appleShelf: false,
    helperBot: false,
    chickenCoop: false,
    eggShelf: false,
    cashierBot: false,
    bakeryOven: false,
    breadShelf: false,
    juicer: false,
    juiceShelf: false,
    helperBot2: false,
    coffeeBar: false,
    coffeeShelf: false,
    cheeseCellar: false,
    cheeseShelf: false,
    selfCheckout: false,
    empireWing: false,
    trophy: false,
  };

  // Unlock Pads
  public unlockPads: UnlockPad[] = [];
  private padMeshes = new Map<string, ReturnType<typeof createUnlockPadMesh>>();

  // Customers & Queuing
  private customers: CustomerData[] = [];
  private customerSpawnTimer: number = 0;
  private checkoutQueue: CustomerData[] = [];
  private checkoutScanTimer: number = 0;
  private selfScanTimer: number = 0;

  // Active FX animations
  private flyingItems: FlyingItem[] = [];
  private flyingCoins: FloatingCoinFx[] = [];

  // Store Reputation Stars & Dynamic Events
  public storeStars: number = 1;
  public currentEvent: StoreEvent | null = null;
  private nextEventCountdown: number = 75; // first event at 75s

  // Milestone Quests System
  public quests: QuestGoal[] = [];
  public activeQuestIndex: number = 0;

  // Callbacks to React HUD
  public onStateUpdate?: (data: {
    cash: number;
    stackCount: number;
    maxStack: number;
    customersServed: number;
    shelfStock: Record<ItemType, number>;
    storeStars: number;
    currentEvent: StoreEvent | null;
    activeQuest: QuestGoal | null;
  }) => void;
  public onJoystickState?: (state: {
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }) => void;
  public onFloatingReward?: (reward: {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
  }) => void;
  public onWeatherChange?: (weather: WeatherType) => void;

  // Weather System & Lighting Rig
  public weatherSystem!: WeatherSystem;
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // HUD state change tracking
  private hudUpdateTimer: number = 0;
  private lastCash: number = -1;
  private lastStackCount: number = -1;
  private lastCustomers: number = -1;
  private lastStars: number = -1;
  private lastEventId: string | null = null;
  private shelfStockDirty: boolean = true;

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect software WebGL from GPU renderer string
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0fdf4); // fresh market pastel green
    this.scene.fog = new THREE.Fog(0xf0fdf4, 25, 48);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 18, 17);
    this.camera.lookAt(0, 0, 0);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig
    this.setupLighting();

    // Weather System (Dynamic outdoor rain / sunny particles & lighting atmosphere)
    this.weatherSystem = new WeatherSystem(this.scene, this.isSoftwareGl);
    this.weatherSystem.onWeatherChange = (weather) => {
      if (this.onWeatherChange) {
        this.onWeatherChange(weather);
      }
    };

    // Build World (Supermarket floor, buildings, initial zones)
    this.initSupermarket();
    this.initUnlockPads();

    // Bind Event Listeners
    this.bindInputs();

    // Start Simulation Loop
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.frameId = requestAnimationFrame(this.tick);
  }

  private setupLighting() {
    // Warm key sun light with soft shadows
    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.keyLight.position.set(12, 22, 14);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 60;
    const d = 16;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Cool ambient hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xfef3c7, 0.9);
    this.scene.add(this.hemiLight);
  }

  private initSupermarket() {
    // 1. Lush Green Grass Outer Ground Environment (Vast 90x90 terrain)
    const grassGeo = new THREE.PlaneGeometry(90, 90);
    grassGeo.rotateX(-Math.PI / 2);
    const grassMat = new THREE.MeshStandardMaterial({
      map: createLushGrassTexture(),
      roughness: 0.85,
      metalness: 0.05,
    });
    const grassGround = new THREE.Mesh(grassGeo, grassMat);
    grassGround.position.y = 0;
    grassGround.receiveShadow = true;
    this.scene.add(grassGround);

    // 2. Supermarket Indoor Polished Floor Pad
    const floorGeo = new THREE.PlaneGeometry(32, 28);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      roughness: 0.25,
      metalness: 0.05,
      map: createFloorTexture(),
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0.02;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Dark walnut wooden floor threshold border framing the store
    const woodBorderMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
    const borderLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 28.5), woodBorderMat);
    borderLeft.position.set(-16.1, 0.04, 0);
    this.scene.add(borderLeft);

    const borderRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 28.5), woodBorderMat);
    borderRight.position.set(16.1, 0.04, 0);
    this.scene.add(borderRight);

    const borderBack = new THREE.Mesh(new THREE.BoxGeometry(32.5, 0.08, 0.5), woodBorderMat);
    borderBack.position.set(0, 0.04, -14.1);
    this.scene.add(borderBack);

    // 3. Cobblestone / Flagstone Walkways
    const stonePathMat = new THREE.MeshStandardMaterial({
      map: createCobblestoneTexture(),
      roughness: 0.8,
    });

    // Walkway outside main entrance
    const frontPathGeo = new THREE.PlaneGeometry(5.2, 14);
    frontPathGeo.rotateX(-Math.PI / 2);
    const frontPath = new THREE.Mesh(frontPathGeo, stonePathMat);
    frontPath.position.set(0, 0.025, 20);
    frontPath.receiveShadow = true;
    this.scene.add(frontPath);

    // Cross-walkway connecting entrance to Tomato patch and Chicken coop
    const crossPathGeo = new THREE.PlaneGeometry(24, 3.2);
    crossPathGeo.rotateX(-Math.PI / 2);
    const crossPath = new THREE.Mesh(crossPathGeo, stonePathMat);
    crossPath.position.set(0, 0.025, 14.5);
    crossPath.receiveShadow = true;
    this.scene.add(crossPath);

    // 4. Perimeter Decorative Trees & Hedge Shrubs
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });

    const treePositions = [
      [-22, 18], [-12, 24], [12, 24], [22, 18],
      [-24, -2], [-24, -16], [24, -2], [24, -16],
      [-14, -22], [14, -22]
    ];

    treePositions.forEach(([tx, tz]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      // Wood trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.8, 8), treeMat);
      trunk.position.y = 1.4;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Fluffy foliage crown (3 overlapping spheres)
      const crown1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), foliageMat);
      crown1.position.set(0, 3.4, 0);
      crown1.castShadow = true;
      treeGroup.add(crown1);

      const crown2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), foliageMat);
      crown2.position.set(0.7, 3.8, 0.5);
      crown2.castShadow = true;
      treeGroup.add(crown2);

      this.scene.add(treeGroup);
    });

    // Hedge fences along back and sides
    const hedgeGeo = new THREE.BoxGeometry(4.5, 1.2, 0.8);
    const hedgeOffsets = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
    hedgeOffsets.forEach((hx) => {
      const hedgeBack = new THREE.Mesh(hedgeGeo, hedgeMat);
      hedgeBack.position.set(hx, 0.6, -24);
      hedgeBack.castShadow = true;
      this.scene.add(hedgeBack);
    });

    // 5. Supermarket Perimeter Building & Entry Glass Doors
    const building = createSupermarketBuilding();
    this.scene.add(building);

    // Player Model (Bright green overalls & cap)
    this.playerModel = createCharacterModel({
      shirtColor: 0xffffff,
      pantsColor: 0x15803d,
      capColor: 0x16a34a,
      isPlayer: true,
      apronColor: 0x22c55e,
    });
    this.playerModel.root.position.copy(this.playerPos);
    this.scene.add(this.playerModel.root);

    // Helper Model (Cyan worker uniform)
    this.helperModel = createCharacterModel({
      shirtColor: 0x0284c7,
      pantsColor: 0x0369a1,
      capColor: 0x38bdf8,
      isWorker: true,
      apronColor: 0x0ea5e9,
    });
    this.helperModel.root.position.copy(this.helperPos);
    this.helperModel.root.visible = false;
    this.scene.add(this.helperModel.root);

    // Cashier Model (Amber register assistant)
    this.cashierModel = createCharacterModel({
      shirtColor: 0xd97706,
      pantsColor: 0x92400e,
      capColor: 0xf59e0b,
      isWorker: true,
      apronColor: 0xfbbf24,
    });
    this.cashierModel.root.position.set(2.4, 0, -4.5);
    this.cashierModel.root.rotation.y = Math.PI;
    this.cashierModel.root.visible = false;
    this.scene.add(this.cashierModel.root);

    // 1. Tomato Field (Bottom-Left)
    this.tomatoField = createTomatoFieldModel();
    this.tomatoField.root.position.set(-8.5, 0, 7.5);
    this.scene.add(this.tomatoField.root);

    // 2. Tomato Display Shelf (Upper-Left)
    this.tomatoShelf = createDisplayShelfModel('tomato');
    this.tomatoShelf.root.position.set(-7.5, 0, -2);
    this.scene.add(this.tomatoShelf.root);
    this.tomatoShelf.setStockCount(this.shelfStock.tomato);

    // 3. Checkout Counter (Upper-Right)
    this.checkoutCounter = createCheckoutCounterModel();
    this.checkoutCounter.root.position.set(4.5, 0, -4.5);
    this.scene.add(this.checkoutCounter.root);

    // 4. Apple Orchard Stand (Upper-Center-Left, unlocked later)
    this.appleTree = createAppleTreeModel();
    this.appleTree.root.position.set(-11, 0, -9);
    this.appleTree.root.visible = false;
    this.scene.add(this.appleTree.root);

    // 5. Apple Display Shelf
    this.appleShelf = createDisplayShelfModel('apple');
    this.appleShelf.root.position.set(-3.5, 0, -2);
    this.appleShelf.root.visible = false;
    this.scene.add(this.appleShelf.root);

    // 6. Chicken Coop (Bottom-Right)
    this.chickenCoop = createChickenCoopModel();
    this.chickenCoop.root.position.set(8.5, 0, 7.5);
    this.chickenCoop.root.visible = false;
    this.scene.add(this.chickenCoop.root);

    // 7. Egg Display Shelf
    this.eggShelf = createDisplayShelfModel('egg');
    this.eggShelf.root.position.set(0.5, 0, -2);
    this.eggShelf.root.visible = false;
    this.scene.add(this.eggShelf.root);

    // 8. Juice Machine (Far Top-Right)
    this.juicer = createJuicerModel();
    this.juicer.root.position.set(11, 0, -9);
    this.juicer.root.visible = false;
    this.scene.add(this.juicer.root);

    // 9. Juice Display Shelf
    this.juiceShelf = createDisplayShelfModel('juice');
    this.juiceShelf.root.position.set(-3.5, 0, 3.5);
    this.juiceShelf.root.visible = false;
    this.scene.add(this.juiceShelf.root);

    // 10. Helper Model 2 (Senior Stocker Bot in royal purple)
    this.helper2Model = createCharacterModel({
      shirtColor: 0x7c3aed,
      pantsColor: 0x5b21b6,
      capColor: 0x8b5cf6,
      isWorker: true,
      apronColor: 0xa855f7,
    });
    this.helper2Model.root.position.copy(this.helper2Pos);
    this.helper2Model.root.visible = false;
    this.scene.add(this.helper2Model.root);

    // 11. Bakery Stone Oven
    this.bakeryOven = createBakeryOvenModel();
    this.bakeryOven.root.position.set(-8.5, 0, -9);
    this.bakeryOven.root.visible = false;
    this.scene.add(this.bakeryOven.root);

    // 12. Bread Display Shelf
    this.breadShelf = createDisplayShelfModel('bread');
    this.breadShelf.root.position.set(-7.5, 0, 3.5);
    this.breadShelf.root.visible = false;
    this.scene.add(this.breadShelf.root);

    // 13. Barista Espresso Coffee Bar
    this.coffeeBar = createCoffeeBarModel();
    this.coffeeBar.root.position.set(5.5, 0, 3.5);
    this.coffeeBar.root.visible = false;
    this.scene.add(this.coffeeBar.root);

    // 14. Coffee Display Shelf
    this.coffeeShelf = createDisplayShelfModel('coffee');
    this.coffeeShelf.root.position.set(0.5, 0, 3.5);
    this.coffeeShelf.root.visible = false;
    this.scene.add(this.coffeeShelf.root);

    // 15. Artisan Cheese Cellar
    this.cheeseCellar = createCheeseCellarModel();
    this.cheeseCellar.root.position.set(11, 0, -2);
    this.cheeseCellar.root.visible = false;
    this.scene.add(this.cheeseCellar.root);

    // 16. Cheese Display Shelf
    this.cheeseShelf = createDisplayShelfModel('cheese');
    this.cheeseShelf.root.position.set(4.5, 0, -9);
    this.cheeseShelf.root.visible = false;
    this.scene.add(this.cheeseShelf.root);

    // 17. Express Self-Checkout Scanner
    this.selfCheckout = createSelfCheckoutModel();
    this.selfCheckout.root.position.set(8.2, 0, -4.5);
    this.selfCheckout.root.visible = false;
    this.scene.add(this.selfCheckout.root);

    // 18. Grand Empire Diamond Monument
    this.empireMonument = createEmpireMonumentModel();
    this.empireMonument.root.position.set(0, 0, -9);
    this.empireMonument.root.visible = false;
    this.scene.add(this.empireMonument.root);

    this.initQuests();
  }

  private initQuests() {
    this.quests = [
      { id: 'q1', title: 'Farm Fresh', description: 'Harvest 15 Tomatoes', target: 15, current: 0, reward: 100, completed: false, claimed: false, icon: '🍅' },
      { id: 'q2', title: 'First Shoppers', description: 'Serve 10 Customers', target: 10, current: 0, reward: 200, completed: false, claimed: false, icon: '👥' },
      { id: 'q3', title: 'Automation Era', description: 'Hire Stocker Bot 1', target: 1, current: 0, reward: 350, completed: false, claimed: false, icon: '🤖' },
      { id: 'q4', title: 'Warm Crust', description: 'Unlock the Bakery Oven', target: 1, current: 0, reward: 650, completed: false, claimed: false, icon: '🥖' },
      { id: 'q5', title: 'Market Rush', description: 'Serve 35 Customers', target: 35, current: 0, reward: 1100, completed: false, claimed: false, icon: '⚡' },
      { id: 'q6', title: 'Caffeine Boost', description: 'Open the Espresso Cafe', target: 1, current: 0, reward: 1800, completed: false, claimed: false, icon: '☕' },
      { id: 'q7', title: 'Senior Staff', description: 'Hire Senior Stocker Bot 2', target: 1, current: 0, reward: 2600, completed: false, claimed: false, icon: '🤖' },
      { id: 'q8', title: 'Deli Gourmet', description: 'Open Cheese Aging Cellar', target: 1, current: 0, reward: 3800, completed: false, claimed: false, icon: '🧀' },
      { id: 'q9', title: 'Express Speed', description: 'Install Express Self-Checkout', target: 1, current: 0, reward: 5500, completed: false, claimed: false, icon: '💳' },
      { id: 'q10', title: 'Retail Empire', description: 'Construct Empire Monument', target: 1, current: 0, reward: 15000, completed: false, claimed: false, icon: '👑' },
    ];
  }

  public claimQuestReward(questId: string): boolean {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || !q.completed || q.claimed) return false;
    q.claimed = true;
    this.playerCash += q.reward;
    this.totalCashEarned += q.reward;
    sound.playCoin();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    if (this.onFloatingReward) {
      this.onFloatingReward({
        id: Math.random().toString(),
        text: `QUEST REWARD: +$${q.reward}`,
        x: window.innerWidth * 0.5,
        y: 180,
        color: '#10b981',
      });
    }
    return true;
  }

  private initUnlockPads() {
    this.unlockPads = [
      {
        id: 'pad_apple_tree',
        label: 'Apple Orchard',
        cost: 40,
        currentPaid: 0,
        unlocked: false,
        x: -11,
        z: -9,
        radius: 1.5,
        category: 'crop',
        icon: '🍎',
        targetId: 'appleTree',
      },
      {
        id: 'pad_apple_shelf',
        label: 'Apple Stand',
        cost: 75,
        currentPaid: 0,
        unlocked: false,
        x: -3.5,
        z: -2,
        radius: 1.5,
        category: 'shelf',
        icon: '🍎',
        targetId: 'appleShelf',
      },
      {
        id: 'pad_helper',
        label: 'Hire Stocker Bot 1',
        cost: 160,
        currentPaid: 0,
        unlocked: false,
        x: -4,
        z: 7.5,
        radius: 1.5,
        category: 'helper',
        icon: '🤖',
        targetId: 'helperBot',
      },
      {
        id: 'pad_chicken_coop',
        label: 'Egg Hen Coop',
        cost: 280,
        currentPaid: 0,
        unlocked: false,
        x: 8.5,
        z: 7.5,
        radius: 1.5,
        category: 'crop',
        icon: '🥚',
        targetId: 'chickenCoop',
      },
      {
        id: 'pad_egg_shelf',
        label: 'Farm Egg Stand',
        cost: 420,
        currentPaid: 0,
        unlocked: false,
        x: 0.5,
        z: -2,
        radius: 1.5,
        category: 'shelf',
        icon: '🥚',
        targetId: 'eggShelf',
      },
      {
        id: 'pad_cashier',
        label: 'Hire Cashier Bot',
        cost: 650,
        currentPaid: 0,
        unlocked: false,
        x: 6.2,
        z: -4.5,
        radius: 1.4,
        category: 'helper',
        icon: '💳',
        targetId: 'cashierBot',
      },
      {
        id: 'pad_bakery',
        label: 'Bakery Stone Oven',
        cost: 1050,
        currentPaid: 0,
        unlocked: false,
        x: -8.5,
        z: -7,
        radius: 1.6,
        category: 'machine',
        icon: '🥖',
        targetId: 'bakeryOven',
      },
      {
        id: 'pad_bread_shelf',
        label: 'Fresh Bread Stand',
        cost: 1500,
        currentPaid: 0,
        unlocked: false,
        x: -7.5,
        z: 5,
        radius: 1.5,
        category: 'shelf',
        icon: '🥖',
        targetId: 'breadShelf',
      },
      {
        id: 'pad_juicer',
        label: 'Fresh Juicer Press',
        cost: 2100,
        currentPaid: 0,
        unlocked: false,
        x: 11,
        z: -7,
        radius: 1.6,
        category: 'machine',
        icon: '🧃',
        targetId: 'juicer',
      },
      {
        id: 'pad_juice_shelf',
        label: 'Juice Cooler',
        cost: 2900,
        currentPaid: 0,
        unlocked: false,
        x: -3.5,
        z: 5,
        radius: 1.5,
        category: 'shelf',
        icon: '🧃',
        targetId: 'juiceShelf',
      },
      {
        id: 'pad_helper2',
        label: 'Hire Senior Stocker Bot 2',
        cost: 4200,
        currentPaid: 0,
        unlocked: false,
        x: 0,
        z: 7.5,
        radius: 1.5,
        category: 'helper',
        icon: '🤖',
        targetId: 'helperBot2',
      },
      {
        id: 'pad_coffee_bar',
        label: 'Barista Espresso Bar',
        cost: 5800,
        currentPaid: 0,
        unlocked: false,
        x: 5.5,
        z: 5,
        radius: 1.6,
        category: 'machine',
        icon: '☕',
        targetId: 'coffeeBar',
      },
      {
        id: 'pad_coffee_shelf',
        label: 'Cafe Coffee Stand',
        cost: 7600,
        currentPaid: 0,
        unlocked: false,
        x: 0.5,
        z: 5,
        radius: 1.5,
        category: 'shelf',
        icon: '☕',
        targetId: 'coffeeShelf',
      },
      {
        id: 'pad_cheese_cellar',
        label: 'Artisan Cheese Cellar',
        cost: 9800,
        currentPaid: 0,
        unlocked: false,
        x: 11,
        z: 0,
        radius: 1.6,
        category: 'machine',
        icon: '🧀',
        targetId: 'cheeseCellar',
      },
      {
        id: 'pad_cheese_shelf',
        label: 'Gourmet Cheese Shelf',
        cost: 12500,
        currentPaid: 0,
        unlocked: false,
        x: 4.5,
        z: -7,
        radius: 1.5,
        category: 'shelf',
        icon: '🧀',
        targetId: 'cheeseShelf',
      },
      {
        id: 'pad_self_checkout',
        label: 'Express Self-Checkout',
        cost: 16500,
        currentPaid: 0,
        unlocked: false,
        x: 8.2,
        z: -3,
        radius: 1.4,
        category: 'helper',
        icon: '⚡',
        targetId: 'selfCheckout',
      },
      {
        id: 'pad_empire_wing',
        label: 'Market Expansion Wing',
        cost: 24000,
        currentPaid: 0,
        unlocked: false,
        x: 0,
        z: 12,
        radius: 1.8,
        category: 'wing',
        icon: '🏛️',
        targetId: 'empireWing',
      },
      {
        id: 'pad_trophy',
        label: 'Diamond Empire Monument',
        cost: 38000,
        currentPaid: 0,
        unlocked: false,
        x: 0,
        z: -7,
        radius: 1.8,
        category: 'wing',
        icon: '👑',
        targetId: 'trophy',
      },
    ];

    this.refreshActiveUnlockPads();
  }

  private refreshActiveUnlockPads() {
    this.unlockPads.forEach((pad) => {
      let isVisible = false;

      // Sequential 18-step progression across 30-minute curve
      if (pad.id === 'pad_apple_tree' && !this.unlockedZones.appleTree) isVisible = true;
      else if (pad.id === 'pad_apple_shelf' && this.unlockedZones.appleTree && !this.unlockedZones.appleShelf) isVisible = true;
      else if (pad.id === 'pad_helper' && this.unlockedZones.appleShelf && !this.unlockedZones.helperBot) isVisible = true;
      else if (pad.id === 'pad_chicken_coop' && this.unlockedZones.appleShelf && !this.unlockedZones.chickenCoop) isVisible = true;
      else if (pad.id === 'pad_egg_shelf' && this.unlockedZones.chickenCoop && !this.unlockedZones.eggShelf) isVisible = true;
      else if (pad.id === 'pad_cashier' && this.unlockedZones.eggShelf && !this.unlockedZones.cashierBot) isVisible = true;
      else if (pad.id === 'pad_bakery' && this.unlockedZones.cashierBot && !this.unlockedZones.bakeryOven) isVisible = true;
      else if (pad.id === 'pad_bread_shelf' && this.unlockedZones.bakeryOven && !this.unlockedZones.breadShelf) isVisible = true;
      else if (pad.id === 'pad_juicer' && this.unlockedZones.breadShelf && !this.unlockedZones.juicer) isVisible = true;
      else if (pad.id === 'pad_juice_shelf' && this.unlockedZones.juicer && !this.unlockedZones.juiceShelf) isVisible = true;
      else if (pad.id === 'pad_helper2' && this.unlockedZones.juiceShelf && !this.unlockedZones.helperBot2) isVisible = true;
      else if (pad.id === 'pad_coffee_bar' && this.unlockedZones.juiceShelf && !this.unlockedZones.coffeeBar) isVisible = true;
      else if (pad.id === 'pad_coffee_shelf' && this.unlockedZones.coffeeBar && !this.unlockedZones.coffeeShelf) isVisible = true;
      else if (pad.id === 'pad_cheese_cellar' && this.unlockedZones.coffeeShelf && !this.unlockedZones.cheeseCellar) isVisible = true;
      else if (pad.id === 'pad_cheese_shelf' && this.unlockedZones.cheeseCellar && !this.unlockedZones.cheeseShelf) isVisible = true;
      else if (pad.id === 'pad_self_checkout' && this.unlockedZones.cheeseShelf && !this.unlockedZones.selfCheckout) isVisible = true;
      else if (pad.id === 'pad_empire_wing' && this.unlockedZones.selfCheckout && !this.unlockedZones.empireWing) isVisible = true;
      else if (pad.id === 'pad_trophy' && this.unlockedZones.empireWing && !this.unlockedZones.trophy) isVisible = true;

      let meshData = this.padMeshes.get(pad.id);
      if (isVisible) {
        if (!meshData) {
          meshData = createUnlockPadMesh(pad);
          this.scene.add(meshData.root);
          this.padMeshes.set(pad.id, meshData);
        }
        meshData.root.visible = true;
      } else if (meshData) {
        meshData.root.visible = false;
      }
    });
  }

  // Keyboard and Pointer Controls
  private bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.keysHeld[e.code] = true;
      if (e.code === 'KeyM') {
        sound.setMuted(!sound.getMuted());
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keysHeld = {};
      this.inputVector.set(0, 0);
    });

    // Pointer Drag / Joystick support
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      isDragging = true;
      startX = clientX;
      startY = clientY;
      if (this.onJoystickState) {
        this.onJoystickState({
          active: true,
          startX,
          startY,
          currentX: startX,
          currentY: startY,
        });
      }
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        const clampedDist = Math.min(dist, 70) / 70;
        this.inputVector.x = (dx / dist) * clampedDist;
        this.inputVector.y = (dy / dist) * clampedDist;
      } else {
        this.inputVector.set(0, 0);
      }
      if (this.onJoystickState) {
        this.onJoystickState({
          active: true,
          startX,
          startY,
          currentX: clientX,
          currentY: clientY,
        });
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      this.inputVector.set(0, 0);
      if (this.onJoystickState) {
        this.onJoystickState({
          active: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
        });
      }
    };

    this.container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  }

  public setVirtualInput(x: number, y: number) {
    this.inputVector.set(x, y);
  }

  public getMaxCarry(): number {
    return 2 + this.upgrades.carryCapacity * 2; // lvl 1 = 4, lvl 2 = 6, up to 22 at lvl 10
  }

  public getMaxShelfCapacity(): number {
    return 10 + this.upgrades.shelfCapacity * 2; // lvl 1 = 12, up to 30 at lvl 10
  }

  public upgradeStat(key: keyof UpgradeState, cost: number): boolean {
    if (this.playerCash < cost) return false;
    this.playerCash -= cost;
    this.upgrades[key] = Math.min(10, this.upgrades[key] + 1);
    sound.playUpgrade();
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    return true;
  }

  public startGame() {
    this.isTitleScreen = false;
    sound.startStoreAudio();
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      sound.stopStoreAudio();
    } else if (!this.isTitleScreen) {
      sound.startStoreAudio();
    }
    return this.isPaused;
  }

  // Main 60fps Game Simulation Loop
  private tick(now: number) {
    if (this.isDestroyed) return;

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.033); // clamped at 30fps delta for stable 60fps+ physics

    if (!this.isPaused) {
      this.updateSimulation(dt, now / 1000);
    }

    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.tick);
  }

  private updateSimulation(dt: number, time: number) {
    // 0. Update Weather System (rain / sunny particles over outdoor zones, smooth lighting changes)
    this.weatherSystem.update(
      dt,
      time,
      this.keyLight,
      this.hemiLight,
      this.scene,
      this.renderer
    );

    // 1. Camera Title Screen Orbit or Follow Player
    if (this.isTitleScreen) {
      const angle = time * 0.18;
      this.camera.position.x = Math.sin(angle) * 16;
      this.camera.position.z = Math.cos(angle) * 16;
      this.camera.position.y = 15;
      this.camera.lookAt(0, 1, 0);
    } else {
      // Rock-solid isometric camera tracking:
      // Fixed look-at vector guarantees ZERO rotational camera shake or screen vibration
      const targetCamX = this.playerPos.x;
      const targetCamZ = this.playerPos.z + 14;
      const targetCamY = 16;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 8, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 8, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 8, dt);

      // Lock look-at target precisely relative to camera position to keep camera orientation frozen
      this.camera.lookAt(this.camera.position.x, 1, this.camera.position.z - 14);
    }

    // 2. Player Input & Kinematics
    let moveX = this.inputVector.x;
    let moveZ = this.inputVector.y;

    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) moveX -= 1;
    if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) moveX += 1;
    if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) moveZ -= 1;
    if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) moveZ += 1;

    const inputLen = Math.hypot(moveX, moveZ);
    const speedMult = 5.2 + this.upgrades.moveSpeed * 0.8;

    if (inputLen > 0.05) {
      const nx = moveX / inputLen;
      const nz = moveZ / inputLen;
      const targetAngle = Math.atan2(nx, nz);

      // Smooth rotate towards target move direction
      let diff = targetAngle - this.playerAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.playerAngle += diff * Math.min(1, dt * 14);

      this.playerVel.x = nx * speedMult;
      this.playerVel.z = nz * speedMult;

      this.playerWalkPhase += dt * speedMult * 2.8;

      // Inverted pendulum stack sway wobble
      const accelX = nx * 0.25;
      const accelZ = nz * 0.25;
      this.playerStackWobbleX = THREE.MathUtils.damp(this.playerStackWobbleX, -accelZ, 8, dt);
      this.playerStackWobbleZ = THREE.MathUtils.damp(this.playerStackWobbleZ, accelX, 8, dt);
    } else {
      this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, 0, 10, dt);
      this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, 0, 10, dt);
      this.playerStackWobbleX = THREE.MathUtils.damp(this.playerStackWobbleX, 0, 8, dt);
      this.playerStackWobbleZ = THREE.MathUtils.damp(this.playerStackWobbleZ, 0, 8, dt);
    }

    // Move player with velocity
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.z += this.playerVel.z * dt;

    // Solid collision resolution against counters, shelves, planters, and walls
    this.resolvePlayerObstacleCollisions();

    this.playerModel.root.position.copy(this.playerPos);
    this.playerModel.root.rotation.y = this.playerAngle;
    this.playerModel.updateAnimation(
      this.playerVel.length(),
      this.playerWalkPhase,
      this.playerStackWobbleX,
      this.playerStackWobbleZ
    );

    // 3. Update Crops & Growth Timers
    this.updateFarming(dt);

    // 4. Update Interactions (Harvesting, Stocking, Register Checkout)
    this.updateInteractions(dt);

    // 5. Update Unlock Pads
    this.updateUnlockPads(dt, time);

    // 6. Update Stocker Helper Bots AI
    if (this.unlockedZones.helperBot) {
      this.updateHelperBot(dt);
    }
    if (this.unlockedZones.helperBot2) {
      this.updateHelperBot2(dt);
    }

    // 7. Update Express Self-Checkout Scanner
    if (this.unlockedZones.selfCheckout) {
      this.updateSelfCheckout(dt, time);
    }

    // 8. Update Empire Diamond Monument rotation
    if (this.unlockedZones.trophy) {
      this.empireMonument.updateMonument(time);
    }

    // 9. Update Dynamic Store Events
    this.updateEvents(dt);

    // 10. Update Quests & Reputation Stars
    this.checkQuestProgress();

    // 11. Update Customer AI & Queuing
    this.updateCustomers(dt, time);

    // 12. Update Flying Item Particles & Magnet Coins
    this.updateFx(dt);

    // 13. Inform React HUD when state actually changes (throttled to avoid frame-rate drops)
    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer >= 0.08) {
      this.hudUpdateTimer = 0;
      const currentEventId = this.currentEvent ? this.currentEvent.id : null;
      if (
        this.onStateUpdate &&
        (this.lastCash !== this.playerCash ||
          this.lastStackCount !== this.playerStack.length ||
          this.lastCustomers !== this.customersServed ||
          this.lastStars !== this.storeStars ||
          this.lastEventId !== currentEventId ||
          this.shelfStockDirty)
      ) {
        this.lastCash = this.playerCash;
        this.lastStackCount = this.playerStack.length;
        this.lastCustomers = this.customersServed;
        this.lastStars = this.storeStars;
        this.lastEventId = currentEventId;
        this.shelfStockDirty = false;
        this.onStateUpdate({
          cash: this.playerCash,
          stackCount: this.playerStack.length,
          maxStack: this.getMaxCarry(),
          customersServed: this.customersServed,
          shelfStock: { ...this.shelfStock },
          storeStars: this.storeStars,
          currentEvent: this.currentEvent ? { ...this.currentEvent } : null,
          activeQuest: this.getActiveQuest(),
        });
      }
    }
  }

  // Solid obstacle collision resolution preventing walking through counters, shelves, and fixtures
  private resolvePlayerObstacleCollisions() {
    const playerRadius = 0.45;

    // Solid collision AABB boxes in the supermarket world
    const obstacles: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> = [
      // 1. Checkout Counter Desk (at x=4.5, z=-4.5)
      { minX: 3.25, maxX: 5.75, minZ: -5.35, maxZ: -3.65 },

      // 2. Tomato Display Shelf (at x=-7.5, z=-2)
      { minX: -8.65, maxX: -6.35, minZ: -2.75, maxZ: -1.25 },

      // 3. Apple Display Shelf (when unlocked at x=-3.5, z=-2)
      ...(this.unlockedZones.appleShelf
        ? [{ minX: -4.65, maxX: -2.35, minZ: -2.75, maxZ: -1.25 }]
        : []),

      // 4. Egg Display Shelf (when unlocked at x=0.5, z=-2)
      ...(this.unlockedZones.eggShelf
        ? [{ minX: -0.65, maxX: 1.65, minZ: -2.75, maxZ: -1.25 }]
        : []),

      // 5. Bread Display Shelf (when unlocked at x=-7.5, z=3.5)
      ...(this.unlockedZones.breadShelf
        ? [{ minX: -8.65, maxX: -6.35, minZ: 2.75, maxZ: 4.25 }]
        : []),

      // 6. Juice Display Shelf (when unlocked at x=-3.5, z=3.5)
      ...(this.unlockedZones.juiceShelf
        ? [{ minX: -4.65, maxX: -2.35, minZ: 2.75, maxZ: 4.25 }]
        : []),

      // 7. Coffee Display Shelf (when unlocked at x=0.5, z=3.5)
      ...(this.unlockedZones.coffeeShelf
        ? [{ minX: -0.65, maxX: 1.65, minZ: 2.75, maxZ: 4.25 }]
        : []),

      // 8. Cheese Display Shelf (when unlocked at x=4.5, z=-9)
      ...(this.unlockedZones.cheeseShelf
        ? [{ minX: 3.35, maxX: 5.65, minZ: -9.75, maxZ: -8.25 }]
        : []),

      // 9. Juicer Machine Station (when unlocked at x=11, z=-9)
      ...(this.unlockedZones.juicer
        ? [{ minX: 9.75, maxX: 12.25, minZ: -9.95, maxZ: -8.05 }]
        : []),

      // 10. Bakery Stone Oven (when unlocked at x=-8.5, z=-9)
      ...(this.unlockedZones.bakeryOven
        ? [{ minX: -9.85, maxX: -7.15, minZ: -10.25, maxZ: -7.75 }]
        : []),

      // 11. Barista Espresso Coffee Bar (when unlocked at x=5.5, z=3.5)
      ...(this.unlockedZones.coffeeBar
        ? [{ minX: 4.15, maxX: 6.85, minZ: 2.55, maxZ: 4.45 }]
        : []),

      // 12. Artisan Cheese Cellar (when unlocked at x=11, z=-2)
      ...(this.unlockedZones.cheeseCellar
        ? [{ minX: 9.75, maxX: 12.25, minZ: -3.25, maxZ: -0.75 }]
        : []),

      // 13. Express Self-Checkout (when unlocked at x=8.2, z=-4.5)
      ...(this.unlockedZones.selfCheckout
        ? [{ minX: 7.25, maxX: 9.15, minZ: -5.35, maxZ: -3.65 }]
        : []),

      // 14. Diamond Empire Monument (when unlocked at x=0, z=-9)
      ...(this.unlockedZones.trophy
        ? [{ minX: -1.6, maxX: 1.6, minZ: -10.6, maxZ: -7.4 }]
        : []),

      // 15. Tomato Planter Box (at x=-8.5, z=7.5)
      { minX: -9.95, maxX: -7.05, minZ: 6.25, maxZ: 8.75 },

      // 16. Apple Tree Mound (when unlocked at x=-11, z=-9)
      ...(this.unlockedZones.appleTree
        ? [{ minX: -12.7, maxX: -9.3, minZ: -10.7, maxZ: -7.3 }]
        : []),

      // 17. Chicken Coop Pen (when unlocked at x=8.5, z=7.5)
      ...(this.unlockedZones.chickenCoop
        ? [{ minX: 7.15, maxX: 9.85, minZ: 6.25, maxZ: 8.75 }]
        : []),

      // 18. Front Wall Wings (entrance door opening between x = -3.8 and 3.8 is open)
      { minX: -16.4, maxX: -3.8, minZ: 13.6, maxZ: 14.4 },
      { minX: 3.8, maxX: 16.4, minZ: 13.6, maxZ: 14.4 },

      // 11. Back Wall
      { minX: -16.4, maxX: 16.4, minZ: -14.4, maxZ: -13.6 },

      // 12. Left Wall
      { minX: -16.4, maxX: -15.6, minZ: -14, maxZ: 14 },

      // 13. Right Wall
      { minX: 15.6, maxX: 16.4, minZ: -14, maxZ: 14 },
    ];

    // Penalty-based circle-AABB collision resolution with smooth corner sliding
    for (const box of obstacles) {
      const closestX = Math.max(box.minX, Math.min(box.maxX, this.playerPos.x));
      const closestZ = Math.max(box.minZ, Math.min(box.maxZ, this.playerPos.z));

      const dx = this.playerPos.x - closestX;
      const dz = this.playerPos.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < playerRadius * playerRadius) {
        if (distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const penetration = playerRadius - dist;
          this.playerPos.x += (dx / dist) * penetration;
          this.playerPos.z += (dz / dist) * penetration;
        } else {
          // Inside obstacle box: push out along smallest penetration axis
          const leftPen = Math.abs(this.playerPos.x - box.minX);
          const rightPen = Math.abs(box.maxX - this.playerPos.x);
          const topPen = Math.abs(this.playerPos.z - box.minZ);
          const bottomPen = Math.abs(box.maxZ - this.playerPos.z);
          const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);

          if (minPen === leftPen) this.playerPos.x = box.minX - playerRadius;
          else if (minPen === rightPen) this.playerPos.x = box.maxX + playerRadius;
          else if (minPen === topPen) this.playerPos.z = box.minZ - playerRadius;
          else this.playerPos.z = box.maxZ + playerRadius;
        }
      }
    }

    // Outer farm perimeter clamp
    this.playerPos.x = Math.max(-22, Math.min(22, this.playerPos.x));
    this.playerPos.z = Math.max(-18, Math.min(24, this.playerPos.z));
  }

  // Crop & Food Production Logic (All 7 Item Stations)
  private updateFarming(dt: number) {
    let growthMult = 0.8 + this.upgrades.cropGrowthRate * 0.25;
    if (this.currentEvent?.multiplierType === 'growth_boost') {
      growthMult *= this.currentEvent.multiplier;
    }

    // 1. Tomatoes (Tomato Planter Box, max 6)
    if (this.fieldReady.tomato < 6) {
      this.fieldTimers.tomato += dt * growthMult;
      if (this.fieldTimers.tomato >= 2.4) {
        this.fieldTimers.tomato = 0;
        this.fieldReady.tomato++;
      }
    }
    this.tomatoField.setGrowth(this.fieldReady.tomato / 6);

    // 2. Apples (Apple Orchard Tree, max 6)
    if (this.unlockedZones.appleTree && this.fieldReady.apple < 6) {
      this.fieldTimers.apple += dt * growthMult;
      if (this.fieldTimers.apple >= 2.8) {
        this.fieldTimers.apple = 0;
        this.fieldReady.apple++;
      }
      this.appleTree.setGrowth(this.fieldReady.apple / 6);
    }

    // 3. Eggs (Chicken Coop, max 5)
    if (this.unlockedZones.chickenCoop) {
      this.chickenCoop.updateHen(performance.now() / 1000);
      if (this.fieldReady.egg < 5) {
        this.fieldTimers.egg += dt * growthMult;
        if (this.fieldTimers.egg >= 3.2) {
          this.fieldTimers.egg = 0;
          this.fieldReady.egg++;
        }
      }
      this.chickenCoop.setGrowth(this.fieldReady.egg / 5);
    }

    // 4. Fresh Baguette Bread (Bakery Stone Oven, max 4)
    if (this.unlockedZones.bakeryOven && this.fieldReady.bread < 4) {
      this.fieldTimers.bread += dt * growthMult;
      if (this.fieldTimers.bread >= 3.4) {
        this.fieldTimers.bread = 0;
        this.fieldReady.bread++;
      }
      this.bakeryOven.setProduction(this.fieldTimers.bread / 3.4, this.fieldReady.bread);
    }

    // 5. Blended Fruit Juice (Juicer Machine, max 4)
    if (this.unlockedZones.juicer && this.fieldReady.juice < 4) {
      this.fieldTimers.juice += dt * growthMult;
      if (this.fieldTimers.juice >= 3.8) {
        this.fieldTimers.juice = 0;
        this.fieldReady.juice++;
      }
      this.juicer.setProduction(this.fieldTimers.juice / 3.8, this.fieldReady.juice);
    }

    // 6. Barista Espresso Coffee (Cafe Bar, max 4)
    if (this.unlockedZones.coffeeBar && this.fieldReady.coffee < 4) {
      this.fieldTimers.coffee += dt * growthMult;
      if (this.fieldTimers.coffee >= 4.0) {
        this.fieldTimers.coffee = 0;
        this.fieldReady.coffee++;
      }
      this.coffeeBar.setProduction(this.fieldTimers.coffee / 4.0, this.fieldReady.coffee);
    }

    // 7. Gourmet Aged Cheese (Artisan Cheese Cellar, max 4)
    if (this.unlockedZones.cheeseCellar && this.fieldReady.cheese < 4) {
      this.fieldTimers.cheese += dt * growthMult;
      if (this.fieldTimers.cheese >= 4.4) {
        this.fieldTimers.cheese = 0;
        this.fieldReady.cheese++;
      }
      this.cheeseCellar.setProduction(this.fieldTimers.cheese / 4.4, this.fieldReady.cheese);
    }
  }

  // Player Harvest, Stock, and Register triggers
  private updateInteractions(dt: number) {
    const maxCarry = this.getMaxCarry();

    // 1. Harvest Tomato
    if (this.playerPos.distanceTo(this.tomatoField.root.position) < 2.5) {
      if (this.fieldReady.tomato > 0 && this.playerStack.length < maxCarry) {
        this.fieldReady.tomato--;
        this.addItemToStack('tomato');
        sound.playHarvest();
        const q1 = this.quests.find((q) => q.id === 'q1');
        if (q1 && !q1.completed) {
          q1.current = Math.min(q1.target, q1.current + 1);
        }
      }
    }

    // 2. Harvest Apples
    if (this.unlockedZones.appleTree && this.playerPos.distanceTo(this.appleTree.root.position) < 2.6) {
      if (this.fieldReady.apple > 0 && this.playerStack.length < maxCarry) {
        this.fieldReady.apple--;
        this.addItemToStack('apple');
        sound.playHarvest();
      }
    }

    // 3. Harvest Eggs
    if (this.unlockedZones.chickenCoop && this.playerPos.distanceTo(this.chickenCoop.root.position) < 2.6) {
      if (this.fieldReady.egg > 0 && this.playerStack.length < maxCarry) {
        this.fieldReady.egg--;
        this.addItemToStack('egg');
        sound.playHarvest();
      }
    }

    // 4. Collect Artisan Bread
    if (this.unlockedZones.bakeryOven && this.playerPos.distanceTo(this.bakeryOven.root.position) < 2.6) {
      if (this.fieldReady.bread > 0 && this.playerStack.length < maxCarry) {
        this.fieldReady.bread--;
        this.addItemToStack('bread');
        sound.playHarvest();
      }
    }

    // 5. Collect Fresh Juices
    if (this.unlockedZones.juicer && this.playerPos.distanceTo(this.juicer.root.position) < 2.6) {
      if (this.fieldReady.juice > 0 && this.playerStack.length < maxCarry) {
        this.fieldReady.juice--;
        this.addItemToStack('juice');
        sound.playHarvest();
      }
    }

    // 6. Collect Espresso Coffee
    if (this.unlockedZones.coffeeBar && this.playerPos.distanceTo(this.coffeeBar.root.position) < 2.6) {
      if (this.fieldReady.coffee > 0 && this.playerStack.length < maxCarry) {
        this.fieldReady.coffee--;
        this.addItemToStack('coffee');
        sound.playHarvest();
      }
    }

    // 7. Collect Aged Cheese
    if (this.unlockedZones.cheeseCellar && this.playerPos.distanceTo(this.cheeseCellar.root.position) < 2.6) {
      if (this.fieldReady.cheese > 0 && this.playerStack.length < maxCarry) {
        this.fieldReady.cheese--;
        this.addItemToStack('cheese');
        sound.playHarvest();
      }
    }

    // Stocking All 7 Display Shelves
    this.checkStockShelf('tomato', this.tomatoShelf.root.position, this.tomatoShelf);
    if (this.unlockedZones.appleShelf) {
      this.checkStockShelf('apple', this.appleShelf.root.position, this.appleShelf);
    }
    if (this.unlockedZones.eggShelf) {
      this.checkStockShelf('egg', this.eggShelf.root.position, this.eggShelf);
    }
    if (this.unlockedZones.breadShelf) {
      this.checkStockShelf('bread', this.breadShelf.root.position, this.breadShelf);
    }
    if (this.unlockedZones.juiceShelf) {
      this.checkStockShelf('juice', this.juiceShelf.root.position, this.juiceShelf);
    }
    if (this.unlockedZones.coffeeShelf) {
      this.checkStockShelf('coffee', this.coffeeShelf.root.position, this.coffeeShelf);
    }
    if (this.unlockedZones.cheeseShelf) {
      this.checkStockShelf('cheese', this.cheeseShelf.root.position, this.cheeseShelf);
    }

    // Cashier Register Serving (Main Counter)
    const playerAtRegister = this.playerPos.distanceTo(this.checkoutCounter.root.position) < 2.4;
    const cashierAtRegister = this.unlockedZones.cashierBot;

    if ((playerAtRegister || cashierAtRegister) && this.checkoutQueue.length > 0) {
      this.checkoutScanTimer += dt * (cashierAtRegister ? 2.5 : 1.8);
      if (this.checkoutScanTimer >= 0.7) {
        this.checkoutScanTimer = 0;
        this.serveCustomerAtQueue(0);
      }
    } else {
      this.checkoutScanTimer = 0;
    }
  }

  private checkStockShelf(
    type: ItemType,
    shelfPos: THREE.Vector3,
    shelfModel: ReturnType<typeof createDisplayShelfModel>
  ) {
    if (this.playerPos.distanceTo(shelfPos) < 2.2) {
      const maxCap = this.getMaxShelfCapacity();
      if (this.shelfStock[type] < maxCap) {
        const itemIndex = this.playerStack.lastIndexOf(type);
        if (itemIndex !== -1) {
          this.playerStack.splice(itemIndex, 1);
          this.shelfStock[type]++;
          this.shelfStockDirty = true;
          shelfModel.setStockCount(this.shelfStock[type]);
          this.rebuildPlayerStackMeshes();
          sound.playStock();
        }
      }
    }
  }

  private addItemToStack(type: ItemType) {
    this.playerStack.push(type);
    this.rebuildPlayerStackMeshes();
  }

  private rebuildPlayerStackMeshes() {
    this.playerStackMeshes.forEach((m) => this.playerModel.stackPivot.remove(m));
    this.playerStackMeshes = [];

    this.playerStack.forEach((type, index) => {
      const mesh = createItemMesh(type);
      mesh.scale.setScalar(0.72);
      mesh.position.set(0, index * 0.32, 0);
      this.playerModel.stackPivot.add(mesh);
      this.playerStackMeshes.push(mesh);
    });
  }

  // Unlock Pad interaction
  private updateUnlockPads(dt: number, time: number) {
    this.unlockPads.forEach((pad) => {
      const meshData = this.padMeshes.get(pad.id);
      if (!meshData || !meshData.root.visible || pad.unlocked) return;

      meshData.updatePad(time, pad.currentPaid / pad.cost);

      const dist = this.playerPos.distanceTo(_v1.set(pad.x, 0, pad.z));
      if (dist < pad.radius && this.playerCash > 0) {
        const paySpeed = Math.max(20, pad.cost * 0.35);
        const amountToPay = Math.min(this.playerCash, Math.ceil(paySpeed * dt), pad.cost - pad.currentPaid);

        if (amountToPay > 0) {
          this.playerCash -= amountToPay;
          pad.currentPaid += amountToPay;
          sound.playCoin();

          if (pad.currentPaid >= pad.cost) {
            pad.unlocked = true;
            this.unlockZone(pad.targetId);
          }
        }
      }
    });
  }

  private unlockZone(targetId: string) {
    sound.playUnlock();
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });

    if (targetId === 'appleTree') {
      this.unlockedZones.appleTree = true;
      this.appleTree.root.visible = true;
    } else if (targetId === 'appleShelf') {
      this.unlockedZones.appleShelf = true;
      this.appleShelf.root.visible = true;
      this.shelfStock.apple = 6;
      this.appleShelf.setStockCount(6);
    } else if (targetId === 'helperBot') {
      this.unlockedZones.helperBot = true;
      this.helperUnlocked = true;
      this.helperModel.root.visible = true;
    } else if (targetId === 'chickenCoop') {
      this.unlockedZones.chickenCoop = true;
      this.chickenCoop.root.visible = true;
    } else if (targetId === 'eggShelf') {
      this.unlockedZones.eggShelf = true;
      this.eggShelf.root.visible = true;
      this.shelfStock.egg = 6;
      this.eggShelf.setStockCount(6);
    } else if (targetId === 'cashierBot') {
      this.unlockedZones.cashierBot = true;
      this.cashierUnlocked = true;
      this.cashierModel.root.visible = true;
    } else if (targetId === 'bakeryOven') {
      this.unlockedZones.bakeryOven = true;
      this.bakeryOven.root.visible = true;
    } else if (targetId === 'breadShelf') {
      this.unlockedZones.breadShelf = true;
      this.breadShelf.root.visible = true;
      this.shelfStock.bread = 6;
      this.breadShelf.setStockCount(6);
    } else if (targetId === 'juicer') {
      this.unlockedZones.juicer = true;
      this.juicer.root.visible = true;
    } else if (targetId === 'juiceShelf') {
      this.unlockedZones.juiceShelf = true;
      this.juiceShelf.root.visible = true;
      this.shelfStock.juice = 6;
      this.juiceShelf.setStockCount(6);
    } else if (targetId === 'helperBot2') {
      this.unlockedZones.helperBot2 = true;
      this.helper2Unlocked = true;
      this.helper2Model.root.visible = true;
    } else if (targetId === 'coffeeBar') {
      this.unlockedZones.coffeeBar = true;
      this.coffeeBar.root.visible = true;
    } else if (targetId === 'coffeeShelf') {
      this.unlockedZones.coffeeShelf = true;
      this.coffeeShelf.root.visible = true;
      this.shelfStock.coffee = 6;
      this.coffeeShelf.setStockCount(6);
    } else if (targetId === 'cheeseCellar') {
      this.unlockedZones.cheeseCellar = true;
      this.cheeseCellar.root.visible = true;
    } else if (targetId === 'cheeseShelf') {
      this.unlockedZones.cheeseShelf = true;
      this.cheeseShelf.root.visible = true;
      this.shelfStock.cheese = 6;
      this.cheeseShelf.setStockCount(6);
    } else if (targetId === 'selfCheckout') {
      this.unlockedZones.selfCheckout = true;
      this.selfCheckout.root.visible = true;
    } else if (targetId === 'empireWing') {
      this.unlockedZones.empireWing = true;
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
    } else if (targetId === 'trophy') {
      this.unlockedZones.trophy = true;
      this.empireMonument.root.visible = true;
      confetti({ particleCount: 200, spread: 140, origin: { y: 0.4 } });
    }

    this.refreshActiveUnlockPads();
  }

  // Stocker Helper Bot 1 AI (Produces: tomato, apple, egg, bread)
  private updateHelperBot(dt: number) {
    const helperSpeed = 3.6 + this.upgrades.helperSpeed * 0.65;
    let target = this.tomatoField.root.position;

    if (this.helperStack.length < 4) {
      if (this.fieldReady.tomato > 0) {
        target = this.tomatoField.root.position;
        this.helperTargetItem = 'tomato';
      } else if (this.unlockedZones.appleTree && this.fieldReady.apple > 0) {
        target = this.appleTree.root.position;
        this.helperTargetItem = 'apple';
      } else if (this.unlockedZones.chickenCoop && this.fieldReady.egg > 0) {
        target = this.chickenCoop.root.position;
        this.helperTargetItem = 'egg';
      } else if (this.unlockedZones.bakeryOven && this.fieldReady.bread > 0) {
        target = this.bakeryOven.root.position;
        this.helperTargetItem = 'bread';
      }
    } else {
      const carryType = this.helperStack[0];
      if (carryType === 'tomato') target = this.tomatoShelf.root.position;
      else if (carryType === 'apple') target = this.appleShelf.root.position;
      else if (carryType === 'egg') target = this.eggShelf.root.position;
      else if (carryType === 'bread') target = this.breadShelf.root.position;
    }

    const dist = this.helperPos.distanceTo(target);
    if (dist > 1.2) {
      _v1.subVectors(target, this.helperPos).normalize();
      this.helperPos.x += _v1.x * helperSpeed * dt;
      this.helperPos.z += _v1.z * helperSpeed * dt;
      this.helperModel.root.rotation.y = Math.atan2(_v1.x, _v1.z);
      this.helperWalkPhase += dt * helperSpeed * 2.5;
      this.helperModel.updateAnimation(helperSpeed, this.helperWalkPhase, 0, 0);
    } else {
      if (this.helperStack.length < 4) {
        if (this.fieldReady[this.helperTargetItem] > 0) {
          this.fieldReady[this.helperTargetItem]--;
          this.helperStack.push(this.helperTargetItem);
          this.rebuildHelperStackMeshes();
        }
      } else {
        const item = this.helperStack.pop();
        if (item) {
          const maxCap = this.getMaxShelfCapacity();
          this.shelfStock[item] = Math.min(maxCap, this.shelfStock[item] + 1);
          this.shelfStockDirty = true;
          this.updateShelfModelStock(item);
          this.rebuildHelperStackMeshes();
        }
      }
      this.helperModel.updateAnimation(0, 0, 0, 0);
    }
    this.helperModel.root.position.copy(this.helperPos);
  }

  // Senior Stocker Bot 2 AI (Artisan lines: bread, juice, coffee, cheese)
  private updateHelperBot2(dt: number) {
    const helperSpeed = 3.8 + this.upgrades.helperSpeed * 0.7;
    let target = this.bakeryOven.root.position;

    if (this.helper2Stack.length < 5) {
      if (this.unlockedZones.coffeeBar && this.fieldReady.coffee > 0) {
        target = this.coffeeBar.root.position;
        this.helper2TargetItem = 'coffee';
      } else if (this.unlockedZones.cheeseCellar && this.fieldReady.cheese > 0) {
        target = this.cheeseCellar.root.position;
        this.helper2TargetItem = 'cheese';
      } else if (this.unlockedZones.juicer && this.fieldReady.juice > 0) {
        target = this.juicer.root.position;
        this.helper2TargetItem = 'juice';
      } else if (this.unlockedZones.bakeryOven && this.fieldReady.bread > 0) {
        target = this.bakeryOven.root.position;
        this.helper2TargetItem = 'bread';
      }
    } else {
      const carryType = this.helper2Stack[0];
      if (carryType === 'coffee') target = this.coffeeShelf.root.position;
      else if (carryType === 'cheese') target = this.cheeseShelf.root.position;
      else if (carryType === 'juice') target = this.juiceShelf.root.position;
      else if (carryType === 'bread') target = this.breadShelf.root.position;
    }

    const dist = this.helper2Pos.distanceTo(target);
    if (dist > 1.2) {
      _v1.subVectors(target, this.helper2Pos).normalize();
      this.helper2Pos.x += _v1.x * helperSpeed * dt;
      this.helper2Pos.z += _v1.z * helperSpeed * dt;
      this.helper2Model.root.rotation.y = Math.atan2(_v1.x, _v1.z);
      this.helper2WalkPhase += dt * helperSpeed * 2.5;
      this.helper2Model.updateAnimation(helperSpeed, this.helper2WalkPhase, 0, 0);
    } else {
      if (this.helper2Stack.length < 5) {
        if (this.fieldReady[this.helper2TargetItem] > 0) {
          this.fieldReady[this.helper2TargetItem]--;
          this.helper2Stack.push(this.helper2TargetItem);
          this.rebuildHelper2StackMeshes();
        }
      } else {
        const item = this.helper2Stack.pop();
        if (item) {
          const maxCap = this.getMaxShelfCapacity();
          this.shelfStock[item] = Math.min(maxCap, this.shelfStock[item] + 1);
          this.shelfStockDirty = true;
          this.updateShelfModelStock(item);
          this.rebuildHelper2StackMeshes();
        }
      }
      this.helper2Model.updateAnimation(0, 0, 0, 0);
    }
    this.helper2Model.root.position.copy(this.helper2Pos);
  }

  private rebuildHelperStackMeshes() {
    this.helperStackMeshes.forEach((m) => this.helperModel.stackPivot.remove(m));
    this.helperStackMeshes = [];
    this.helperStack.forEach((type, index) => {
      const mesh = createItemMesh(type);
      mesh.scale.setScalar(0.7);
      mesh.position.set(0, index * 0.3, 0);
      this.helperModel.stackPivot.add(mesh);
      this.helperStackMeshes.push(mesh);
    });
  }

  private rebuildHelper2StackMeshes() {
    this.helper2StackMeshes.forEach((m) => this.helper2Model.stackPivot.remove(m));
    this.helper2StackMeshes = [];
    this.helper2Stack.forEach((type, index) => {
      const mesh = createItemMesh(type);
      mesh.scale.setScalar(0.7);
      mesh.position.set(0, index * 0.3, 0);
      this.helper2Model.stackPivot.add(mesh);
      this.helper2StackMeshes.push(mesh);
    });
  }

  private updateShelfModelStock(type: ItemType) {
    if (type === 'tomato') this.tomatoShelf.setStockCount(this.shelfStock.tomato);
    else if (type === 'apple' && this.unlockedZones.appleShelf) this.appleShelf.setStockCount(this.shelfStock.apple);
    else if (type === 'egg' && this.unlockedZones.eggShelf) this.eggShelf.setStockCount(this.shelfStock.egg);
    else if (type === 'bread' && this.unlockedZones.breadShelf) this.breadShelf.setStockCount(this.shelfStock.bread);
    else if (type === 'juice' && this.unlockedZones.juiceShelf) this.juiceShelf.setStockCount(this.shelfStock.juice);
    else if (type === 'coffee' && this.unlockedZones.coffeeShelf) this.coffeeShelf.setStockCount(this.shelfStock.coffee);
    else if (type === 'cheese' && this.unlockedZones.cheeseShelf) this.cheeseShelf.setStockCount(this.shelfStock.cheese);
  }

  // Express Self-Checkout Scanner Kiosk
  private updateSelfCheckout(dt: number, time: number) {
    this.selfCheckout.updateKiosk(time);

    if (this.checkoutQueue.length > 1) {
      this.selfScanTimer += dt * 1.6;
      if (this.selfScanTimer >= 0.75) {
        this.selfScanTimer = 0;
        this.selfCheckout.triggerScan();
        this.serveCustomerAtQueue(1);
      }
    } else {
      this.selfScanTimer = 0;
    }
  }

  // Dynamic Store Events
  private updateEvents(dt: number) {
    if (this.currentEvent) {
      this.currentEvent.duration -= dt;
      if (this.currentEvent.duration <= 0) {
        this.currentEvent = null;
        this.nextEventCountdown = 100 + Math.random() * 40;
        this.shelfStockDirty = true;
      }
    } else {
      this.nextEventCountdown -= dt;
      if (this.nextEventCountdown <= 0) {
        const events: StoreEvent[] = [
          {
            id: 'rush_hour',
            name: 'Lunch Rush Hour!',
            description: 'Customer foot traffic doubled for 45s!',
            icon: '⚡',
            duration: 45,
            multiplierType: 'spawn_surge',
            multiplier: 2.2,
            bannerColor: 'from-amber-500 to-orange-500',
          },
          {
            id: 'harvest_surge',
            name: 'Organic Harvest Bloom!',
            description: 'Crops, ovens & kitchens produce 2.5x faster!',
            icon: '🌱',
            duration: 40,
            multiplierType: 'growth_boost',
            multiplier: 2.5,
            bannerColor: 'from-emerald-500 to-teal-500',
          },
          {
            id: 'cafe_craze',
            name: 'Cafe & Bakery Craze!',
            description: 'Shoppers pay 2x for Baguettes & Espresso!',
            icon: '☕',
            duration: 45,
            multiplierType: 'cafe_surge',
            multiplier: 2.0,
            bannerColor: 'from-rose-500 to-pink-500',
          },
          {
            id: 'vip_wave',
            name: 'VIP Foodie Convention!',
            description: 'All shoppers leave +100% bonus cash tips!',
            icon: '👑',
            duration: 35,
            multiplierType: 'vip_wave',
            multiplier: 2.0,
            bannerColor: 'from-purple-500 to-indigo-500',
          },
        ];
        this.currentEvent = events[Math.floor(Math.random() * events.length)];
        this.shelfStockDirty = true;
        sound.playUnlock();
        if (this.onFloatingReward) {
          this.onFloatingReward({
            id: Math.random().toString(),
            text: `EVENT: ${this.currentEvent.name}`,
            x: window.innerWidth * 0.5,
            y: 135,
            color: '#f59e0b',
          });
        }
      }
    }
  }

  public getActiveQuest(): QuestGoal | null {
    return this.quests.find((q) => !q.claimed) || null;
  }

  private checkQuestProgress() {
    this.quests.forEach((q) => {
      if (q.completed) return;
      if (q.id === 'q2') {
        q.current = Math.min(q.target, this.customersServed);
      } else if (q.id === 'q3') {
        q.current = this.unlockedZones.helperBot ? 1 : 0;
      } else if (q.id === 'q4') {
        q.current = this.unlockedZones.bakeryOven ? 1 : 0;
      } else if (q.id === 'q5') {
        q.current = Math.min(q.target, this.customersServed);
      } else if (q.id === 'q6') {
        q.current = this.unlockedZones.coffeeBar ? 1 : 0;
      } else if (q.id === 'q7') {
        q.current = this.unlockedZones.helperBot2 ? 1 : 0;
      } else if (q.id === 'q8') {
        q.current = this.unlockedZones.cheeseCellar ? 1 : 0;
      } else if (q.id === 'q9') {
        q.current = this.unlockedZones.selfCheckout ? 1 : 0;
      } else if (q.id === 'q10') {
        q.current = this.unlockedZones.trophy ? 1 : 0;
      }

      if (q.current >= q.target && !q.completed) {
        q.completed = true;
        sound.playUnlock();
      }
    });

    if (this.unlockedZones.trophy) {
      this.storeStars = 5;
    } else if (this.unlockedZones.empireWing) {
      this.storeStars = 4;
    } else if (this.unlockedZones.coffeeShelf) {
      this.storeStars = 3;
    } else if (this.unlockedZones.cashierBot) {
      this.storeStars = 2;
    } else {
      this.storeStars = 1;
    }
  }

  // Customer AI and Queuing
  private updateCustomers(dt: number, time: number) {
    this.customerSpawnTimer += dt;
    let maxCapacity = 5;
    if (this.unlockedZones.appleShelf) maxCapacity += 1;
    if (this.unlockedZones.eggShelf) maxCapacity += 1;
    if (this.unlockedZones.breadShelf) maxCapacity += 1;
    if (this.unlockedZones.juiceShelf) maxCapacity += 1;
    if (this.unlockedZones.coffeeShelf) maxCapacity += 1;
    if (this.unlockedZones.cheeseShelf) maxCapacity += 1;
    if (this.cashierUnlocked) maxCapacity += 1;
    if (this.unlockedZones.selfCheckout) maxCapacity += 2;

    const spawnInterval = this.currentEvent?.multiplierType === 'spawn_surge' ? 1.2 : 2.7;

    if (this.customerSpawnTimer >= spawnInterval && this.customers.length < maxCapacity) {
      this.customerSpawnTimer = 0;
      this.spawnCustomer();
    }

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      const speed = c.moveSpeed;

      if (c.state === 'entering') {
        const dist = c.model.root.position.distanceTo(c.targetPos);
        if (dist > 0.6) {
          _v1.subVectors(c.targetPos, c.model.root.position).normalize();
          c.model.root.position.x += _v1.x * speed * dt;
          c.model.root.position.z += _v1.z * speed * dt;

          c.targetAngle = Math.atan2(_v1.x, _v1.z);
          let diff = c.targetAngle - c.currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          c.currentAngle += diff * Math.min(1, dt * 10);
          c.model.root.rotation.y = c.currentAngle;

          c.walkPhase += dt * speed * c.strideRate;
          c.model.updateAnimation(speed, c.walkPhase, 0, 0, 'walking');

          if (Math.random() < dt * 0.08) {
            sound.playCartRattle(0.4);
          }
        } else {
          c.state = 'shopping';
          c.waitTimer = 0;
        }
      } else if (c.state === 'shopping') {
        c.waitTimer += dt;
        c.walkPhase += dt * 2.8;

        const isBottomRow = c.targetItem === 'bread' || c.targetItem === 'juice' || c.targetItem === 'coffee';
        c.targetAngle = isBottomRow ? 0 : -Math.PI * 0.9;
        let diff = c.targetAngle - c.currentAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        c.currentAngle += diff * Math.min(1, dt * 8);
        c.model.root.rotation.y = c.currentAngle;

        c.model.updateAnimation(0, c.walkPhase, 0, 0, 'shopping');

        if (this.shelfStock[c.targetItem] > 0 && c.waitTimer > c.browseDuration) {
          this.shelfStock[c.targetItem]--;
          this.shelfStockDirty = true;
          c.itemsGathered++;
          this.updateShelfModelStock(c.targetItem);

          const mini = createItemMesh(c.targetItem);
          mini.scale.setScalar(0.48);
          mini.position.set(0, 0.06, 0);
          c.model.bagPivot.add(mini);

          c.state = 'queuing';
          this.checkoutQueue.push(c);
        }
      } else if (c.state === 'queuing') {
        const queueIndex = this.checkoutQueue.indexOf(c);
        const queuePos = _v1.set(4.5, 0, -1.8 + queueIndex * 1.35);
        const dist = c.model.root.position.distanceTo(queuePos);

        if (dist > 0.35) {
          _v2.subVectors(queuePos, c.model.root.position).normalize();
          c.model.root.position.x += _v2.x * speed * dt;
          c.model.root.position.z += _v2.z * speed * dt;

          c.targetAngle = Math.atan2(_v2.x, _v2.z);
          let diff = c.targetAngle - c.currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          c.currentAngle += diff * Math.min(1, dt * 10);
          c.model.root.rotation.y = c.currentAngle;

          c.walkPhase += dt * speed * c.strideRate;
          c.model.updateAnimation(speed, c.walkPhase, 0, 0, 'walking');
        } else {
          c.targetAngle = -Math.PI;
          let diff = c.targetAngle - c.currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          c.currentAngle += diff * Math.min(1, dt * 8);
          c.model.root.rotation.y = c.currentAngle;

          c.walkPhase += dt * 2.2;
          c.model.updateAnimation(0, c.walkPhase, 0, 0, 'queuing');
        }
      } else if (c.state === 'leaving') {
        const exitPos = _v1.set(0, 0, 16);
        const dist = c.model.root.position.distanceTo(exitPos);
        if (dist > 0.8) {
          _v2.subVectors(exitPos, c.model.root.position).normalize();
          c.model.root.position.x += _v2.x * speed * dt;
          c.model.root.position.z += _v2.z * speed * dt;

          c.targetAngle = Math.atan2(_v2.x, _v2.z);
          let diff = c.targetAngle - c.currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          c.currentAngle += diff * Math.min(1, dt * 10);
          c.model.root.rotation.y = c.currentAngle;

          c.walkPhase += dt * speed * c.strideRate;
          c.model.updateAnimation(speed, c.walkPhase, 0, 0, 'walking');

          if (Math.random() < dt * 0.08) {
            sound.playCartRattle(0.4);
          }
        } else {
          this.scene.remove(c.model.root);
          this.customers.splice(i, 1);
        }
      }
    }
  }

  private spawnCustomer() {
    const availableItems: ItemType[] = ['tomato'];
    if (this.unlockedZones.appleShelf) availableItems.push('apple');
    if (this.unlockedZones.eggShelf) availableItems.push('egg');
    if (this.unlockedZones.breadShelf) availableItems.push('bread');
    if (this.unlockedZones.juiceShelf) availableItems.push('juice');
    if (this.unlockedZones.coffeeShelf) availableItems.push('coffee');
    if (this.unlockedZones.cheeseShelf) availableItems.push('cheese');

    const chosenItem = availableItems[Math.floor(Math.random() * availableItems.length)];

    const archetypes: CustomerArchetype[] = [
      'casual',
      'casual',
      'business',
      'elder',
      'kid',
      'athlete',
      'student',
    ];
    const chosenArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    const model = createDiverseCustomerModel({
      archetype: chosenArchetype,
      seed: Math.random(),
    });

    if (chosenArchetype === 'elder') {
      model.bagPivot.add(createShoppingBasket(0xd97706));
    } else if (chosenArchetype === 'kid') {
      model.bagPivot.add(createShoppingBasket(0xef4444));
    } else if (chosenArchetype === 'student') {
      model.bagPivot.add(createToteBag(0xfef08a));
    } else if (chosenArchetype === 'athlete') {
      model.bagPivot.add(createToteBag(0x06b6d4));
    } else {
      model.bagPivot.add(createCustomerBag());
    }

    model.root.position.set((Math.random() - 0.5) * 4.2, 0, 14.5);
    this.scene.add(model.root);

    const jitterX = (Math.random() - 0.5) * 1.5;
    let targetPos = new THREE.Vector3(-7.5 + jitterX, 0, -0.6);
    if (chosenItem === 'apple') targetPos = new THREE.Vector3(-3.5 + jitterX, 0, -0.6);
    else if (chosenItem === 'egg') targetPos = new THREE.Vector3(0.5 + jitterX, 0, -0.6);
    else if (chosenItem === 'bread') targetPos = new THREE.Vector3(-7.5 + jitterX, 0, 4.8);
    else if (chosenItem === 'juice') targetPos = new THREE.Vector3(-3.5 + jitterX, 0, 4.8);
    else if (chosenItem === 'coffee') targetPos = new THREE.Vector3(0.5 + jitterX, 0, 4.8);
    else if (chosenItem === 'cheese') targetPos = new THREE.Vector3(4.5 + jitterX, 0, -7.6);

    this.customers.push({
      id: Math.random().toString(),
      model,
      archetype: chosenArchetype,
      state: 'entering',
      targetItem: chosenItem,
      itemsNeeded: 1,
      itemsGathered: 0,
      targetPos,
      waitTimer: 0,
      walkPhase: 0,
      currentAngle: -Math.PI,
      targetAngle: -Math.PI,
      moveSpeed: model.baseSpeed,
      strideRate: model.strideRate,
      browseDuration: model.browseDuration,
    });
  }

  // Customer Checkout & Income Processing
  private serveCustomerAtQueue(queueIndex: number = 0) {
    if (queueIndex >= this.checkoutQueue.length) return;
    const customer = this.checkoutQueue.splice(queueIndex, 1)[0];
    if (!customer) return;

    sound.playCheckout();
    if (queueIndex === 0) {
      this.checkoutCounter.triggerScanPulse();
    }
    this.customersServed++;

    let itemPrice = ITEM_DEFS[customer.targetItem].price;

    // Cafe & Bakery surge event 2x pricing
    if (
      this.currentEvent?.multiplierType === 'cafe_surge' &&
      (customer.targetItem === 'bread' || customer.targetItem === 'coffee')
    ) {
      itemPrice *= 2;
    }

    // Tip Jar Perk (+5% tip per upgrade level)
    const tipPercent = (this.upgrades.tipJar - 1) * 0.05;
    let vipBonus = 0;
    if (this.currentEvent?.multiplierType === 'vip_wave') {
      vipBonus = 1.0;
    }

    const totalEarned = Math.round(itemPrice * (1 + tipPercent + vipBonus));
    this.playerCash += totalEarned;
    this.totalCashEarned += totalEarned;

    const originPos = queueIndex === 0
      ? new THREE.Vector3(4.5, 1.2, -4.2)
      : new THREE.Vector3(8.2, 1.2, -4.5);
    this.spawnCoinReward(totalEarned, originPos);

    if (this.onFloatingReward) {
      const tipText = (tipPercent > 0 || vipBonus > 0) ? ` (Tip!)` : '';
      this.onFloatingReward({
        id: Math.random().toString(),
        text: `+$${totalEarned}${tipText}`,
        x: queueIndex === 0 ? window.innerWidth * 0.65 : window.innerWidth * 0.78,
        y: window.innerHeight * 0.36,
        color: '#16a34a',
      });
    }

    customer.state = 'leaving';
  }

  private serveNextCustomer() {
    this.serveCustomerAtQueue(0);
  }

  private spawnCoinReward(amount: number, origin?: THREE.Vector3) {
    const coinGroup = new THREE.Group();
    const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12);
    coinGeo.rotateZ(Math.PI / 2);
    const coinMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const coinMesh = new THREE.Mesh(coinGeo, coinMat);
    coinGroup.add(coinMesh);

    coinGroup.position.copy(origin || _v1.set(4.5, 1.2, -4.2));
    this.scene.add(coinGroup);

    this.flyingCoins.push({
      mesh: coinGroup,
      startPos: coinGroup.position.clone(),
      targetActor: 'player',
      progress: 0,
      value: amount,
    });
  }

  private updateFx(dt: number) {
    // Magnetic coins flying to player
    for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
      const c = this.flyingCoins[i];
      c.progress += dt * 3.2;

      // Arc towards player chest
      const targetPos = this.playerPos.clone().add(_v1.set(0, 1.2, 0));
      c.mesh.position.lerpVectors(c.startPos, targetPos, c.progress);
      c.mesh.position.y += Math.sin(c.progress * Math.PI) * 1.2;
      c.mesh.rotation.y += dt * 15;

      if (c.progress >= 1.0) {
        sound.playCoin();
        this.scene.remove(c.mesh);
        this.flyingCoins.splice(i, 1);
      }
    }
  }

  public resize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public getWeather(): WeatherType {
    return this.weatherSystem.currentWeather;
  }

  public setWeather(weather: WeatherType) {
    this.weatherSystem.setWeather(weather);
  }

  public cycleWeather(): WeatherType {
    return this.weatherSystem.cycleWeather();
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    sound.stopStoreAudio();
    if (this.weatherSystem) {
      this.weatherSystem.dispose(this.scene);
    }
    this.renderer.dispose();
  }
}
