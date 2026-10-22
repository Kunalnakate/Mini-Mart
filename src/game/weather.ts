import * as THREE from 'three';
import { sound } from './audio';

export type WeatherType = 'clear' | 'sunny' | 'rain';

interface LightingPreset {
  keyColor: number;
  keyIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  bgColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  exposure: number;
}

const LIGHTING_PRESETS: Record<WeatherType, LightingPreset> = {
  clear: {
    keyColor: 0xfff7ed, // warm balanced daylight
    keyIntensity: 1.8,
    hemiSkyColor: 0xe0f2fe, // fresh sky blue
    hemiGroundColor: 0xfef3c7, // gentle grass/floor warmth
    hemiIntensity: 0.9,
    bgColor: 0xf0fdf4, // fresh market pastel green-white
    fogColor: 0xf0fdf4,
    fogNear: 25,
    fogFar: 48,
    exposure: 1.15,
  },
  sunny: {
    keyColor: 0xffedd5, // vibrant golden sunbeam
    keyIntensity: 2.25,
    hemiSkyColor: 0xbae6fd, // brilliant azure sky fill
    hemiGroundColor: 0xfef08a, // luminous warm sun-drenched bounce
    hemiIntensity: 1.15,
    bgColor: 0xfefce8, // warm golden sunny horizon tint
    fogColor: 0xfefce8,
    fogNear: 28,
    fogFar: 54,
    exposure: 1.26,
  },
  rain: {
    keyColor: 0x8da2b5, // overcast cool slate blue
    keyIntensity: 1.15,
    hemiSkyColor: 0x64748b, // stormy cloud fill
    hemiGroundColor: 0x334155, // dark damp ground bounce
    hemiIntensity: 0.65,
    bgColor: 0xcfd8dc, // soft cool rain cloud mist
    fogColor: 0xcfd8dc,
    fogNear: 18,
    fogFar: 40,
    exposure: 1.02,
  },
};

/**
 * Creates a soft glowing circular sprite texture for floating sun dust / pollen motes
 */
function createSunnyMoteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 240, 1.0)');
  grad.addColorStop(0.25, 'rgba(254, 240, 138, 0.9)');
  grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.45)');
  grad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Creates a vertical rain streak texture for high-speed falling raindrops
 */
function createRainDropTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  // Smooth tapered teardrop streak
  const grad = ctx.createLinearGradient(16, 0, 16, 96);
  grad.addColorStop(0, 'rgba(186, 230, 253, 0.0)');
  grad.addColorStop(0.4, 'rgba(224, 242, 254, 0.45)');
  grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(1, 'rgba(224, 242, 254, 1.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(16, 50, 4, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Creates a delicate ground splash ripple ring texture
 */
function createSplashTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(32, 32, 22, 0, Math.PI * 2);
  ctx.stroke();

  // Soft inner ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(32, 32, 14, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// Pre-allocated math and color helpers for zero GC during animation loop
const _tempColor1 = new THREE.Color();
const _tempColor2 = new THREE.Color();

/**
 * Selects a random outdoor point strictly outside the supermarket indoor bounds
 * (Indoor store footprint is x: [-15.8, 15.8], z: [-13.8, 13.8])
 */
function pickRandomOutdoorPoint(out: { x: number; z: number }) {
  const sector = Math.floor(Math.random() * 4);
  if (sector === 0) {
    // 1. Front outdoor plaza, entrance walkways & front garden (z: 14 to 28, x: -25 to 25)
    out.x = (Math.random() - 0.5) * 50;
    out.z = 14.2 + Math.random() * 14;
  } else if (sector === 1) {
    // 2. Left outdoor orchard & crop farm area (x: -28 to -15.8, z: -20 to 14)
    out.x = -15.8 - Math.random() * 12.2;
    out.z = (Math.random() - 0.5) * 34;
  } else if (sector === 2) {
    // 3. Right outdoor garden & chicken coop area (x: 15.8 to 28, z: -20 to 14)
    out.x = 15.8 + Math.random() * 12.2;
    out.z = (Math.random() - 0.5) * 34;
  } else {
    // 4. Rear hedge perimeter & back garden (z: -27 to -14.2, x: -26 to 26)
    out.x = (Math.random() - 0.5) * 52;
    out.z = -14.2 - Math.random() * 12.8;
  }
}

export class WeatherSystem {
  public currentWeather: WeatherType = 'clear';
  private targetWeather: WeatherType = 'clear';
  private weatherTimer: number = 0;
  private weatherDuration: number = 38; // Cycles weather naturally every 38 seconds
  private isTransitioning: boolean = false;
  private transitionAlpha: number = 1.0; // 0 to 1 transition progress

  // Weather weights for smooth cross-fading
  private clearWeight: number = 1.0;
  private sunnyWeight: number = 0.0;
  private rainWeight: number = 0.0;

  // Particle Meshes
  private sunnyPoints!: THREE.Points;
  private sunnyGeometry!: THREE.BufferGeometry;
  private sunnyMaterial!: THREE.PointsMaterial;
  private sunnyPositions!: Float32Array;
  private sunnyBasePos!: Float32Array;
  private sunnyPhases!: Float32Array;
  private sunnyCount: number = 220;

  private rainPoints!: THREE.Points;
  private rainGeometry!: THREE.BufferGeometry;
  private rainMaterial!: THREE.PointsMaterial;
  private rainPositions!: Float32Array;
  private rainSpeeds!: Float32Array;
  private rainCount: number = 650;

  private splashPoints!: THREE.Points;
  private splashGeometry!: THREE.BufferGeometry;
  private splashMaterial!: THREE.PointsMaterial;
  private splashPositions!: Float32Array;
  private splashLife!: Float32Array;
  private splashCount: number = 50;

  // Textures cache for disposal
  private textures: THREE.CanvasTexture[] = [];

  // Weather change callback
  public onWeatherChange?: (weather: WeatherType) => void;

  constructor(scene: THREE.Scene, isSoftwareGl: boolean = false) {
    // Reduce particle count on software GL fallback
    if (isSoftwareGl) {
      this.sunnyCount = 90;
      this.rainCount = 280;
      this.splashCount = 20;
    }

    this.initSunnyParticles(scene);
    this.initRainParticles(scene);
    this.initSplashParticles(scene);
  }

  private initSunnyParticles(scene: THREE.Scene) {
    this.sunnyPositions = new Float32Array(this.sunnyCount * 3);
    this.sunnyBasePos = new Float32Array(this.sunnyCount * 3);
    this.sunnyPhases = new Float32Array(this.sunnyCount);

    const tempPoint = { x: 0, z: 0 };
    for (let i = 0; i < this.sunnyCount; i++) {
      pickRandomOutdoorPoint(tempPoint);
      const y = 0.3 + Math.random() * 5.2;

      const idx = i * 3;
      this.sunnyPositions[idx] = tempPoint.x;
      this.sunnyPositions[idx + 1] = y;
      this.sunnyPositions[idx + 2] = tempPoint.z;

      this.sunnyBasePos[idx] = tempPoint.x;
      this.sunnyBasePos[idx + 1] = y;
      this.sunnyBasePos[idx + 2] = tempPoint.z;

      this.sunnyPhases[i] = Math.random() * Math.PI * 2;
    }

    this.sunnyGeometry = new THREE.BufferGeometry();
    this.sunnyGeometry.setAttribute('position', new THREE.BufferAttribute(this.sunnyPositions, 3));

    const moteTexture = createSunnyMoteTexture();
    this.textures.push(moteTexture);

    this.sunnyMaterial = new THREE.PointsMaterial({
      size: 0.85,
      map: moteTexture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.sunnyPoints = new THREE.Points(this.sunnyGeometry, this.sunnyMaterial);
    this.sunnyPoints.frustumCulled = false;
    scene.add(this.sunnyPoints);
  }

  private initRainParticles(scene: THREE.Scene) {
    this.rainPositions = new Float32Array(this.rainCount * 3);
    this.rainSpeeds = new Float32Array(this.rainCount);

    const tempPoint = { x: 0, z: 0 };
    for (let i = 0; i < this.rainCount; i++) {
      pickRandomOutdoorPoint(tempPoint);
      const y = 0.5 + Math.random() * 18.0;

      const idx = i * 3;
      this.rainPositions[idx] = tempPoint.x;
      this.rainPositions[idx + 1] = y;
      this.rainPositions[idx + 2] = tempPoint.z;

      // Vertical fall speed between 18.0 and 26.0
      this.rainSpeeds[i] = 18.0 + Math.random() * 8.0;
    }

    this.rainGeometry = new THREE.BufferGeometry();
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainTexture = createRainDropTexture();
    this.textures.push(rainTexture);

    this.rainMaterial = new THREE.PointsMaterial({
      size: 1.15,
      map: rainTexture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.rainPoints = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.rainPoints.frustumCulled = false;
    scene.add(this.rainPoints);
  }

  private initSplashParticles(scene: THREE.Scene) {
    this.splashPositions = new Float32Array(this.splashCount * 3);
    this.splashLife = new Float32Array(this.splashCount);

    const tempPoint = { x: 0, z: 0 };
    for (let i = 0; i < this.splashCount; i++) {
      pickRandomOutdoorPoint(tempPoint);
      const idx = i * 3;
      this.splashPositions[idx] = tempPoint.x;
      this.splashPositions[idx + 1] = 0.035;
      this.splashPositions[idx + 2] = tempPoint.z;
      this.splashLife[i] = Math.random();
    }

    this.splashGeometry = new THREE.BufferGeometry();
    this.splashGeometry.setAttribute('position', new THREE.BufferAttribute(this.splashPositions, 3));

    const splashTexture = createSplashTexture();
    this.textures.push(splashTexture);

    this.splashMaterial = new THREE.PointsMaterial({
      size: 0.7,
      map: splashTexture,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.splashPoints = new THREE.Points(this.splashGeometry, this.splashMaterial);
    this.splashPoints.frustumCulled = false;
    scene.add(this.splashPoints);
  }

  /**
   * Set target weather explicitly (can be called by UI toggle)
   */
  public setWeather(target: WeatherType) {
    if (this.targetWeather === target && !this.isTransitioning) return;
    this.targetWeather = target;
    this.isTransitioning = true;
    this.transitionAlpha = 0;
    this.weatherTimer = 0;
    if (this.onWeatherChange) {
      this.onWeatherChange(target);
    }
  }

  /**
   * Cycles to the next weather state: clear -> sunny -> rain -> clear
   */
  public cycleWeather(): WeatherType {
    let next: WeatherType = 'sunny';
    if (this.targetWeather === 'clear') next = 'sunny';
    else if (this.targetWeather === 'sunny') next = 'rain';
    else next = 'clear';

    this.setWeather(next);
    return next;
  }

  /**
   * Per-frame simulation update: updates weather particles, smooth lighting transitions,
   * fog, exposure, and environmental sound.
   */
  public update(
    dt: number,
    time: number,
    keyLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
  ) {
    // 1. Advance automatic weather cycle timer
    this.weatherTimer += dt;
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      this.cycleWeather();
    }

    // 2. Smooth weather state weights cross-fade (damps over ~2.8 seconds)
    const targetClear = this.targetWeather === 'clear' ? 1.0 : 0.0;
    const targetSunny = this.targetWeather === 'sunny' ? 1.0 : 0.0;
    const targetRain = this.targetWeather === 'rain' ? 1.0 : 0.0;

    const blendSpeed = 2.4;
    this.clearWeight = THREE.MathUtils.damp(this.clearWeight, targetClear, blendSpeed, dt);
    this.sunnyWeight = THREE.MathUtils.damp(this.sunnyWeight, targetSunny, blendSpeed, dt);
    this.rainWeight = THREE.MathUtils.damp(this.rainWeight, targetRain, blendSpeed, dt);

    // Normalize weights to sum to 1.0
    const sum = this.clearWeight + this.sunnyWeight + this.rainWeight;
    const normClear = sum > 0.001 ? this.clearWeight / sum : 1.0;
    const normSunny = sum > 0.001 ? this.sunnyWeight / sum : 0.0;
    const normRain = sum > 0.001 ? this.rainWeight / sum : 0.0;

    if (Math.abs(normClear - targetClear) < 0.01 &&
        Math.abs(normSunny - targetSunny) < 0.01 &&
        Math.abs(normRain - targetRain) < 0.01) {
      this.currentWeather = this.targetWeather;
      this.isTransitioning = false;
    }

    // 3. Interpolate Environment Lighting smoothly
    this.updateLighting(dt, normClear, normSunny, normRain, keyLight, hemiLight, scene, renderer);

    // 4. Update Sunny Floating Sparkle Dust Motes
    this.updateSunnyMotes(dt, time);

    // 5. Update Falling Rain Streaks & Splashes
    this.updateRain(dt);

    // 6. Update Rain Audio Loop
    sound.setRainVolume(this.rainWeight);
  }

  private updateLighting(
    dt: number,
    wClear: number,
    wSunny: number,
    wRain: number,
    keyLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
  ) {
    const cPreset = LIGHTING_PRESETS.clear;
    const sPreset = LIGHTING_PRESETS.sunny;
    const rPreset = LIGHTING_PRESETS.rain;

    // A. Key Directional Sun Light
    const targetKeyInt =
      cPreset.keyIntensity * wClear +
      sPreset.keyIntensity * wSunny +
      rPreset.keyIntensity * wRain;

    keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, targetKeyInt, 6, dt);

    // Key Light Color blend
    _tempColor1.setHex(cPreset.keyColor).multiplyScalar(wClear);
    _tempColor2.setHex(sPreset.keyColor).multiplyScalar(wSunny);
    _tempColor1.add(_tempColor2);
    _tempColor2.setHex(rPreset.keyColor).multiplyScalar(wRain);
    _tempColor1.add(_tempColor2);
    keyLight.color.lerp(_tempColor1, Math.min(1, dt * 5));

    // Slight sun angle altitude change (higher bright sun on sunny days)
    const targetKeyY = 22 + wSunny * 3.0 - wRain * 2.0;
    keyLight.position.y = THREE.MathUtils.damp(keyLight.position.y, targetKeyY, 4, dt);

    // B. Hemisphere Ambient Light
    const targetHemiInt =
      cPreset.hemiIntensity * wClear +
      sPreset.hemiIntensity * wSunny +
      rPreset.hemiIntensity * wRain;
    hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, targetHemiInt, 6, dt);

    // Sky Color
    _tempColor1.setHex(cPreset.hemiSkyColor).multiplyScalar(wClear);
    _tempColor2.setHex(sPreset.hemiSkyColor).multiplyScalar(wSunny);
    _tempColor1.add(_tempColor2);
    _tempColor2.setHex(rPreset.hemiSkyColor).multiplyScalar(wRain);
    _tempColor1.add(_tempColor2);
    hemiLight.color.lerp(_tempColor1, Math.min(1, dt * 5));

    // Ground Bounce Color
    _tempColor1.setHex(cPreset.hemiGroundColor).multiplyScalar(wClear);
    _tempColor2.setHex(sPreset.hemiGroundColor).multiplyScalar(wSunny);
    _tempColor1.add(_tempColor2);
    _tempColor2.setHex(rPreset.hemiGroundColor).multiplyScalar(wRain);
    _tempColor1.add(_tempColor2);
    hemiLight.groundColor.lerp(_tempColor1, Math.min(1, dt * 5));

    // C. Scene Background Color
    if (scene.background instanceof THREE.Color) {
      _tempColor1.setHex(cPreset.bgColor).multiplyScalar(wClear);
      _tempColor2.setHex(sPreset.bgColor).multiplyScalar(wSunny);
      _tempColor1.add(_tempColor2);
      _tempColor2.setHex(rPreset.bgColor).multiplyScalar(wRain);
      _tempColor1.add(_tempColor2);
      scene.background.lerp(_tempColor1, Math.min(1, dt * 5));
    }

    // D. Fog Color and Distances
    if (scene.fog instanceof THREE.Fog) {
      _tempColor1.setHex(cPreset.fogColor).multiplyScalar(wClear);
      _tempColor2.setHex(sPreset.fogColor).multiplyScalar(wSunny);
      _tempColor1.add(_tempColor2);
      _tempColor2.setHex(rPreset.fogColor).multiplyScalar(wRain);
      _tempColor1.add(_tempColor2);
      scene.fog.color.lerp(_tempColor1, Math.min(1, dt * 5));

      const targetFogNear =
        cPreset.fogNear * wClear +
        sPreset.fogNear * wSunny +
        rPreset.fogNear * wRain;
      const targetFogFar =
        cPreset.fogFar * wClear +
        sPreset.fogFar * wSunny +
        rPreset.fogFar * wRain;

      scene.fog.near = THREE.MathUtils.damp(scene.fog.near, targetFogNear, 6, dt);
      scene.fog.far = THREE.MathUtils.damp(scene.fog.far, targetFogFar, 6, dt);
    }

    // E. Tone Mapping Exposure
    const targetExposure =
      cPreset.exposure * wClear +
      sPreset.exposure * wSunny +
      rPreset.exposure * wRain;
    renderer.toneMappingExposure = THREE.MathUtils.damp(
      renderer.toneMappingExposure,
      targetExposure,
      5,
      dt
    );
  }

  private updateSunnyMotes(dt: number, time: number) {
    // Fade material opacity smoothly
    const targetOpacity = this.sunnyWeight * 0.85;
    this.sunnyMaterial.opacity = THREE.MathUtils.damp(this.sunnyMaterial.opacity, targetOpacity, 6, dt);
    this.sunnyPoints.visible = this.sunnyMaterial.opacity > 0.01;

    if (!this.sunnyPoints.visible) return;

    const pos = this.sunnyPositions;
    const base = this.sunnyBasePos;
    const phases = this.sunnyPhases;

    // Zero-allocation smooth undulating wave drift
    for (let i = 0; i < this.sunnyCount; i++) {
      const idx = i * 3;
      const ph = phases[i];

      // Gentle floating sine waves simulating warm thermal air currents
      pos[idx] = base[idx] + Math.sin(time * 0.9 + ph) * 0.45 + Math.cos(time * 0.4 + ph * 0.5) * 0.2;
      pos[idx + 1] = base[idx + 1] + Math.sin(time * 1.3 + ph) * 0.35;
      pos[idx + 2] = base[idx + 2] + Math.cos(time * 0.8 + ph) * 0.45;
    }

    this.sunnyGeometry.attributes.position.needsUpdate = true;
  }

  private updateRain(dt: number) {
    // Fade material opacity smoothly
    const targetOpacity = this.rainWeight * 0.72;
    this.rainMaterial.opacity = THREE.MathUtils.damp(this.rainMaterial.opacity, targetOpacity, 6, dt);
    this.rainPoints.visible = this.rainMaterial.opacity > 0.01;

    const splashTargetOpacity = this.rainWeight * 0.45;
    this.splashMaterial.opacity = THREE.MathUtils.damp(this.splashMaterial.opacity, splashTargetOpacity, 6, dt);
    this.splashPoints.visible = this.splashMaterial.opacity > 0.01;

    if (!this.rainPoints.visible && !this.splashPoints.visible) return;

    const pos = this.rainPositions;
    const speeds = this.rainSpeeds;
    const tempPoint = { x: 0, z: 0 };

    // Constant wind drift
    const windX = -1.2 * dt;
    const windZ = -0.5 * dt;

    let splashIdx = 0;

    for (let i = 0; i < this.rainCount; i++) {
      const idx = i * 3;
      pos[idx] += windX;
      pos[idx + 1] -= speeds[i] * dt;
      pos[idx + 2] += windZ;

      // Hit ground
      if (pos[idx + 1] <= 0.08) {
        // Trigger ground splash if within splash pool
        if (splashIdx < this.splashCount && Math.random() < 0.2) {
          const sIdx = splashIdx * 3;
          this.splashPositions[sIdx] = pos[idx];
          this.splashPositions[sIdx + 1] = 0.035;
          this.splashPositions[sIdx + 2] = pos[idx + 2];
          this.splashLife[splashIdx] = 1.0;
          splashIdx++;
        }

        // Reset raindrop to sky in a random outdoor area
        pickRandomOutdoorPoint(tempPoint);
        pos[idx] = tempPoint.x;
        pos[idx + 1] = 13.0 + Math.random() * 5.0;
        pos[idx + 2] = tempPoint.z;
      }
    }

    this.rainGeometry.attributes.position.needsUpdate = true;

    // Update splash rings
    if (this.splashPoints.visible) {
      for (let j = 0; j < this.splashCount; j++) {
        if (this.splashLife[j] > 0) {
          this.splashLife[j] -= dt * 3.5;
        }
      }
      this.splashGeometry.attributes.position.needsUpdate = true;
    }
  }

  public dispose(scene: THREE.Scene) {
    if (this.sunnyPoints) {
      scene.remove(this.sunnyPoints);
      this.sunnyGeometry.dispose();
      this.sunnyMaterial.dispose();
    }

    if (this.rainPoints) {
      scene.remove(this.rainPoints);
      this.rainGeometry.dispose();
      this.rainMaterial.dispose();
    }

    if (this.splashPoints) {
      scene.remove(this.splashPoints);
      this.splashGeometry.dispose();
      this.splashMaterial.dispose();
    }

    this.textures.forEach((tex) => tex.dispose());
    this.textures = [];
  }
}
