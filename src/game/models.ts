import * as THREE from 'three';
import { ItemType, ITEM_DEFS, UnlockPad } from './types';

// Shared materials and geometries for high performance and zero memory leaks
const shadowGeo = new THREE.PlaneGeometry(1.4, 1.4);
const shadowMat = new THREE.MeshBasicMaterial({
  color: 0x0a1510,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});
shadowGeo.rotateX(-Math.PI / 2);

/**
 * Creates a soft radial contact shadow disc
 */
export function createContactShadow(radius = 0.7): THREE.Mesh {
  const mesh = new THREE.Mesh(shadowGeo, shadowMat);
  mesh.scale.set(radius, 1, radius);
  mesh.position.y = 0.015;
  return mesh;
}

/**
 * Creates lush, vibrant stylized grass procedural canvas texture
 */
export function createLushGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base rich vibrant lawn green
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#22c55e'); // emerald green
  grad.addColorStop(0.5, '#16a34a'); // rich green
  grad.addColorStop(1, '#15803d'); // deep grass green
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft organic grass mottling
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 8 + Math.random() * 22;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(74, 222, 128, 0.25)' : 'rgba(21, 128, 61, 0.22)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scattered stylized grass blades
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 350; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const bladeLen = 6 + Math.random() * 9;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;

    ctx.strokeStyle = i % 3 === 0 ? '#86efac' : i % 2 === 0 ? '#4ade80' : '#15803d';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * bladeLen, y + Math.sin(angle) * bladeLen);
    ctx.stroke();
  }

  // Cute tiny wildflower daisies (white petals + golden yellow center)
  for (let i = 0; i < 24; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    // 5 white petals
    ctx.fillStyle = '#ffffff';
    for (let p = 0; p < 5; p++) {
      const pAngle = (p * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(pAngle) * 4, cy + Math.sin(pAngle) * 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Yellow pistil center
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3-leaf clovers
  for (let i = 0; i < 18; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    ctx.fillStyle = '#14532d';
    for (let c = 0; c < 3; c++) {
      const cAngle = (c * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(cAngle) * 3.5, cy + Math.sin(cAngle) * 3.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates realistic architectural supermarket wall texture with clean painted brick/shiplap and wood wainscot
 */
export function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Upper 70%: Modern clean off-white / light cream painted brickwork
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 360);

  // Brick rows with mortar
  const brickH = 24;
  const brickW = 56;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.5;

  let row = 0;
  for (let y = 0; y < 360; y += brickH) {
    const xOffset = (row % 2) * (brickW / 2);
    // Horizontal mortar line
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Vertical brick seams
    for (let x = -brickW + xOffset; x <= 512; x += brickW) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + brickH);
      ctx.stroke();
    }
    row++;
  }

  // Decorative wooden chair rail molding divider
  ctx.fillStyle = '#78350f'; // rich warm wood
  ctx.fillRect(0, 356, 512, 8);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 358, 512, 3);

  // Lower 30%: Warm architectural wood paneling / beadboard wainscoting
  const woodGrad = ctx.createLinearGradient(0, 364, 0, 512);
  woodGrad.addColorStop(0, '#92400e');
  woodGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(0, 364, 512, 148);

  // Vertical panel grooves
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 364);
    ctx.lineTo(x, 512);
    ctx.stroke();

    // Subtle highlight on panel edge
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.beginPath();
    ctx.moveTo(x + 2, 364);
    ctx.lineTo(x + 2, 512);
    ctx.stroke();
    ctx.strokeStyle = '#451a03';
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates stepping stone path texture for garden walkways
 */
export function createCobblestoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;

  // Flagstone pattern
  for (let y = 10; y < 256; y += 40) {
    for (let x = 10; x < 256; x += 50) {
      const w = 36 + Math.sin(x + y) * 8;
      const h = 28 + Math.cos(x * y) * 6;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates realistic warm commercial supermarket terrazzo & honed stone floor tiles
 */
export function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Background grout base color (warm charcoal limestone grout)
  ctx.fillStyle = '#78716c';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 64; // 8x8 tiles in 512x512
  const groutWidth = 2;

  // Realistic natural supermarket stone tile palette (warm travertine & limestone)
  const tileShades = [
    '#fbf6ee', // warm ivory travertine
    '#f3e9d8', // soft golden sandstone
    '#ebe0cf', // honed beige stone
    '#f7f0e4', // warm cream limestone
    '#efe4d3', // sandy neutral
  ];

  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      // Pick consistent pseudo-random shade for each tile
      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const shadeIndex = Math.abs(Math.floor(seed)) % tileShades.length;
      const baseColor = tileShades[shadeIndex];

      const tx = x + groutWidth;
      const ty = y + groutWidth;
      const tw = tileSize - groutWidth * 2;
      const th = tileSize - groutWidth * 2;

      // Base tile surface
      ctx.fillStyle = baseColor;
      ctx.fillRect(tx, ty, tw, th);

      // Subtle natural stone grain & quartz flecks
      for (let s = 0; s < 35; s++) {
        const fx = tx + (Math.abs(Math.sin(seed + s * 1.7)) * tw);
        const fy = ty + (Math.abs(Math.cos(seed + s * 2.3)) * th);
        const fr = 0.8 + (s % 3) * 0.6;
        ctx.fillStyle = s % 3 === 0
          ? 'rgba(255, 255, 255, 0.45)' // sparkling quartz fleck
          : s % 2 === 0
          ? 'rgba(120, 113, 108, 0.22)' // dark mineral speck
          : 'rgba(180, 83, 9, 0.15)'; // warm terracotta speck
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D Bevel Edge Lighting (top & left highlight, bottom & right shadow)
      // Top highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(tx, ty, tw, 2);
      // Left highlight
      ctx.fillRect(tx, ty, 2, th);
      // Bottom shadow
      ctx.fillStyle = 'rgba(87, 83, 78, 0.25)';
      ctx.fillRect(tx, ty + th - 2, tw, 2);
      // Right shadow
      ctx.fillRect(tx + tw - 2, ty, 2, th);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 7);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates 3D model for single carried / displayed items
 */
export function createItemMesh(type: ItemType): THREE.Group {
  const group = new THREE.Group();

  if (type === 'tomato') {
    // Red tomato body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.25,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), bodyMat);
    body.scale.set(1.1, 0.9, 1.1);
    body.castShadow = true;
    group.add(body);

    // Green stem / calyx
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6), stemMat);
    stem.position.y = 0.24;
    group.add(stem);

    const sepal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.05, 5), stemMat);
    sepal.position.y = 0.22;
    sepal.rotation.x = Math.PI;
    group.add(sepal);
  } else if (type === 'apple') {
    // Shiny red/golden apple
    const appleMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.2,
      metalness: 0.15,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 14), appleMat);
    body.scale.set(1.0, 1.05, 1.0);
    body.castShadow = true;
    group.add(body);

    // Brown twig stem
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.14, 6), stemMat);
    stem.position.set(0.02, 0.25, 0);
    stem.rotation.z = 0.2;
    group.add(stem);

    // Tiny green leaf
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.4 });
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.14), leafMat);
    leaf.position.set(0.06, 0.26, 0);
    leaf.rotation.z = 0.4;
    group.add(leaf);
  } else if (type === 'egg') {
    // Farm egg oval
    const eggMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.35,
      metalness: 0.05,
    });
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), eggMat);
    egg.scale.set(0.85, 1.25, 0.85);
    egg.castShadow = true;
    group.add(egg);
  } else if (type === 'juice') {
    // Glass juice bottle with colorful juice and cap
    const bottleMat = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.42, 12), bottleMat);
    bottle.castShadow = true;
    group.add(bottle);

    // White bottle cap
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), capMat);
    cap.position.y = 0.24;
    group.add(cap);

    // Fruit label band
    const labelMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.182, 0.182, 0.18, 12), labelMat);
    group.add(label);
  } else if (type === 'bread') {
    // Golden baked baguette loaf
    const breadMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.75,
      metalness: 0.05,
    });
    const loaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.38, 8, 12), breadMat);
    loaf.rotation.z = Math.PI / 2;
    loaf.castShadow = true;
    group.add(loaf);

    // Crust score cuts
    const cutMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });
    for (let c = -0.12; c <= 0.12; c += 0.12) {
      const cut = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.14), cutMat);
      cut.position.set(c, 0.12, 0);
      cut.rotation.y = 0.3;
      group.add(cut);
    }
  } else if (type === 'coffee') {
    // Cafe paper cup with heat sleeve and sipping lid
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.4, 12), cupMat);
    cup.castShadow = true;
    group.add(cup);

    // Brown heat sleeve
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.14, 0.18, 12), sleeveMat);
    sleeve.position.y = -0.02;
    group.add(sleeve);

    // Dark espresso surface
    const coffeeMat = new THREE.MeshStandardMaterial({ color: 0x3b1e08, roughness: 0.2 });
    const topCoffee = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.02, 12), coffeeMat);
    topCoffee.position.y = 0.19;
    group.add(topCoffee);

    // White sip lid
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12), lidMat);
    lid.position.y = 0.21;
    group.add(lid);
  } else if (type === 'cheese') {
    // Rich golden artisan cheese wheel with a wedge notch
    const cheeseMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
      metalness: 0.05,
    });
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 16), cheeseMat);
    wheel.castShadow = true;
    group.add(wheel);

    // Red wax rind border
    const waxMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const rind = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.04, 16), waxMat);
    rind.position.y = 0.08;
    group.add(rind);
  }

  return group;
}

/**
 * Composite Character 3D Model (Player, Worker, Customer)
 * 8-10 distinct parts, animated legs and arms, stack carrier node
 */
export interface CharacterModelData {
  root: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
  body: THREE.Group;
  stackPivot: THREE.Group;
  bagPivot: THREE.Group;
  updateAnimation: (
    walkSpeed: number,
    runPhase: number,
    wobbleX: number,
    wobbleZ: number,
    actionState?: 'walking' | 'shopping' | 'queuing' | 'idle'
  ) => void;
}

export function createCharacterModel(options: {
  shirtColor: number;
  pantsColor: number;
  skinColor?: number;
  capColor?: number;
  isPlayer?: boolean;
  isWorker?: boolean;
  apronColor?: number;
}): CharacterModelData {
  const root = new THREE.Group();

  // Contact shadow at feet
  root.add(createContactShadow(0.65));

  // Colors
  const skinMat = new THREE.MeshStandardMaterial({
    color: options.skinColor ?? 0xfcd34d,
    roughness: 0.4,
    metalness: 0.05,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: options.shirtColor,
    roughness: 0.5,
    metalness: 0.05,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: options.pantsColor,
    roughness: 0.6,
    metalness: 0.05,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Body / Torso
  const body = new THREE.Group();
  body.position.y = 0.9;
  root.add(body);

  const torsoMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.65, 0.45),
    shirtMat
  );
  torsoMesh.castShadow = true;
  body.add(torsoMesh);

  // Apron or pocket if player or worker
  if (options.isPlayer || options.isWorker) {
    const apronMat = new THREE.MeshStandardMaterial({
      color: options.apronColor ?? (options.isPlayer ? 0x16a34a : 0x0284c7),
      roughness: 0.4,
      metalness: 0.05,
    });
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.47), apronMat);
    body.add(apron);

    // Golden Mart Badge
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.7,
      roughness: 0.2,
    });
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.49), badgeMat);
    badge.position.set(0.14, 0.14, 0);
    body.add(badge);
  }

  // Head
  const head = new THREE.Group();
  head.position.y = 0.55;
  body.add(head);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.11, 0.04, 0.28);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.11, 0.04, 0.28);
  head.add(rightEye);

  // Cap / Hat if player or worker
  if (options.capColor) {
    const capMat = new THREE.MeshStandardMaterial({
      color: options.capColor,
      roughness: 0.4,
    });
    const capDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
      capMat
    );
    capDome.position.y = 0.06;
    head.add(capDome);

    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.24), capMat);
    brim.position.set(0, 0.14, 0.32);
    brim.rotation.x = -0.15;
    head.add(brim);
  }

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, 0.55, 0);
  root.add(leftLeg);

  const leftPants = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.55, 10), pantsMat);
  leftPants.position.y = -0.22;
  leftPants.castShadow = true;
  leftLeg.add(leftPants);

  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), shoeMat);
  leftShoe.position.set(0, -0.48, 0.06);
  leftLeg.add(leftShoe);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0.55, 0);
  root.add(rightLeg);

  const rightPants = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.55, 10), pantsMat);
  rightPants.position.y = -0.22;
  rightPants.castShadow = true;
  rightLeg.add(rightPants);

  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), shoeMat);
  rightShoe.position.set(0, -0.48, 0.06);
  rightLeg.add(rightShoe);

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 0.24, 0);
  body.add(leftArm);

  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), shirtMat);
  leftArmMesh.position.y = -0.2;
  leftArm.add(leftArmMesh);

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), skinMat);
  leftHand.position.y = -0.44;
  leftArm.add(leftHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.24, 0);
  body.add(rightArm);

  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), shirtMat);
  rightArmMesh.position.y = -0.2;
  rightArm.add(rightArmMesh);

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), skinMat);
  rightHand.position.y = -0.44;
  rightArm.add(rightHand);

  // Carried Stack Pivot (in front of chest with spring wobble)
  const stackPivot = new THREE.Group();
  stackPivot.position.set(0, 0.1, 0.48);
  body.add(stackPivot);

  // Customer Shopping Bag / Cart Pivot (held at side)
  const bagPivot = new THREE.Group();
  bagPivot.position.set(0.42, -0.3, 0.1);
  body.add(bagPivot);

  // Animation helper
  const updateAnimation = (
    walkSpeed: number,
    runPhase: number,
    wobbleX: number,
    wobbleZ: number,
    actionState?: 'walking' | 'shopping' | 'queuing' | 'idle'
  ) => {
    const isWalking = walkSpeed > 0.05 || actionState === 'walking';

    if (isWalking) {
      const legAngle = Math.sin(runPhase) * 0.7 * Math.min(walkSpeed || 1.0, 1.2);
      leftLeg.rotation.x = legAngle;
      rightLeg.rotation.x = -legAngle;
      leftLeg.rotation.z = 0;
      rightLeg.rotation.z = 0;

      // Natural bobbing body with walking gait
      body.position.y = 0.9 + Math.abs(Math.sin(runPhase * 2)) * 0.07;

      // Arm movements
      if (stackPivot.children.length > 0) {
        // Holding stack forward
        leftArm.rotation.x = -1.1 + Math.sin(runPhase) * 0.05;
        leftArm.rotation.z = -0.3;
        leftArm.rotation.y = 0;
        rightArm.rotation.x = -1.1 - Math.sin(runPhase) * 0.05;
        rightArm.rotation.z = 0.3;
        rightArm.rotation.y = 0;
      } else if (bagPivot.children.length > 0) {
        // Customer holding shopping grocery bag
        // Left arm swings with walk
        leftArm.rotation.x = -legAngle * 0.75;
        leftArm.rotation.z = -0.15;
        leftArm.rotation.y = 0;

        // Right arm holds bag with gentle pendulum sway
        rightArm.rotation.x = -0.25 + Math.sin(runPhase) * 0.15;
        rightArm.rotation.z = 0.18;
        rightArm.rotation.y = 0;

        bagPivot.rotation.x = Math.sin(runPhase) * 0.22;
        bagPivot.rotation.z = -Math.cos(runPhase) * 0.08;
      } else {
        // Normal arm swing
        leftArm.rotation.x = -legAngle * 0.8;
        leftArm.rotation.z = -0.1;
        leftArm.rotation.y = 0;
        rightArm.rotation.x = legAngle * 0.8;
        rightArm.rotation.z = 0.1;
        rightArm.rotation.y = 0;
      }

      // Gentle head bobbing with walking pace
      head.rotation.y = Math.sin(runPhase) * 0.06;
      head.rotation.x = 0;
    } else if (actionState === 'shopping') {
      // Browsing shelf animation: customer tilts head to inspect goods, reaches hand out
      leftLeg.rotation.x = 0.05;
      rightLeg.rotation.x = -0.05;
      leftLeg.rotation.z = 0;
      rightLeg.rotation.z = 0;

      // Subtle breathing idle
      body.position.y = 0.9 + Math.sin(runPhase * 2) * 0.025;

      // Head turns and nods inspecting shelf items
      head.rotation.y = -0.45 + Math.sin(runPhase * 1.5) * 0.22;
      head.rotation.x = 0.18 + Math.cos(runPhase * 1.5) * 0.1;

      // Left arm reaches out to inspect/grab goods from shelf
      leftArm.rotation.x = -1.15 + Math.sin(runPhase * 2) * 0.18;
      leftArm.rotation.y = -0.35;
      leftArm.rotation.z = -0.1;

      // Right arm rests bag securely at side
      rightArm.rotation.x = -0.2;
      rightArm.rotation.z = 0.2;
      rightArm.rotation.y = 0;
      bagPivot.rotation.x = Math.sin(runPhase) * 0.05;
      bagPivot.rotation.z = 0;
    } else if (actionState === 'queuing') {
      // Waiting in checkout queue animation: gentle weight shift, looking around
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      // Gentle weight shift between feet
      leftLeg.rotation.z = Math.sin(runPhase * 1.2) * 0.04;
      rightLeg.rotation.z = -Math.sin(runPhase * 1.2) * 0.04;

      // Breathing bob
      body.position.y = 0.9 + Math.sin(runPhase * 2.5) * 0.018;

      // Head looks around patiently
      head.rotation.y = Math.sin(runPhase * 1.1) * 0.25;
      head.rotation.x = 0;

      leftArm.rotation.x = -0.15;
      leftArm.rotation.z = -0.1;
      leftArm.rotation.y = 0;

      rightArm.rotation.x = -0.25;
      rightArm.rotation.z = 0.18;
      rightArm.rotation.y = 0;
      bagPivot.rotation.x = Math.sin(runPhase * 1.2) * 0.06;
      bagPivot.rotation.z = 0;
    } else {
      // Idle standing
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftLeg.rotation.z = 0;
      rightLeg.rotation.z = 0;
      body.position.y = 0.9;
      head.rotation.set(0, 0, 0);

      if (stackPivot.children.length > 0) {
        leftArm.rotation.x = -1.0;
        leftArm.rotation.z = -0.3;
        leftArm.rotation.y = 0;
        rightArm.rotation.x = -1.0;
        rightArm.rotation.z = 0.3;
        rightArm.rotation.y = 0;
      } else {
        leftArm.rotation.set(0, 0, 0);
        rightArm.rotation.set(0, 0, 0);
      }
      bagPivot.rotation.set(0, 0, 0);
    }

    // Apply carried stack spring wobble
    stackPivot.rotation.x = wobbleX;
    stackPivot.rotation.z = wobbleZ;
  };

  return {
    root,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    body,
    stackPivot,
    bagPivot,
    updateAnimation,
  };
}

/**
 * Creates Customer Shopping Bag (Brown Paper Grocery Bag)
 */
export function createCustomerBag(): THREE.Group {
  const bag = new THREE.Group();
  const bagMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // brown paper grocery bag
    roughness: 0.9,
  });
  const bagMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.25), bagMat);
  bagMesh.position.y = -0.15;
  bag.add(bagMesh);

  // Handles
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 12, Math.PI), handleMat);
  handle.position.y = 0.06;
  bag.add(handle);

  return bag;
}

/**
 * Creates Colorful Supermarket Hand Shopping Basket
 */
export function createShoppingBasket(basketColor = 0xef4444): THREE.Group {
  const basket = new THREE.Group();
  const basketMat = new THREE.MeshStandardMaterial({
    color: basketColor,
    roughness: 0.4,
    metalness: 0.1,
  });

  // Base basket tray with tapered walls
  const basketBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.3), basketMat);
  basketBody.position.y = -0.1;
  basketBody.castShadow = true;
  basket.add(basketBody);

  // Inner hollow cavity
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.5,
  });
  const innerCavity = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.24), innerMat);
  innerCavity.position.y = 0.02;
  basket.add(innerCavity);

  // Wire/metal folding handles
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.8,
    roughness: 0.2,
  });
  const handleArch = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.016, 6, 16, Math.PI), wireMat);
  handleArch.position.y = 0.07;
  basket.add(handleArch);

  return basket;
}

/**
 * Creates Canvas Eco Tote Bag with Fabric Straps
 */
export function createToteBag(toteColor = 0xfef08a): THREE.Group {
  const tote = new THREE.Group();
  const toteMat = new THREE.MeshStandardMaterial({
    color: toteColor,
    roughness: 0.85,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.18), toteMat);
  body.position.y = -0.14;
  tote.add(body);

  // Shoulder / arm loops
  const strapMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.9 });
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 14, Math.PI), strapMat);
  strap.position.y = 0.06;
  tote.add(strap);

  return tote;
}

/**
 * Creates Executive Leather Briefcase with Brass Hardware
 */
export function createBriefcase(): THREE.Group {
  const caseGroup = new THREE.Group();
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.5,
    metalness: 0.1,
  });
  const caseBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.44), leatherMat);
  caseBody.position.y = -0.14;
  caseGroup.add(caseBody);

  // Brass handle & latches
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.85,
    roughness: 0.25,
  });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.14), brassMat);
  handle.position.y = 0.05;
  caseGroup.add(handle);

  const latch1 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.03), brassMat);
  latch1.position.set(0, -0.05, -0.12);
  caseGroup.add(latch1);

  const latch2 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.03), brassMat);
  latch2.position.set(0, -0.05, 0.12);
  caseGroup.add(latch2);

  return caseGroup;
}

/**
 * Customer Archetype Definition
 */
export type CustomerArchetype = 'casual' | 'business' | 'elder' | 'kid' | 'athlete' | 'student';

export interface DiverseCustomerModelData extends CharacterModelData {
  archetype: CustomerArchetype;
  baseSpeed: number;
  strideRate: number;
  browseDuration: number;
}

// Diverse skin and hair tone palettes
const DIVERSE_SKINS = [
  0xfcd34d, // warm golden peach
  0xfbbf24, // warm honey
  0xd97706, // golden tan
  0xb45309, // warm chestnut
  0x804d30, // rich umber
  0x5c3826, // deep bronze
  0xfecaca, // rosy fair
  0xd2a679, // olive tan
];

const DIVERSE_HAIR_COLORS = [
  0x0f172a, // pitch black
  0x3b2413, // espresso brown
  0x78350f, // warm chestnut
  0xb45309, // auburn ginger
  0xd97706, // honey blonde
  0xfef08a, // light blonde
];

/**
 * Creates Diverse Procedural Customer 3D Model with Archetype-Specific
 * Proportions, Attire, Accessories, and Distinct Kinematic Walking & Shopping Animations
 */
export function createDiverseCustomerModel(options?: {
  archetype?: CustomerArchetype;
  seed?: number;
}): DiverseCustomerModelData {
  const archetypes: CustomerArchetype[] = [
    'casual',
    'business',
    'elder',
    'kid',
    'athlete',
    'student',
  ];
  const s = options?.seed ?? Math.random();
  const archetype = options?.archetype ?? archetypes[Math.floor(s * archetypes.length)];

  const root = new THREE.Group();

  // Pick skin tone
  const skinColor =
    archetype === 'elder'
      ? 0xfde047
      : DIVERSE_SKINS[Math.floor((s * 13) % DIVERSE_SKINS.length)];
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: archetype === 'elder' ? 0.6 : 0.4,
    metalness: 0.05,
  });

  // Archetype Proportions & Settings
  let scaleX = 1.0;
  let scaleY = 1.0;
  let scaleZ = 1.0;
  let baseSpeed = 2.6;
  let strideRate = 2.8;
  let browseDuration = 0.9;
  let shadowRadius = 0.65;

  let shirtColor = 0x3b82f6;
  let pantsColor = 0x1e293b;
  let shoeColor = 0x0f172a;
  let hairColor = DIVERSE_HAIR_COLORS[Math.floor((s * 7) % DIVERSE_HAIR_COLORS.length)];

  switch (archetype) {
    case 'kid':
      scaleX = 0.76;
      scaleY = 0.74;
      scaleZ = 0.76;
      baseSpeed = 3.15;
      strideRate = 3.5;
      browseDuration = 0.7;
      shadowRadius = 0.52;
      shirtColor = [0xfacc15, 0x06b6d4, 0xf43f5e, 0x10b981][Math.floor(s * 4)];
      pantsColor = [0x2563eb, 0xd97706, 0x475569][Math.floor(s * 3)];
      shoeColor = 0xef4444; // bright red sneakers
      break;

    case 'elder':
      scaleX = 0.94;
      scaleY = 0.92;
      scaleZ = 0.94;
      baseSpeed = 1.95;
      strideRate = 2.1;
      browseDuration = 1.45;
      shadowRadius = 0.62;
      shirtColor = [0xd4d4d8, 0xa78bfa, 0x84cc16, 0xe7e5e4][Math.floor(s * 4)]; // cozy cardigans
      pantsColor = [0x78350f, 0x475569, 0x57534e][Math.floor(s * 3)]; // tweed / slacks
      shoeColor = 0x44403c; // loafers
      hairColor = [0xe2e8f0, 0x94a3b8, 0xcbd5e1][Math.floor(s * 3)]; // silver-gray hair
      break;

    case 'business':
      scaleX = 1.03;
      scaleY = 1.05;
      scaleZ = 1.03;
      baseSpeed = 2.95;
      strideRate = 2.9;
      browseDuration = 0.8;
      shadowRadius = 0.68;
      shirtColor = [0x1e3a8a, 0x334155, 0x0f172a, 0x475569][Math.floor(s * 4)]; // tailored suit
      pantsColor = shirtColor;
      shoeColor = 0x020617; // formal oxford shoes
      hairColor = [0x0f172a, 0x3b2413][Math.floor(s * 2)];
      break;

    case 'athlete':
      scaleX = 1.06;
      scaleY = 1.07;
      scaleZ = 1.05;
      baseSpeed = 3.3;
      strideRate = 3.2;
      browseDuration = 0.85;
      shadowRadius = 0.68;
      shirtColor = [0x84cc16, 0x06b6d4, 0xf97316, 0xec4899][Math.floor(s * 4)]; // neon athletic
      pantsColor = [0x18181b, 0x27272a][Math.floor(s * 2)]; // track pants
      shoeColor = 0xf8fafc; // white running shoes with neon soles
      break;

    case 'student':
      scaleX = 0.98;
      scaleY = 0.98;
      scaleZ = 0.98;
      baseSpeed = 2.55;
      strideRate = 2.65;
      browseDuration = 1.0;
      shadowRadius = 0.64;
      shirtColor = [0x991b1b, 0x4f46e5, 0x059669, 0xd97706][Math.floor(s * 4)]; // oversized hoodie
      pantsColor = [0x2563eb, 0x1e293b, 0x334155][Math.floor(s * 3)]; // relaxed denim
      shoeColor = 0x1e293b;
      break;

    case 'casual':
    default:
      scaleX = 1.0;
      scaleY = 1.0;
      scaleZ = 1.0;
      baseSpeed = 2.5;
      strideRate = 2.75;
      browseDuration = 0.95;
      shadowRadius = 0.65;
      shirtColor = [0x2dd4bf, 0xfb7185, 0x38bdf8, 0xc084fc, 0xfbbf24][Math.floor(s * 5)];
      pantsColor = [0x1e293b, 0x475569, 0x334155][Math.floor(s * 3)];
      shoeColor = 0x1e293b;
      break;
  }

  root.scale.set(scaleX, scaleY, scaleZ);

  // Contact shadow
  root.add(createContactShadow(shadowRadius));

  const shirtMat = new THREE.MeshStandardMaterial({
    color: shirtColor,
    roughness: 0.5,
    metalness: 0.05,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColor,
    roughness: 0.6,
    metalness: 0.05,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: shoeColor,
    roughness: 0.7,
    metalness: 0.1,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.6,
  });

  // Body / Torso
  const body = new THREE.Group();
  body.position.y = 0.9;
  if (archetype === 'elder') {
    body.rotation.x = 0.08; // gentle elder stoop
  }
  root.add(body);

  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.65, 0.45), shirtMat);
  torsoMesh.castShadow = true;
  body.add(torsoMesh);

  // Archetype Torso Details
  if (archetype === 'business') {
    // White shirt collar V
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.47), whiteMat);
    collar.position.set(0, 0.22, 0);
    body.add(collar);

    // Silk Necktie (crimson or royal blue)
    const tieMat = new THREE.MeshStandardMaterial({
      color: s > 0.5 ? 0xbe123c : 0x1d4ed8,
      roughness: 0.3,
      metalness: 0.15,
    });
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.38, 0.48), tieMat);
    tie.position.set(0, 0.1, 0);
    body.add(tie);
  } else if (archetype === 'student') {
    // Hoodie kangaroo pouch
    const pouchMat = new THREE.MeshStandardMaterial({
      color: shirtColor,
      roughness: 0.65,
    });
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.49), pouchMat);
    pouch.position.set(0, -0.15, 0);
    body.add(pouch);

    // College Backpack mounted on back of torso
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // vibrant cyan backpack
      roughness: 0.7,
    });
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.24), bagMat);
    backpack.position.set(0, 0.02, -0.32);
    backpack.castShadow = true;
    body.add(backpack);

    // Backpack front zipper pocket
    const pocketMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.7 });
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.08), pocketMat);
    pocket.position.set(0, -0.1, -0.46);
    body.add(pocket);
  } else if (archetype === 'athlete') {
    // Sporty racing stripe down torso
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.66, 0.47), stripeMat);
    body.add(stripe);
  } else if (archetype === 'elder') {
    // Cardigan buttons
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.4 });
    for (let b = -0.15; b <= 0.2; b += 0.12) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.47, 8), btnMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, b, 0);
      body.add(btn);
    }
  }

  // Head
  const head = new THREE.Group();
  head.position.y = 0.55;
  body.add(head);

  const headRadius = archetype === 'kid' ? 0.36 : 0.32;
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 16, 14), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.11, 0.04, headRadius - 0.04);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.11, 0.04, headRadius - 0.04);
  head.add(rightEye);

  // Archetype Headwear / Hairstyle / Glasses
  if (archetype === 'kid') {
    // Cute backwards or sideways baseball cap
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.4,
    });
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48),
      capMat
    );
    dome.position.y = 0.06;
    head.add(dome);

    // Brim pointing backwards
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.26), capMat);
    brim.position.set(0, 0.08, -0.34);
    brim.rotation.x = 0.2;
    head.add(brim);

    // Propeller / top button on cap
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const capBtn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), buttonMat);
    capBtn.position.set(0, 0.38, 0);
    head.add(capBtn);
  } else if (archetype === 'elder') {
    // Silver hair with braided top bun or side fringe
    const hairDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.46),
      hairMat
    );
    hairDome.position.y = 0.08;
    head.add(hairDome);

    // Top hair bun
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), hairMat);
    bun.position.set(0, 0.38, -0.12);
    head.add(bun);

    // Round wire spectacles perched on nose!
    const glassesMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.2,
    });
    const leftRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.015, 6, 14),
      glassesMat
    );
    leftRim.position.set(-0.11, 0.04, headRadius + 0.01);
    head.add(leftRim);

    const rightRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.015, 6, 14),
      glassesMat
    );
    rightRim.position.set(0.11, 0.04, headRadius + 0.01);
    head.add(rightRim);

    // Glasses bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), glassesMat);
    bridge.position.set(0, 0.04, headRadius + 0.01);
    head.add(bridge);
  } else if (archetype === 'athlete') {
    // Athletic sweatband across forehead
    const sweatbandMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // fiery red headband
      roughness: 0.5,
    });
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.33, 0.08, 16, 1, true),
      sweatbandMat
    );
    band.position.y = 0.12;
    head.add(band);

    // Spiky runner hair on top
    const hairSpikes = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.22, 10),
      hairMat
    );
    hairSpikes.position.set(0, 0.38, 0);
    head.add(hairSpikes);
  } else if (archetype === 'business') {
    // Clean side-parted hairstyle
    const hairDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.44),
      hairMat
    );
    hairDome.position.y = 0.08;
    head.add(hairDome);

    const sidePart = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.28), hairMat);
    sidePart.position.set(0.04, 0.28, 0.06);
    sidePart.rotation.z = -0.15;
    head.add(sidePart);
  } else if (archetype === 'student') {
    // Ribbed knit beanie or chunky headphones around neck
    const beanieMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1, // indigo beanie
      roughness: 0.8,
    });
    const beanie = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      beanieMat
    );
    beanie.position.y = 0.1;
    head.add(beanie);

    // Padded headphones around neck
    const phoneMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const phoneBand = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 6, 16, Math.PI), phoneMat);
    phoneBand.rotation.x = Math.PI / 2;
    phoneBand.position.set(0, -0.22, 0.04);
    head.add(phoneBand);
  } else {
    // Casual hairstyle: Ponytail or Chic Bob
    const hairDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.46),
      hairMat
    );
    hairDome.position.y = 0.08;
    head.add(hairDome);

    if (s > 0.5) {
      // High bouncy ponytail
      const ponyTie = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.02, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0xec4899 })
      );
      ponyTie.position.set(0, 0.24, -0.32);
      head.add(ponyTie);

      const ponytail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.3, 8), hairMat);
      ponytail.position.set(0, 0.12, -0.42);
      ponytail.rotation.x = 0.5;
      head.add(ponytail);
    }
  }

  // Legs & Pants
  const legLen = archetype === 'kid' ? 0.42 : 0.55;
  const legY = archetype === 'kid' ? 0.45 : 0.55;

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, legY, 0);
  root.add(leftLeg);

  const leftPants = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, legLen, 10), pantsMat);
  leftPants.position.y = -legLen / 2;
  leftPants.castShadow = true;
  leftLeg.add(leftPants);

  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), shoeMat);
  leftShoe.position.set(0, -legLen - 0.02, 0.06);
  leftLeg.add(leftShoe);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, legY, 0);
  root.add(rightLeg);

  const rightPants = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, legLen, 10), pantsMat);
  rightPants.position.y = -legLen / 2;
  rightPants.castShadow = true;
  rightLeg.add(rightPants);

  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), shoeMat);
  rightShoe.position.set(0, -legLen - 0.02, 0.06);
  rightLeg.add(rightShoe);

  // Arms
  const armLen = archetype === 'kid' ? 0.4 : 0.5;

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 0.24, 0);
  body.add(leftArm);

  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, armLen, 8), shirtMat);
  leftArmMesh.position.y = -armLen / 2;
  leftArm.add(leftArmMesh);

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), skinMat);
  leftHand.position.y = -armLen - 0.04;
  leftArm.add(leftHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.24, 0);
  body.add(rightArm);

  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, armLen, 8), shirtMat);
  rightArmMesh.position.y = -armLen / 2;
  rightArm.add(rightArmMesh);

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), skinMat);
  rightHand.position.y = -armLen - 0.04;
  rightArm.add(rightHand);

  // Carried Stack Pivot
  const stackPivot = new THREE.Group();
  stackPivot.position.set(0, 0.1, 0.48);
  body.add(stackPivot);

  // Customer Shopping Bag / Basket Pivot (held at side)
  const bagPivot = new THREE.Group();
  bagPivot.position.set(0.42, -0.3, 0.1);
  body.add(bagPivot);

  // If business, attach briefcase in left hand
  if (archetype === 'business') {
    const briefcase = createBriefcase();
    briefcase.position.set(0, -armLen - 0.12, 0);
    leftArm.add(briefcase);
  }

  // Archetype-Specific Kinematic Walking & Shopping Animations
  const updateAnimation = (
    walkSpeed: number,
    runPhase: number,
    wobbleX: number,
    wobbleZ: number,
    actionState?: 'walking' | 'shopping' | 'queuing' | 'idle'
  ) => {
    const isWalking = walkSpeed > 0.05 || actionState === 'walking';

    if (isWalking) {
      if (archetype === 'kid') {
        // High-energy energetic bouncy trot
        const legAngle = Math.sin(runPhase) * 0.78 * Math.min(walkSpeed || 1.0, 1.3);
        leftLeg.rotation.x = legAngle;
        rightLeg.rotation.x = -legAngle;
        leftLeg.rotation.z = 0;
        rightLeg.rotation.z = 0;

        // Bouncy vertical hop
        body.position.y = 0.9 + Math.abs(Math.sin(runPhase * 2)) * 0.11;

        // Big enthusiastic arm swings
        leftArm.rotation.x = -legAngle * 1.1;
        leftArm.rotation.z = -0.18;
        rightArm.rotation.x = legAngle * 1.1;
        rightArm.rotation.z = 0.18;

        bagPivot.rotation.x = Math.sin(runPhase) * 0.35;
        bagPivot.rotation.z = -Math.cos(runPhase) * 0.12;

        head.rotation.y = Math.sin(runPhase) * 0.12;
        head.rotation.x = -0.05;
      } else if (archetype === 'elder') {
        // Slow, careful, steady shuffle with gentle forward stoop
        const legAngle = Math.sin(runPhase) * 0.38;
        leftLeg.rotation.x = legAngle;
        rightLeg.rotation.x = -legAngle;
        leftLeg.rotation.z = 0;
        rightLeg.rotation.z = 0;

        // Minimal smooth shuffle bob
        body.position.y = 0.9 + Math.abs(Math.sin(runPhase * 2)) * 0.022;
        body.rotation.x = 0.09; // stoop forward

        // Holds basket close to body steadily
        leftArm.rotation.x = -legAngle * 0.4;
        leftArm.rotation.z = -0.08;
        rightArm.rotation.x = -0.2 + Math.sin(runPhase) * 0.08;
        rightArm.rotation.z = 0.14;

        bagPivot.rotation.x = Math.sin(runPhase) * 0.1;
        bagPivot.rotation.z = 0;

        head.rotation.y = Math.sin(runPhase * 0.8) * 0.05;
        head.rotation.x = 0.1;
      } else if (archetype === 'athlete') {
        // Athletic dynamic jog with high knee drive and pumped arms
        const legAngle = Math.sin(runPhase) * 0.88 * Math.min(walkSpeed || 1.0, 1.25);
        leftLeg.rotation.x = legAngle;
        rightLeg.rotation.x = -legAngle;

        // Springy vertical propulsion
        body.position.y = 0.9 + Math.abs(Math.sin(runPhase * 2)) * 0.085;

        // Runner arm pumping
        leftArm.rotation.x = -legAngle * 1.25;
        leftArm.rotation.z = -0.22;
        rightArm.rotation.x = legAngle * 0.9;
        rightArm.rotation.z = 0.22;

        bagPivot.rotation.x = Math.sin(runPhase) * 0.28;
        bagPivot.rotation.z = -Math.cos(runPhase) * 0.1;

        head.rotation.y = Math.sin(runPhase) * 0.04;
        head.rotation.x = 0;
      } else if (archetype === 'business') {
        // Brisk purposeful stride, sharp and upright
        const legAngle = Math.sin(runPhase) * 0.62;
        leftLeg.rotation.x = legAngle;
        rightLeg.rotation.x = -legAngle;

        // Upright tall posture, minimal torso bob
        body.position.y = 0.9 + Math.abs(Math.sin(runPhase * 2)) * 0.04;
        body.rotation.x = -0.03;

        // Left arm holds briefcase steady at side
        leftArm.rotation.x = 0.06;
        leftArm.rotation.z = -0.14;
        leftArm.rotation.y = 0;

        // Right arm swings smoothly
        rightArm.rotation.x = legAngle * 0.7;
        rightArm.rotation.z = 0.12;

        bagPivot.rotation.x = Math.sin(runPhase) * 0.18;
        bagPivot.rotation.z = 0;

        head.rotation.y = Math.sin(runPhase) * 0.05;
        head.rotation.x = 0;
      } else if (archetype === 'student') {
        // Relaxed cool stride with subtle side swagger
        const legAngle = Math.sin(runPhase) * 0.65;
        leftLeg.rotation.x = legAngle;
        rightLeg.rotation.x = -legAngle;

        // Side-to-side swagger bob
        body.position.y = 0.9 + Math.abs(Math.sin(runPhase * 2)) * 0.055;
        body.rotation.z = Math.sin(runPhase) * 0.04;

        leftArm.rotation.x = -legAngle * 0.7;
        leftArm.rotation.z = -0.15;
        rightArm.rotation.x = legAngle * 0.7;
        rightArm.rotation.z = 0.15;

        bagPivot.rotation.x = Math.sin(runPhase) * 0.2;
        bagPivot.rotation.z = -Math.cos(runPhase) * 0.08;

        // Rhythmic head nod bobbing to music
        head.rotation.x = Math.abs(Math.sin(runPhase * 2)) * 0.08;
        head.rotation.y = Math.sin(runPhase) * 0.06;
      } else {
        // Casual comfortable stroll
        const legAngle = Math.sin(runPhase) * 0.68 * Math.min(walkSpeed || 1.0, 1.2);
        leftLeg.rotation.x = legAngle;
        rightLeg.rotation.x = -legAngle;
        leftLeg.rotation.z = 0;
        rightLeg.rotation.z = 0;

        body.position.y = 0.9 + Math.abs(Math.sin(runPhase * 2)) * 0.06;

        leftArm.rotation.x = -legAngle * 0.75;
        leftArm.rotation.z = -0.12;
        rightArm.rotation.x = -0.22 + Math.sin(runPhase) * 0.14;
        rightArm.rotation.z = 0.16;

        bagPivot.rotation.x = Math.sin(runPhase) * 0.22;
        bagPivot.rotation.z = -Math.cos(runPhase) * 0.08;

        head.rotation.y = Math.sin(runPhase) * 0.06;
        head.rotation.x = 0;
      }
    } else if (actionState === 'shopping') {
      leftLeg.rotation.set(0.05, 0, 0);
      rightLeg.rotation.set(-0.05, 0, 0);

      if (archetype === 'kid') {
        // Kid reaches high and hops lightly looking up at treats
        body.position.y = 0.9 + Math.abs(Math.sin(runPhase * 3.2)) * 0.05;
        head.rotation.y = -0.4 + Math.sin(runPhase * 2) * 0.2;
        head.rotation.x = -0.3; // looks upward at shelf

        leftArm.rotation.x = -1.45 + Math.sin(runPhase * 3) * 0.15;
        leftArm.rotation.y = -0.3;
        leftArm.rotation.z = -0.2;

        rightArm.rotation.x = -0.2;
        rightArm.rotation.z = 0.25;
      } else if (archetype === 'elder') {
        // Elder leans close and squints through spectacles to read labels
        body.position.y = 0.9 + Math.sin(runPhase * 1.5) * 0.015;
        body.rotation.x = 0.16; // leans in

        head.rotation.y = -0.35 + Math.sin(runPhase * 1.2) * 0.14;
        head.rotation.x = 0.28 + Math.cos(runPhase * 1.2) * 0.08;

        leftArm.rotation.x = -0.9 + Math.sin(runPhase * 1.2) * 0.1;
        leftArm.rotation.y = -0.3;
        leftArm.rotation.z = -0.08;

        rightArm.rotation.x = -0.2;
        rightArm.rotation.z = 0.15;
      } else if (archetype === 'business') {
        // Business professional checks wrist watch then grabs item swiftly
        body.position.y = 0.9;
        body.rotation.x = -0.02;

        head.rotation.y = -0.42;
        head.rotation.x = 0.15;

        // Left arm raises to glance at watch
        leftArm.rotation.x = -1.25 + Math.sin(runPhase * 1.5) * 0.08;
        leftArm.rotation.z = -0.42;
        leftArm.rotation.y = 0.65;

        // Right arm inspects shelf
        rightArm.rotation.x = -0.8 + Math.sin(runPhase * 2) * 0.12;
        rightArm.rotation.z = 0.2;
      } else {
        // Casual / Student / Athlete browsing shelf
        body.position.y = 0.9 + Math.sin(runPhase * 2) * 0.025;
        head.rotation.y = -0.45 + Math.sin(runPhase * 1.5) * 0.22;
        head.rotation.x = 0.18 + Math.cos(runPhase * 1.5) * 0.1;

        leftArm.rotation.x = -1.15 + Math.sin(runPhase * 2) * 0.18;
        leftArm.rotation.y = -0.35;
        leftArm.rotation.z = -0.1;

        rightArm.rotation.x = -0.2;
        rightArm.rotation.z = 0.2;
      }
      bagPivot.rotation.set(0, 0, 0);
    } else if (actionState === 'queuing') {
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;

      if (archetype === 'kid') {
        // Restless kid shifting weight from foot to foot
        leftLeg.rotation.z = Math.sin(runPhase * 2.8) * 0.08;
        rightLeg.rotation.z = -Math.sin(runPhase * 2.8) * 0.08;
        body.position.y = 0.9 + Math.abs(Math.sin(runPhase * 3.5)) * 0.025;

        head.rotation.y = Math.sin(runPhase * 2.2) * 0.38;
        head.rotation.x = 0;

        leftArm.rotation.x = -0.15 + Math.sin(runPhase * 2) * 0.1;
        rightArm.rotation.x = -0.15 - Math.sin(runPhase * 2) * 0.1;
      } else if (archetype === 'elder') {
        // Calm peaceful queuing, slow gentle sway
        leftLeg.rotation.z = Math.sin(runPhase * 0.8) * 0.03;
        rightLeg.rotation.z = -Math.sin(runPhase * 0.8) * 0.03;
        body.position.y = 0.9 + Math.sin(runPhase * 1.6) * 0.012;
        body.rotation.x = 0.08;

        head.rotation.y = Math.sin(runPhase * 0.7) * 0.16;
        head.rotation.x = 0.05;

        leftArm.rotation.x = -0.12;
        rightArm.rotation.x = -0.18;
      } else if (archetype === 'business') {
        // Standing composed, periodically glancing down at watch
        body.position.y = 0.9;
        body.rotation.x = -0.02;

        const checkWatch = Math.sin(runPhase * 0.8) > 0.4;
        if (checkWatch) {
          leftArm.rotation.x = -1.2;
          leftArm.rotation.z = -0.4;
          leftArm.rotation.y = 0.6;
          head.rotation.y = -0.25;
          head.rotation.x = 0.35;
        } else {
          leftArm.rotation.set(0.05, 0, -0.12);
          head.rotation.set(0, 0, 0);
        }
        rightArm.rotation.set(-0.2, 0, 0.15);
      } else {
        // Relaxed queue standing
        leftLeg.rotation.z = Math.sin(runPhase * 1.2) * 0.04;
        rightLeg.rotation.z = -Math.sin(runPhase * 1.2) * 0.04;
        body.position.y = 0.9 + Math.sin(runPhase * 2.5) * 0.018;

        head.rotation.y = Math.sin(runPhase * 1.1) * 0.25;
        head.rotation.x = 0;

        leftArm.rotation.set(-0.15, 0, -0.1);
        rightArm.rotation.set(-0.25, 0, 0.18);
      }
      bagPivot.rotation.set(0, 0, 0);
    } else {
      // Idle
      leftLeg.rotation.set(0, 0, 0);
      rightLeg.rotation.set(0, 0, 0);
      body.position.y = 0.9;
      head.rotation.set(0, 0, 0);
      leftArm.rotation.set(0, 0, 0);
      rightArm.rotation.set(0, 0, 0);
      bagPivot.rotation.set(0, 0, 0);
    }

    // Apply carried stack spring wobble
    stackPivot.rotation.x = wobbleX;
    stackPivot.rotation.z = wobbleZ;
  };

  return {
    root,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    body,
    stackPivot,
    bagPivot,
    updateAnimation,
    archetype,
    baseSpeed,
    strideRate,
    browseDuration,
  };
}

/**
 * Creates Tomato Patch Garden (Planter box, soil, growing vines, ripe tomatoes)
 */
export function createTomatoFieldModel(): {
  root: THREE.Group;
  tomatoes: THREE.Mesh[];
  setGrowth: (growthFraction: number) => void;
} {
  const root = new THREE.Group();

  // Contact shadow
  root.add(createContactShadow(2.2));

  // Planter wood rim
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.75,
    metalness: 0.05,
  });
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 2.4), woodMat);
  box.position.y = 0.175;
  box.castShadow = true;
  root.add(box);

  // Dark moist soil bed
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3f2e23,
    roughness: 0.95,
  });
  const soil = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.36, 2.2), soilMat);
  soil.position.y = 0.18;
  soil.receiveShadow = true;
  root.add(soil);

  // 6 Tomato Vines with leafy clusters and tomatoes
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  const tomatoMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.25,
    metalness: 0.1,
  });

  const tomatoes: THREE.Mesh[] = [];
  const vineOffsets = [
    [-0.8, -0.6], [0, -0.6], [0.8, -0.6],
    [-0.8, 0.6],  [0, 0.6],  [0.8, 0.6],
  ];

  vineOffsets.forEach(([vx, vz]) => {
    // Foliage vine cluster
    const bushGeo = new THREE.SphereGeometry(0.3, 10, 8);
    const bush = new THREE.Mesh(bushGeo, stemMat);
    bush.position.set(vx, 0.45, vz);
    bush.scale.set(1.1, 0.8, 1.1);
    root.add(bush);

    // Bamboo garden stake
    const stake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6),
      new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.8 })
    );
    stake.position.set(vx - 0.1, 0.5, vz);
    root.add(stake);

    // Tomato fruit
    const tomato = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), tomatoMat);
    tomato.position.set(vx + 0.08, 0.42, vz + 0.15);
    tomato.castShadow = true;
    root.add(tomato);
    tomatoes.push(tomato);
  });

  const setGrowth = (growthFraction: number) => {
    const scale = Math.max(0.01, Math.min(1, growthFraction));
    tomatoes.forEach((t) => {
      t.scale.setScalar(scale);
      t.visible = scale > 0.15;
    });
  };

  return { root, tomatoes, setGrowth };
}

/**
 * Creates Apple Tree Orchard Stand (Trunk, lush canopy, hanging apples)
 */
export function createAppleTreeModel(): {
  root: THREE.Group;
  apples: THREE.Mesh[];
  setGrowth: (growthFraction: number) => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(2.4));

  // Stone garden border ring
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const stoneBorder = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.3, 16), stoneMat);
  stoneBorder.position.y = 0.15;
  stoneBorder.castShadow = true;
  root.add(stoneBorder);

  // Soil mound
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.32, 16),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 })
  );
  soil.position.y = 0.17;
  root.add(soil);

  // Stylized twisted wood trunk
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 1.8, 10), trunkMat);
  trunk.position.y = 1.0;
  trunk.castShadow = true;
  root.add(trunk);

  // Fluffy leaf foliage canopy (3 intersecting spheres)
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), leafMat);
  c1.position.set(0, 2.3, 0);
  c1.castShadow = true;
  root.add(c1);

  const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), leafMat);
  c2.position.set(0.65, 2.1, 0.3);
  root.add(c2);

  const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), leafMat);
  c3.position.set(-0.6, 2.1, -0.3);
  root.add(c3);

  // Hanging glossy red apples
  const appleMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.25,
    metalness: 0.1,
  });
  const apples: THREE.Mesh[] = [];
  const applePositions = [
    [-0.5, 1.6, 0.6],
    [0.6, 1.7, 0.5],
    [0.2, 1.5, -0.7],
    [-0.7, 1.6, -0.4],
    [0.8, 1.7, -0.3],
  ];

  applePositions.forEach(([ax, ay, az]) => {
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), appleMat);
    apple.position.set(ax, ay, az);
    apple.castShadow = true;
    root.add(apple);
    apples.push(apple);
  });

  const setGrowth = (growthFraction: number) => {
    const scale = Math.max(0.01, Math.min(1, growthFraction));
    apples.forEach((a) => {
      a.scale.setScalar(scale);
      a.visible = scale > 0.15;
    });
  };

  return { root, apples, setGrowth };
}

/**
 * Creates Farm Chicken Coop (Picket fence, hen house, animated clucking hen)
 */
export function createChickenCoopModel(): {
  root: THREE.Group;
  eggs: THREE.Mesh[];
  chicken: THREE.Group;
  setGrowth: (growthFraction: number) => void;
  updateHen: (time: number) => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(2.4));

  // Pen floor
  const strawMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
  const strawFloor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 2.4), strawMat);
  strawFloor.position.y = 0.05;
  root.add(strawFloor);

  // Wooden fence posts
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
  for (let i = -1.2; i <= 1.2; i += 0.6) {
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), fenceMat);
    post1.position.set(i, 0.35, -1.15);
    root.add(post1);

    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), fenceMat);
    post2.position.set(i, 0.35, 1.15);
    root.add(post2);
  }

  // Cute Red Hen House
  const houseMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
  const house = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.9), houseMat);
  house.position.set(-0.6, 0.55, -0.4);
  house.castShadow = true;
  root.add(house);

  // Roof
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.5 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.5, 4), roofMat);
  roof.position.set(-0.6, 1.25, -0.4);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  root.add(roof);

  // Chicken nesting box with straw
  const nestMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.9 });
  const nest = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.15, 12), nestMat);
  nest.position.set(0.5, 0.15, 0.2);
  root.add(nest);

  // Animated Cute Hen
  const chicken = new THREE.Group();
  chicken.position.set(0.5, 0.25, 0.2);
  root.add(chicken);

  const featherMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const cBody = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), featherMat);
  cBody.scale.set(1.1, 0.9, 1.3);
  chicken.add(cBody);

  const cHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), featherMat);
  cHead.position.set(0, 0.22, 0.2);
  chicken.add(cHead);

  // Yellow Beak
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 6), beakMat);
  beak.position.set(0, 0.2, 0.35);
  beak.rotation.x = Math.PI / 2;
  chicken.add(beak);

  // Red Comb
  const combMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.14), combMat);
  comb.position.set(0, 0.38, 0.2);
  chicken.add(comb);

  // Eggs
  const eggMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.3 });
  const eggs: THREE.Mesh[] = [];
  const eggOffsets = [
    [-0.1, 0.08, 0.0],
    [0.1, 0.08, -0.05],
    [0.0, 0.08, 0.12],
    [0.08, 0.08, 0.1],
  ];

  eggOffsets.forEach(([ex, ey, ez]) => {
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), eggMat);
    egg.scale.set(0.85, 1.25, 0.85);
    egg.position.set(0.5 + ex, 0.15 + ey, 0.2 + ez);
    egg.castShadow = true;
    root.add(egg);
    eggs.push(egg);
  });

  const setGrowth = (growthFraction: number) => {
    const count = Math.floor(growthFraction * eggs.length);
    eggs.forEach((egg, idx) => {
      egg.visible = idx <= count;
      egg.scale.setScalar(idx <= count ? 1 : 0.01);
    });
  };

  const updateHen = (time: number) => {
    chicken.rotation.y = Math.sin(time * 1.5) * 0.25;
    chicken.position.y = 0.25 + Math.abs(Math.sin(time * 3)) * 0.05;
  };

  return { root, eggs, chicken, setGrowth, updateHen };
}

/**
 * Creates Juice Machine Processor (Stainless station, spinning blender jar, juice bottles)
 */
export function createJuicerModel(): {
  root: THREE.Group;
  blenderJuice: THREE.Mesh;
  readyBottles: THREE.Mesh[];
  setProduction: (progressFraction: number, readyCount: number) => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(2.2));

  // Stainless counter desk
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.8,
    roughness: 0.25,
  });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 1.8), steelMat);
  desk.position.y = 0.425;
  desk.castShadow = true;
  root.add(desk);

  // Transparent acrylic blender tank
  const tankMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    transmission: 0.7,
    ior: 1.5,
  });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.8, 16), tankMat);
  tank.position.set(-0.4, 1.25, 0);
  root.add(tank);

  // Swirling juice fluid inside blender
  const juiceFluidMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.2,
    metalness: 0.1,
  });
  const blenderJuice = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 0.6, 16), juiceFluidMat);
  blenderJuice.position.set(-0.4, 1.2, 0);
  root.add(blenderJuice);

  // Funnel hopper on top
  const funnel = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 0.35, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.3 })
  );
  funnel.position.set(-0.4, 1.75, 0);
  funnel.rotation.x = Math.PI;
  root.add(funnel);

  // Output tray with bottled juices
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 1.4), trayMat);
  tray.position.set(0.6, 0.9, 0);
  root.add(tray);

  const readyBottles: THREE.Mesh[] = [];
  const bottleMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.2 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

  for (let i = 0; i < 4; i++) {
    const bGroup = new THREE.Group();
    const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.32, 10), bottleMat);
    bGroup.add(bMesh);

    const cMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10), capMat);
    cMesh.position.y = 0.18;
    bGroup.add(cMesh);

    const bOffset = -0.45 + i * 0.3;
    bGroup.position.set(0.6, 1.1, bOffset);
    root.add(bGroup as unknown as THREE.Mesh);
    readyBottles.push(bGroup as unknown as THREE.Mesh);
  }

  const setProduction = (progressFraction: number, readyCount: number) => {
    blenderJuice.scale.y = Math.max(0.1, Math.min(1.0, progressFraction));
    readyBottles.forEach((b, idx) => {
      b.visible = idx < readyCount;
    });
  };

  return { root, blenderJuice, readyBottles, setProduction };
}

/**
 * Creates 3D Supermarket Display Shelf (Tiered wooden/acrylic rack with stocked items)
 */
export function createDisplayShelfModel(itemType: ItemType): {
  root: THREE.Group;
  itemSlots: THREE.Group[];
  setStockCount: (count: number) => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(2.2));

  const def = ITEM_DEFS[itemType];

  // Wooden side frames
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 1.4), frameMat);
  leftWall.position.set(-1.05, 0.8, 0);
  leftWall.castShadow = true;
  root.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 1.4), frameMat);
  rightWall.position.set(1.05, 0.8, 0);
  rightWall.castShadow = true;
  root.add(rightWall);

  // White clean shelf decks (2 tiers)
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const deck1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.3), deckMat);
  deck1.position.set(0, 0.55, 0);
  deck1.castShadow = true;
  root.add(deck1);

  const deck2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.3), deckMat);
  deck2.position.set(0, 1.1, 0);
  deck2.castShadow = true;
  root.add(deck2);

  // Top Category Signboard
  const signMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.1), signMat);
  sign.position.set(0, 1.7, 0);
  root.add(sign);

  // 3D Item slots (8 display positions across 2 decks)
  const itemSlots: THREE.Group[] = [];
  const slotPositions: [number, number, number][] = [
    // Bottom deck
    [-0.6, 0.75, -0.28], [-0.2, 0.75, -0.28], [0.2, 0.75, -0.28], [0.6, 0.75, -0.28],
    [-0.6, 0.75, 0.28],  [-0.2, 0.75, 0.28],  [0.2, 0.75, 0.28],  [0.6, 0.75, 0.28],
    // Top deck
    [-0.6, 1.3, -0.28],  [-0.2, 1.3, -0.28],  [0.2, 1.3, -0.28],  [0.6, 1.3, -0.28],
    [-0.6, 1.3, 0.28],   [-0.2, 1.3, 0.28],   [0.2, 1.3, 0.28],   [0.6, 1.3, 0.28],
  ];

  slotPositions.forEach(([sx, sy, sz]) => {
    const slotGroup = new THREE.Group();
    slotGroup.position.set(sx, sy, sz);
    const itemModel = createItemMesh(itemType);
    itemModel.scale.setScalar(0.75);
    slotGroup.add(itemModel);
    root.add(slotGroup);
    itemSlots.push(slotGroup);
  });

  const setStockCount = (count: number) => {
    itemSlots.forEach((slot, index) => {
      slot.visible = index < count;
    });
  };

  return { root, itemSlots, setStockCount };
}

/**
 * Creates Checkout Counter (L-shape counter, barcode scanner, POS monitor, cash register)
 */
export function createCheckoutCounterModel(): {
  root: THREE.Group;
  cashPiles: THREE.Group;
  scannerLight: THREE.PointLight;
  triggerScanPulse: () => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(2.6));

  // Wooden Counter Desk
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 1.6), woodMat);
  desk.position.set(0, 0.425, 0);
  desk.castShadow = true;
  root.add(desk);

  // Black conveyor belt
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const belt = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), beltMat);
  belt.position.set(-0.3, 0.86, 0);
  root.add(belt);

  // POS Cash Register Monitor
  const posMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
  const posBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 10), posMat);
  posBase.position.set(0.7, 0.98, -0.3);
  root.add(posBase);

  const screenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // glowing green monitor
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.05), screenMat);
  screen.position.set(0.7, 1.2, -0.3);
  screen.rotation.y = -0.35;
  root.add(screen);

  // Barcode scanner
  const scannerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
  const scanner = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), scannerMat);
  scanner.position.set(0.65, 0.9, 0.2);
  root.add(scanner);

  const scannerLight = new THREE.PointLight(0xef4444, 0, 1.5);
  scannerLight.position.set(0.65, 1.05, 0.2);
  root.add(scannerLight);

  // Cash Piles Drop Zone
  const cashPiles = new THREE.Group();
  cashPiles.position.set(0.7, 0.88, 0.5);
  root.add(cashPiles);

  const triggerScanPulse = () => {
    scannerLight.intensity = 3.0;
  };

  return { root, cashPiles, scannerLight, triggerScanPulse };
}

/**
 * Creates Supermarket Building Shell & Perimeter with authentic architectural walls,
 * baseboard skirting, crown molding, windows, entrance awning, signage, and foliage
 */
export function createSupermarketBuilding(): THREE.Group {
  const building = new THREE.Group();

  // Wall Material with painted brick and wood wainscoting
  const wallTexture = createWallTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.6,
    metalness: 0.05,
  });

  // Baseboard kickplate trim material (dark oak wood)
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.7,
  });

  // Crown molding / parapet cap material (warm stone coping)
  const copingMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.5,
  });

  // Window frame & mullion material
  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
  });

  // Translucent window glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    transmission: 0.7,
  });

  // Helper to build a complete wall with baseboard and top coping
  const buildWallSection = (
    w: number,
    h: number,
    d: number,
    pos: THREE.Vector3,
    rotY = 0
  ) => {
    const wallGroup = new THREE.Group();
    wallGroup.position.copy(pos);
    wallGroup.rotation.y = rotY;

    // Main wall body
    const mainWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    mainWall.position.y = h / 2;
    mainWall.castShadow = true;
    mainWall.receiveShadow = true;
    wallGroup.add(mainWall);

    // Baseboard skirt at bottom
    const baseboard = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.35, d + 0.08), baseboardMat);
    baseboard.position.y = 0.175;
    baseboard.castShadow = true;
    wallGroup.add(baseboard);

    // Architectural crown molding / wall cap at top
    const coping = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.4, d + 0.18), copingMat);
    coping.position.y = h + 0.2;
    coping.castShadow = true;
    wallGroup.add(coping);

    building.add(wallGroup);
    return wallGroup;
  };

  // 1. Back Wall (z = -14)
  buildWallSection(32, 4.2, 0.5, new THREE.Vector3(0, 0, -14));

  // Add 2 large sunny store windows on Back Wall
  const addStoreWindow = (x: number, y: number, z: number, rotY = 0) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(x, y, z);
    winGroup.rotation.y = rotY;

    // Outer frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 0.6), windowFrameMat);
    winGroup.add(frame);

    // Glass pane
    const pane = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.0, 0.1), glassMat);
    winGroup.add(pane);

    // Window cross muntins (horizontal & vertical bars)
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 0.14), windowFrameMat);
    winGroup.add(hBar);

    const vBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.0, 0.14), windowFrameMat);
    vBar1.position.x = -1.2;
    winGroup.add(vBar1);

    const vBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.0, 0.14), windowFrameMat);
    vBar2.position.x = 1.2;
    winGroup.add(vBar2);

    building.add(winGroup);
  };

  addStoreWindow(-6, 2.3, -13.9);
  addStoreWindow(6, 2.3, -13.9);

  // 2. Left Wall (x = -16)
  buildWallSection(28, 4.2, 0.5, new THREE.Vector3(-16, 0, 0), Math.PI / 2);
  addStoreWindow(-15.9, 2.3, -5, Math.PI / 2);
  addStoreWindow(-15.9, 2.3, 5, Math.PI / 2);

  // 3. Right Wall (x = 16)
  buildWallSection(28, 4.2, 0.5, new THREE.Vector3(16, 0, 0), -Math.PI / 2);
  addStoreWindow(15.9, 2.3, -5, -Math.PI / 2);
  addStoreWindow(15.9, 2.3, 5, -Math.PI / 2);

  // 4. Front Wall with Grand Entrance
  buildWallSection(11.5, 4.2, 0.5, new THREE.Vector3(-10.25, 0, 14));
  buildWallSection(11.5, 4.2, 0.5, new THREE.Vector3(10.25, 0, 14));

  // Architectural entrance pillars (flanking sliding doors)
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.6, 0.9), pillarMat);
  pillarL.position.set(-4.2, 2.3, 14.1);
  pillarL.castShadow = true;
  building.add(pillarL);

  const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.6, 0.9), pillarMat);
  pillarR.position.set(4.2, 2.3, 14.1);
  pillarR.castShadow = true;
  building.add(pillarR);

  // Grand Entrance Striped Awning Canopy (Red & White Canvas)
  const awningGroup = new THREE.Group();
  awningGroup.position.set(0, 3.8, 14.8);

  const stripeCount = 10;
  const awningWidth = 8.8;
  const stripeWidth = awningWidth / stripeCount;

  for (let i = 0; i < stripeCount; i++) {
    const isRed = i % 2 === 0;
    const stripeMat = new THREE.MeshStandardMaterial({
      color: isRed ? 0xef4444 : 0xffffff,
      roughness: 0.8,
    });
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(stripeWidth, 0.1, 1.8), stripeMat);
    stripe.position.set(-awningWidth / 2 + stripeWidth * (i + 0.5), 0, 0);
    stripe.rotation.x = 0.35; // slope down
    stripe.castShadow = true;
    awningGroup.add(stripe);
  }
  building.add(awningGroup);

  // Dimensional 3D Store Sign: "MINI MART"
  const signBack = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 1.1, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.4 })
  );
  signBack.position.set(0, 4.6, 14.2);
  building.add(signBack);

  const signBorder = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 1.25, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 })
  );
  signBorder.position.set(0, 4.6, 14.15);
  building.add(signBorder);

  // Sliding Glass Doors with handles & caution border
  const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 });
  const door1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 0.1), glassMat);
  door1.position.set(-1.8, 1.6, 14);
  door1.castShadow = true;
  building.add(door1);

  const door1Frame = new THREE.Mesh(new THREE.BoxGeometry(3.7, 3.3, 0.08), doorFrameMat);
  door1Frame.position.set(-1.8, 1.6, 14);
  building.add(door1Frame);

  const door2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 0.1), glassMat);
  door2.position.set(1.8, 1.6, 14);
  door2.castShadow = true;
  building.add(door2);

  const door2Frame = new THREE.Mesh(new THREE.BoxGeometry(3.7, 3.3, 0.08), doorFrameMat);
  door2Frame.position.set(1.8, 1.6, 14);
  building.add(door2Frame);

  // Red Welcome Rug Mat
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.04, 2.4),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.9 })
  );
  mat.position.set(0, 0.02, 13);
  building.add(mat);

  // Interior Department Signs mounted on walls
  const createDeptSign = (text: string, color: number, x: number, y: number, z: number, rotY = 0) => {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, y, z);
    signGroup.rotation.y = rotY;

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.8, 0.12),
      new THREE.MeshStandardMaterial({ color, roughness: 0.3 })
    );
    signGroup.add(board);

    // Decorative white banner
    const inner = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.65, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    signGroup.add(inner);

    building.add(signGroup);
  };

  createDeptSign('FRESH PRODUCE 🍅', 0x16a34a, -8, 3.2, -13.6);
  createDeptSign('ORCHARD HARVEST 🍎', 0xdc2626, -15.6, 3.2, -2, Math.PI / 2);
  createDeptSign('FARM EGGS 🥚', 0xca8a04, -15.6, 3.2, 6, Math.PI / 2);
  createDeptSign('EXPRESS CHECKOUT 💵', 0x0284c7, 6, 3.2, -13.6);

  // Potted Entrance Ficus Plants (2 terracotta pots by the doors)
  const potMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 });
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

  [-5.2, 5.2].forEach((px) => {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.7, 12), potMat);
    pot.position.set(px, 0.35, 14.8);
    pot.castShadow = true;
    building.add(pot);

    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 8), plantMat);
    foliage.position.set(px, 1.05, 14.8);
    foliage.castShadow = true;
    building.add(foliage);
  });

  return building;
}

/**
 * Creates Ground Unlock Pad (Circle footprint with glowing ring and price label)
 */
export function createUnlockPadMesh(pad: UnlockPad): {
  root: THREE.Group;
  progressRing: THREE.Mesh;
  coinFloat: THREE.Group;
  updatePad: (time: number, paidFraction: number) => void;
} {
  const root = new THREE.Group();
  root.position.set(pad.x, 0.02, pad.z);

  // Base circular pad
  const padGeo = new THREE.CylinderGeometry(pad.radius, pad.radius, 0.06, 24);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.4,
    metalness: 0.1,
  });
  const baseMesh = new THREE.Mesh(padGeo, padMat);
  root.add(baseMesh);

  // Progress Fill Ring
  const ringGeo = new THREE.RingGeometry(pad.radius * 0.75, pad.radius * 0.95, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    side: THREE.DoubleSide,
  });
  const progressRing = new THREE.Mesh(ringGeo, ringMat);
  progressRing.position.y = 0.04;
  root.add(progressRing);

  // Floating 3D Dollar Bill / Coin above pad
  const coinFloat = new THREE.Group();
  coinFloat.position.y = 1.3;
  root.add(coinFloat);

  const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
  coinGeo.rotateZ(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.8,
    roughness: 0.2,
  });
  const coinMesh = new THREE.Mesh(coinGeo, coinMat);
  coinFloat.add(coinMesh);

  const updatePad = (time: number, paidFraction: number) => {
    coinFloat.position.y = 1.3 + Math.sin(time * 3 + pad.x) * 0.15;
    coinFloat.rotation.y = time * 2;
    progressRing.scale.setScalar(0.2 + paidFraction * 0.8);
  };

  return { root, progressRing, coinFloat, updatePad };
}

/**
 * Creates Artisan Bakery Stone Oven (Brick hearth, glowing fire, fresh baked baguettes)
 */
export function createBakeryOvenModel(): {
  root: THREE.Group;
  ovenGlow: THREE.Mesh;
  readyLoaves: THREE.Mesh[];
  setProduction: (progressFraction: number, readyCount: number) => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(2.4));

  // Terracotta / Brick Base
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.85,
  });
  const ovenBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 2.0), brickMat);
  ovenBase.position.y = 0.45;
  ovenBase.castShadow = true;
  root.add(ovenBase);

  // Stone Arch Dome
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.8,
  });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    domeMat
  );
  dome.position.set(0, 0.9, 0);
  dome.castShadow = true;
  root.add(dome);

  // Brick Chimney
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 1.2, 8), domeMat);
  chimney.position.set(0.65, 1.8, -0.4);
  root.add(chimney);

  // Arched Oven Opening (Dark interior with fiery glow)
  const archInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.35, 16, 1, false, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x1c1917 })
  );
  archInner.position.set(0, 0.9, 0.85);
  archInner.rotation.x = -Math.PI / 2;
  root.add(archInner);

  // Fiery glowing hearth
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  const ovenGlow = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.4), glowMat);
  ovenGlow.position.set(0, 0.88, 0.7);
  root.add(ovenGlow);

  // Baker's Cooling Rack with freshly baked golden bread loaves
  const rackMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.7 });
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 1.2), rackMat);
  rack.position.set(1.0, 0.95, 0.2);
  root.add(rack);

  const readyLoaves: THREE.Mesh[] = [];
  const breadMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });

  for (let i = 0; i < 4; i++) {
    const loaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.28, 6, 8), breadMat);
    loaf.rotation.x = Math.PI / 2;
    loaf.position.set(1.0, 1.08, -0.35 + i * 0.24);
    loaf.castShadow = true;
    root.add(loaf);
    readyLoaves.push(loaf);
  }

  const setProduction = (progressFraction: number, readyCount: number) => {
    ovenGlow.scale.set(1 + progressFraction * 0.3, 1, 1);
    (ovenGlow.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + progressFraction * 0.8;
    readyLoaves.forEach((l, idx) => {
      l.visible = idx < readyCount;
    });
  };

  return { root, ovenGlow, readyLoaves, setProduction };
}

/**
 * Creates Barista Espresso Cafe Bar (Polished marble counter, espresso machine, steaming cups)
 */
export function createCoffeeBarModel(): {
  root: THREE.Group;
  espressoMachine: THREE.Group;
  readyCups: THREE.Mesh[];
  setProduction: (progressFraction: number, readyCount: number) => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(2.3));

  // Elegant Cafe Counter (Dark Walnut with White Marble Top)
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 1.8), woodMat);
  base.position.y = 0.425;
  base.castShadow = true;
  root.add(base);

  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15 });
  const marbleTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 1.9), marbleMat);
  marbleTop.position.y = 0.89;
  marbleTop.castShadow = true;
  root.add(marbleTop);

  // Chrome Commercial Espresso Machine
  const espressoMachine = new THREE.Group();
  espressoMachine.position.set(-0.45, 0.93, 0);
  root.add(espressoMachine);

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.15,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.9), chromeMat);
  body.position.y = 0.35;
  body.castShadow = true;
  espressoMachine.add(body);

  // Dual Coffee bean grinders on top
  const beanMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b1e08,
    transparent: true,
    opacity: 0.6,
    roughness: 0.2,
  });
  const grinder1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.35, 10), beanMat);
  grinder1.position.set(-0.25, 0.85, -0.15);
  espressoMachine.add(grinder1);

  const grinder2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.35, 10), beanMat);
  grinder2.position.set(0.25, 0.85, -0.15);
  espressoMachine.add(grinder2);

  // Pressure gauge dials
  const dialMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 10), dialMat);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0, 0.5, 0.46);
  espressoMachine.add(dial);

  // Barista Service Tray with freshly brewed cafe cups
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 1.2), trayMat);
  tray.position.set(0.65, 0.95, 0);
  root.add(tray);

  const readyCups: THREE.Mesh[] = [];
  const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

  for (let i = 0; i < 4; i++) {
    const cupGroup = new THREE.Group();
    const cupMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.24, 10), cupMat);
    cupGroup.add(cupMesh);

    const sleeveMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.1, 10), sleeveMat);
    sleeveMesh.position.y = -0.01;
    cupGroup.add(sleeveMesh);

    cupGroup.position.set(0.65, 1.1, -0.38 + i * 0.25);
    cupGroup.castShadow = true;
    root.add(cupGroup as unknown as THREE.Mesh);
    readyCups.push(cupGroup as unknown as THREE.Mesh);
  }

  const setProduction = (progressFraction: number, readyCount: number) => {
    readyCups.forEach((c, idx) => {
      c.visible = idx < readyCount;
    });
  };

  return { root, espressoMachine, readyCups, setProduction };
}

/**
 * Creates Artisan Cheese Aging Cellar (Wood racks, curing cheese wheels)
 */
export function createCheeseCellarModel(): {
  root: THREE.Group;
  readyCheeses: THREE.Mesh[];
  setProduction: (progressFraction: number, readyCount: number) => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(2.3));

  // Rustic Pine Cellar Cabinet
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.4), woodMat);
  frame.position.y = 0.8;
  frame.castShadow = true;
  root.add(frame);

  // Hollow aging bay
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x291b10, roughness: 0.9 });
  const innerBay = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 1.1), darkMat);
  innerBay.position.set(0, 0.8, 0.2);
  root.add(innerBay);

  // 2 Pine Shelving Slats
  const slatMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
  const slat1 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 1.0), slatMat);
  slat1.position.set(0, 0.6, 0.2);
  root.add(slat1);

  const slat2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 1.0), slatMat);
  slat2.position.set(0, 1.1, 0.2);
  root.add(slat2);

  // Ready Cheese Wheels
  const readyCheeses: THREE.Mesh[] = [];
  const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });

  const cheeseSlots = [
    [-0.6, 0.72, 0.2],
    [0.6, 0.72, 0.2],
    [-0.6, 1.22, 0.2],
    [0.6, 1.22, 0.2],
  ];

  cheeseSlots.forEach(([cx, cy, cz]) => {
    const chGroup = new THREE.Group();
    const chWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 12), cheeseMat);
    chGroup.add(chWheel);

    const waxRind = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.03, 12), waxMat);
    waxRind.position.y = 0.06;
    chGroup.add(waxRind);

    chGroup.position.set(cx, cy, cz);
    chGroup.castShadow = true;
    root.add(chGroup as unknown as THREE.Mesh);
    readyCheeses.push(chGroup as unknown as THREE.Mesh);
  });

  const setProduction = (progressFraction: number, readyCount: number) => {
    readyCheeses.forEach((ch, idx) => {
      ch.visible = idx < readyCount;
    });
  };

  return { root, readyCheeses, setProduction };
}

/**
 * Creates Modern Self-Checkout Express Kiosk (Touchscreen pedestal with scanner)
 */
export function createSelfCheckoutModel(): {
  root: THREE.Group;
  screenPulse: THREE.Mesh;
  triggerScan: () => void;
  updateKiosk: (time: number) => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(1.5));

  // Sleek pedestal stand
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.95, 0.7), metalMat);
  stand.position.y = 0.475;
  stand.castShadow = true;
  root.add(stand);

  // Angled Touchscreen Display Terminal
  const screenCaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
  const screenCase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), screenCaseMat);
  screenCase.position.set(0, 1.25, 0);
  screenCase.rotation.x = -0.35;
  root.add(screenCase);

  // Glowing UI screen
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const screenPulse = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), screenMat);
  screenPulse.position.set(0, 1.25, 0.05);
  screenPulse.rotation.x = -0.35;
  root.add(screenPulse);

  // Red Barcode Scanner Glass
  const scannerGlassMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const scanner = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.18), scannerGlassMat);
  scanner.position.set(0, 0.96, 0.22);
  root.add(scanner);

  // Card Payment Tap Terminal
  const tapPad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.16), metalMat);
  tapPad.position.set(0.3, 0.96, -0.15);
  root.add(tapPad);

  let pulseTimer = 0;
  const triggerScan = () => {
    pulseTimer = 0.4;
  };

  const updateKiosk = (time: number) => {
    if (pulseTimer > 0) {
      pulseTimer -= 0.016;
      screenMat.color.setHex(0x22c55e); // green scan confirmation
    } else {
      const b = 0.5 + Math.sin(time * 3) * 0.15;
      screenMat.color.setRGB(0.01 * b, 0.52 * b, 0.78 * b);
    }
  };

  return { root, screenPulse, triggerScan, updateKiosk };
}

/**
 * Creates Grand Empire Diamond Trophy Monument (Tiered marble pedestal with revolving crown)
 */
export function createEmpireMonumentModel(): {
  root: THREE.Group;
  starCrest: THREE.Group;
  updateMonument: (time: number) => void;
} {
  const root = new THREE.Group();
  root.add(createContactShadow(2.8));

  // Tier 1 Marble Step
  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    metalness: 0.1,
  });
  const step1 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.25, 16), marbleMat);
  step1.position.y = 0.125;
  step1.castShadow = true;
  root.add(step1);

  // Tier 2 Marble Step
  const step2 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.35, 16), marbleMat);
  step2.position.y = 0.425;
  step2.castShadow = true;
  root.add(step2);

  // Gold Engraved Plinth
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.9,
    roughness: 0.15,
  });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), goldMat);
  plinth.position.y = 1.0;
  plinth.castShadow = true;
  root.add(plinth);

  // Floating Revolving Diamond Empire Star Crest
  const starCrest = new THREE.Group();
  starCrest.position.y = 2.1;
  root.add(starCrest);

  // Diamond Octahedron Crystal
  const diamondMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    metalness: 0.2,
    roughness: 0.05,
    transmission: 0.85,
    ior: 2.4,
  });
  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), diamondMat);
  diamond.castShadow = true;
  starCrest.add(diamond);

  // Golden Laurel Ring
  const laurel = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.07, 8, 24), goldMat);
  laurel.rotation.x = Math.PI / 4;
  starCrest.add(laurel);

  const updateMonument = (time: number) => {
    starCrest.rotation.y = time * 1.4;
    starCrest.position.y = 2.1 + Math.sin(time * 2.5) * 0.12;
  };

  return { root, starCrest, updateMonument };
}
