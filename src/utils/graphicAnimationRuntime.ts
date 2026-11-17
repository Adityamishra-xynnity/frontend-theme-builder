/**
 * Dedicated Graphic Animation Runtime
 *
 * Provides a high-performance, single shared requestAnimationFrame loop for all
 * animated vector graphics and elements on the canvas.
 *
 * Core Guarantees:
 * 1. Base Transform Preservation: Original left, top, scaleX, scaleY, angle, and opacity
 *    are never mutated by animation frames.
 * 2. Simultaneous Independent Playback: Multiple graphics play concurrently without interference.
 * 3. Lifecycle Safety: Automatically stops RAF loop when no active animations remain;
 *    safely handles disposed canvas objects and prevents memory leaks.
 * 4. Try/Finally Export Safety: `pauseAndResetAllForExport()` guarantees instant restoration
 *    of base transforms before rasterization/PDF generation.
 */

import type {
  GraphicAnimationConfig,
  GraphicAnimationEasing,
  GraphicAnimationType,
} from "../types/graphics";

export type {
  GraphicAnimationConfig,
  GraphicAnimationEasing,
  GraphicAnimationType,
};

export interface AnimatableObject {
  left?: number;
  top?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  opacity?: number;
  shadow?: unknown;
  setCoords?: () => void;
  canvas?: {
    requestRenderAll?: () => void;
    renderAll?: () => void;
  } | null;
  [key: string]: any;
}

export interface BaseTransform {
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  opacity: number;
  shadow?: unknown;
}

export interface RegisteredAnimation {
  id: string;
  object: AnimatableObject;
  config: GraphicAnimationConfig;
  base: BaseTransform;
  startTime: number;
  isPaused: boolean;
  pauseTime?: number;
}

export class GraphicAnimationRuntime {
  private registry = new Map<AnimatableObject, RegisteredAnimation>();
  private rafId: number | null = null;
  private isExportPaused = false;
  private isRunning = false;

  /**
   * Register an object for animation playback.
   * If already registered, updates the config and preserves or resets base transform.
   */
  public register(
    object: AnimatableObject,
    config: GraphicAnimationConfig,
    customId?: string
  ): void {
    if (!object || !config) return;

    // Snapshot exact base transform from object
    const base: BaseTransform = {
      left: typeof object.left === "number" ? object.left : 0,
      top: typeof object.top === "number" ? object.top : 0,
      scaleX: typeof object.scaleX === "number" ? object.scaleX : 1,
      scaleY: typeof object.scaleY === "number" ? object.scaleY : 1,
      angle: typeof object.angle === "number" ? object.angle : 0,
      opacity: typeof object.opacity === "number" ? object.opacity : 1,
      shadow: object.shadow,
    };

    const id = customId || `anim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();

    const existing = this.registry.get(object);
    if (existing) {
      existing.config = config;
      existing.base = base;
      existing.startTime = now;
      existing.isPaused = false;
    } else {
      this.registry.set(object, {
        id,
        object,
        config,
        base,
        startTime: now,
        isPaused: false,
      });
    }

    if (!this.isExportPaused) {
      this.startLoopIfNeeded();
    }
  }

  /**
   * Unregister an animated object, restoring its base transform immediately.
   */
  public unregister(object: AnimatableObject): void {
    const item = this.registry.get(object);
    if (!item) return;

    this.restoreObjectToBase(item.object, item.base);
    this.registry.delete(object);

    if (!this.hasActiveAnimations()) {
      this.stopLoop();
    }
  }

  /**
   * Update the base transform when a user finishes interacting (drag, resize, rotate).
   * Ensures future animation frames apply relative to the new user-defined position.
   */
  public updateBaseTransform(
    object: AnimatableObject,
    explicit?: Partial<BaseTransform>
  ): void {
    const item = this.registry.get(object);
    if (!item) return;

    if (explicit) {
      if (explicit.left !== undefined) item.base.left = explicit.left;
      if (explicit.top !== undefined) item.base.top = explicit.top;
      if (explicit.scaleX !== undefined) item.base.scaleX = explicit.scaleX;
      if (explicit.scaleY !== undefined) item.base.scaleY = explicit.scaleY;
      if (explicit.angle !== undefined) item.base.angle = explicit.angle;
      if (explicit.opacity !== undefined) item.base.opacity = explicit.opacity;
      if (explicit.shadow !== undefined) item.base.shadow = explicit.shadow;
    } else {
      if (typeof object.left === "number") item.base.left = object.left;
      if (typeof object.top === "number") item.base.top = object.top;
      if (typeof object.scaleX === "number") item.base.scaleX = object.scaleX;
      if (typeof object.scaleY === "number") item.base.scaleY = object.scaleY;
      if (typeof object.angle === "number") item.base.angle = object.angle;
      if (typeof object.opacity === "number") item.base.opacity = object.opacity;
      if (object.shadow !== undefined) item.base.shadow = object.shadow;
    }
  }

  /**
   * Get the recorded base transform for an object (useful during serialization/saving).
   */
  public getBaseTransform(object: AnimatableObject): BaseTransform | null {
    const item = this.registry.get(object);
    return item ? { ...item.base } : null;
  }

  /**
   * Pause an individual animated object and reset to base.
   */
  public pause(object: AnimatableObject): void {
    const item = this.registry.get(object);
    if (!item || item.isPaused) return;

    item.isPaused = true;
    item.pauseTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.restoreObjectToBase(item.object, item.base);

    if (!this.hasActiveAnimations()) {
      this.stopLoop();
    }
  }

  /**
   * Resume an individual paused animation.
   */
  public resume(object: AnimatableObject): void {
    const item = this.registry.get(object);
    if (!item || !item.isPaused) return;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (item.pauseTime) {
      // Offset start time by the pause duration
      item.startTime += now - item.pauseTime;
      item.pauseTime = undefined;
    } else {
      item.startTime = now;
    }
    item.isPaused = false;

    if (!this.isExportPaused) {
      this.startLoopIfNeeded();
    }
  }

  /**
   * Check if an object's animation is currently paused.
   */
  public isPaused(object: AnimatableObject): boolean {
    const item = this.registry.get(object);
    return item ? item.isPaused : true;
  }

  /**
   * Check if an object is registered.
   */
  public has(object: AnimatableObject): boolean {
    return this.registry.has(object);
  }

  /**
   * Check if an object is registered. Alias for `has`.
   */
  public isRegistered(object: AnimatableObject): boolean {
    return this.has(object);
  }

  /**
   * Pause and reset ALL animations for export (PNG/PDF).
   * Restores exact base transforms and returns a cleanup function for try/finally blocks.
   *
   * Usage:
   * const resume = runtime.pauseAndResetAllForExport();
   * try {
   *   await exportCanvas();
   * } finally {
   *   resume();
   * }
   */
  public pauseAndResetAllForExport(): () => void {
    this.isExportPaused = true;
    this.stopLoop();

    for (const item of this.registry.values()) {
      this.restoreObjectToBase(item.object, item.base);
    }
    this.renderAllCanvases();

    return () => {
      this.resumeAllAfterExport();
    };
  }

  /**
   * Resume all animations after an export completes or fails.
   */
  public resumeAllAfterExport(): void {
    if (!this.isExportPaused) return;
    this.isExportPaused = false;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    for (const item of this.registry.values()) {
      item.startTime = now;
      item.pauseTime = undefined;
    }

    this.startLoopIfNeeded();
    this.renderAllCanvases();
  }

  /**
   * Stop and remove all animations, resetting every object to base.
   */
  public stopAll(): void {
    this.stopLoop();
    for (const item of this.registry.values()) {
      this.restoreObjectToBase(item.object, item.base);
    }
    this.renderAllCanvases();
    this.registry.clear();
    this.isExportPaused = false;
  }

  /**
   * Destroy the runtime instance and cancel any pending RAF.
   */
  public destroy(): void {
    this.stopAll();
  }

  /**
   * Total number of currently registered items.
   */
  public getCount(): number {
    return this.registry.size;
  }

  /**
   * Check if there are active, unpaused animations.
   */
  public hasActiveAnimations(): boolean {
    if (this.isExportPaused || this.registry.size === 0) return false;
    for (const item of this.registry.values()) {
      if (!item.isPaused) return true;
    }
    return false;
  }

  // --------------------------------------------------
  // ANIMATION LOOP & RENDERING
  // --------------------------------------------------

  private startLoopIfNeeded(): void {
    if (this.isRunning || !this.hasActiveAnimations()) return;
    this.isRunning = true;

    if (typeof requestAnimationFrame !== "undefined") {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private stopLoop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      if (typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(this.rafId);
      }
      this.rafId = null;
    }
  }

  private tick = (currentTime: number): void => {
    if (!this.isRunning || this.isExportPaused) {
      this.stopLoop();
      return;
    }

    const activeCanvases = new Set<{ requestRenderAll?: () => void }>();
    const toRemove: AnimatableObject[] = [];

    for (const item of this.registry.values()) {
      if (item.isPaused) continue;

      const obj = item.object;
      // If object was disposed or removed from canvas, mark for cleanup
      if (obj.canvas === null && obj.canvas !== undefined) {
        toRemove.push(obj);
        continue;
      }

      this.applyAnimationFrame(item, currentTime);

      if (obj.canvas && typeof obj.canvas.requestRenderAll === "function") {
        activeCanvases.add(obj.canvas);
      }
    }

    // Clean up detached objects safely
    for (const obj of toRemove) {
      this.unregister(obj);
    }

    // Request render on each affected canvas once per frame
    for (const canvas of activeCanvases) {
      canvas.requestRenderAll?.();
    }

    if (this.hasActiveAnimations()) {
      if (typeof requestAnimationFrame !== "undefined") {
        this.rafId = requestAnimationFrame(this.tick);
      }
    } else {
      this.stopLoop();
    }
  };

  /**
   * Core frame transformation calculator.
   * Calculates transform deltas relative to item.base.
   */
  public applyAnimationFrame(item: RegisteredAnimation, now: number): void {
    const { object, config, base, startTime } = item;
    const duration = Math.max(200, config.durationMs || 1500);
    const delay = Math.max(0, config.delayMs || 0);
    const intensity = typeof config.intensity === "number" ? Math.max(0.1, config.intensity) : 1;

    // Detect if this object is currently being transformed by the user (dragged, scaled, rotated)
    const canvas = object.canvas as any;
    const currentTransform = canvas?._currentTransform;
    const isTransforming = Boolean(
      currentTransform &&
      (currentTransform.target === object ||
        (Array.isArray(currentTransform.target?._objects) &&
          currentTransform.target._objects.includes(object)) ||
        (currentTransform.target?.type === "activeselection" &&
          typeof currentTransform.target.getObjects === "function" &&
          currentTransform.target.getObjects().includes(object)))
    );

    if (isTransforming) {
      const action = String(currentTransform?.action || "");
      if (action === "drag" || action === "moving") {
        if (typeof object.left === "number") base.left = object.left;
        if (typeof object.top === "number") base.top = object.top;
        return;
      }
      if (action.indexOf("scale") !== -1 || action === "resizing") {
        if (typeof object.scaleX === "number") base.scaleX = object.scaleX;
        if (typeof object.scaleY === "number") base.scaleY = object.scaleY;
        if (typeof object.left === "number") base.left = object.left;
        if (typeof object.top === "number") base.top = object.top;
        return;
      }
      if (action === "rotate" || action === "rotating") {
        if (typeof object.angle === "number") base.angle = object.angle;
        if (typeof object.left === "number") base.left = object.left;
        if (typeof object.top === "number") base.top = object.top;
        return;
      }
      // Any other user transformation (skew, etc.)
      if (typeof object.left === "number") base.left = object.left;
      if (typeof object.top === "number") base.top = object.top;
      if (typeof object.scaleX === "number") base.scaleX = object.scaleX;
      if (typeof object.scaleY === "number") base.scaleY = object.scaleY;
      if (typeof object.angle === "number") base.angle = object.angle;
      return;
    }

    const elapsed = now - startTime;
    if (elapsed < delay) {
      return;
    }

    const activeElapsed = elapsed - delay;
    const isLoop = config.loop !== false;

    if (!isLoop && activeElapsed >= duration) {
      // Completed one-shot animation: restore exact base transform and pause
      this.restoreObjectToBase(object, base);
      item.isPaused = true;
      return;
    }

    const rawProgress = (activeElapsed % duration) / duration;
    const progress = this.applyEasing(rawProgress, config.easing);

    switch (config.type) {
      case "pulse":
        this.applyPulse(object, base, progress, intensity);
        break;
      case "bounce":
        this.applyBounce(object, base, progress, intensity);
        break;
      case "float":
        this.applyFloat(object, base, progress, intensity);
        break;
      case "spin":
        this.applySpin(object, base, progress, config.direction);
        break;
      case "glow":
        this.applyGlow(object, base, progress, intensity);
        break;
      case "shimmer":
        this.applyShimmer(object, base, progress, intensity);
        break;
      case "wiggle":
        this.applyWiggle(object, base, progress, intensity);
        break;
      default:
        this.applyPulse(object, base, progress, intensity);
        break;
    }

    object.setCoords?.();
  }

  // --------------------------------------------------
  // ANIMATION TYPE FORMULAS
  // --------------------------------------------------

  /**
   * Pulse: smooth sinusoidal scale modulation.
   */
  private applyPulse(
    obj: AnimatableObject,
    base: BaseTransform,
    progress: number,
    intensity: number
  ): void {
    const scaleFactor = 1 + Math.sin(progress * 2 * Math.PI) * (0.08 * intensity);
    obj.scaleX = base.scaleX * scaleFactor;
    obj.scaleY = base.scaleY * scaleFactor;
    obj.left = base.left;
    obj.top = base.top;
    obj.angle = base.angle;
    obj.opacity = base.opacity;
  }

  /**
   * Bounce: parabolic bounce above base position with slight vertical squashing.
   */
  private applyBounce(
    obj: AnimatableObject,
    base: BaseTransform,
    progress: number,
    intensity: number
  ): void {
    const bounceOffset = -Math.abs(Math.sin(progress * Math.PI)) * (16 * intensity);
    const squash = 1 + (bounceOffset / 16) * 0.05;

    obj.top = base.top + bounceOffset;
    obj.scaleY = base.scaleY * squash;
    obj.scaleX = base.scaleX * (2 - squash);
    obj.left = base.left;
    obj.angle = base.angle;
    obj.opacity = base.opacity;
  }

  /**
   * Float: smooth levitation with gentle vertical and horizontal drift.
   */
  private applyFloat(
    obj: AnimatableObject,
    base: BaseTransform,
    progress: number,
    intensity: number
  ): void {
    const dy = Math.sin(progress * 2 * Math.PI) * (10 * intensity);
    const dx = Math.cos(progress * 2 * Math.PI) * (3 * intensity);

    obj.top = base.top + dy;
    obj.left = base.left + dx;
    obj.scaleX = base.scaleX;
    obj.scaleY = base.scaleY;
    obj.angle = base.angle;
    obj.opacity = base.opacity;
  }

  /**
   * Spin: 360-degree rotation.
   */
  private applySpin(
    obj: AnimatableObject,
    base: BaseTransform,
    progress: number,
    direction?: string
  ): void {
    const sign = direction === "reverse" ? -1 : 1;
    const deltaAngle = sign * progress * 360;

    obj.angle = (base.angle + deltaAngle) % 360;
    obj.left = base.left;
    obj.top = base.top;
    obj.scaleX = base.scaleX;
    obj.scaleY = base.scaleY;
    obj.opacity = base.opacity;
  }

  /**
   * Glow: radiant luminance & opacity pulsing.
   */
  private applyGlow(
    obj: AnimatableObject,
    base: BaseTransform,
    progress: number,
    intensity: number
  ): void {
    const wave = (Math.sin(progress * 2 * Math.PI) + 1) / 2;
    const minOpacity = Math.max(0.3, base.opacity * (1 - 0.35 * intensity));
    const maxOpacity = base.opacity;

    obj.opacity = minOpacity + wave * (maxOpacity - minOpacity);
    obj.left = base.left;
    obj.top = base.top;
    obj.scaleX = base.scaleX;
    obj.scaleY = base.scaleY;
    obj.angle = base.angle;
  }

  /**
   * Shimmer: glistening wave with micro-scale shimmer.
   */
  private applyShimmer(
    obj: AnimatableObject,
    base: BaseTransform,
    progress: number,
    intensity: number
  ): void {
    const wave = (Math.sin(progress * 2 * Math.PI) + 1) / 2;
    const shimmerScale = 1 + (wave - 0.5) * (0.04 * intensity);

    obj.opacity = Math.max(0.25, base.opacity * (0.65 + 0.35 * wave));
    obj.scaleX = base.scaleX * shimmerScale;
    obj.scaleY = base.scaleY * shimmerScale;
    obj.left = base.left;
    obj.top = base.top;
    obj.angle = base.angle;
  }

  /**
   * Wiggle: playful rotational wobble.
   */
  private applyWiggle(
    obj: AnimatableObject,
    base: BaseTransform,
    progress: number,
    intensity: number
  ): void {
    const deltaAngle = Math.sin(progress * 2 * Math.PI) * (7 * intensity);

    obj.angle = base.angle + deltaAngle;
    obj.left = base.left;
    obj.top = base.top;
    obj.scaleX = base.scaleX;
    obj.scaleY = base.scaleY;
    obj.opacity = base.opacity;
  }

  // --------------------------------------------------
  // HELPER UTILITIES
  // --------------------------------------------------

  private applyEasing(t: number, easing?: GraphicAnimationEasing | string): number {
    switch (easing) {
      case "linear":
        return t;
      case "ease-in":
        return t * t;
      case "ease-out":
        return t * (2 - t);
      case "ease-in-out":
      default:
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
  }

  private restoreObjectToBase(obj: AnimatableObject, base: BaseTransform): void {
    obj.left = base.left;
    obj.top = base.top;
    obj.scaleX = base.scaleX;
    obj.scaleY = base.scaleY;
    obj.angle = base.angle;
    obj.opacity = base.opacity;
    if (base.shadow !== undefined) {
      obj.shadow = base.shadow;
    }
    obj.setCoords?.();
  }

  private renderAllCanvases(): void {
    const canvases = new Set<{ requestRenderAll?: () => void }>();
    for (const item of this.registry.values()) {
      if (item.object.canvas && typeof item.object.canvas.requestRenderAll === "function") {
        canvases.add(item.object.canvas);
      }
    }
    for (const canvas of canvases) {
      canvas.requestRenderAll?.();
    }
  }
}

// Global runtime singleton instance
export const graphicAnimationRuntime = new GraphicAnimationRuntime();
