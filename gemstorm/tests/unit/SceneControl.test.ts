// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SceneControl } from '@/ui/screens/TitleScreen/Scene/SceneControl';

const FRAME_ID = 17;
const FRAME_MS = 16;

let scene: SceneControl | undefined;
let pendingFrame: FrameRequestCallback | undefined;
let clock = 0;
const requestFrame = vi.fn((callback: FrameRequestCallback) => {
  pendingFrame = callback;

  return FRAME_ID;
});
const cancelFrame = vi.fn(() => {
  pendingFrame = undefined;
});

function mount(reducedMotion = false): SceneControl {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => Object.assign(new EventTarget(), { matches: reducedMotion })),
  );
  const container = document.createElement('div');
  document.body.append(container);
  scene = new SceneControl();
  scene.mount(container);

  return scene;
}

function moveMouse(clientX: number, clientY: number): void {
  const event = new MouseEvent('pointermove', { clientX, clientY });

  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  document.dispatchEvent(event);
}

function leaveWindow(): void {
  document.documentElement.dispatchEvent(new Event('pointerleave'));
}

function runFrames(count: number): void {
  for (let frame = 0; frame < count; frame += 1) {
    const callback = pendingFrame;

    pendingFrame = undefined;
    clock += FRAME_MS;
    callback?.(clock);
  }
}

function layerOffsets(): readonly number[] {
  const layers = document.querySelectorAll<HTMLElement>('[data-depth]');

  return [...layers].map((layer) => {
    const match = /translate3d\((-?[\d.e-]+)px/.exec(layer.style.transform);

    return Number(match?.[1] ?? 0);
  });
}

beforeEach(() => {
  pendingFrame = undefined;
  clock = 0;
  requestFrame.mockClear();
  cancelFrame.mockClear();
  vi.stubGlobal('requestAnimationFrame', requestFrame);
  vi.stubGlobal('cancelAnimationFrame', cancelFrame);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 1000, 500),
  );
});

afterEach(() => {
  scene?.unmount();
  scene = undefined;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SceneControl', () => {
  it('shifts the layers away from the mouse, the nearer layer further', () => {
    mount();

    moveMouse(1000, 250);
    runFrames(200);

    const [landscape = 0, foliage = 0] = layerOffsets();

    expect(landscape).toBeLessThan(0);
    expect(foliage).toBeLessThan(landscape);
  });

  it('eases the layers back to centre when the mouse leaves the window', () => {
    mount();
    moveMouse(1000, 250);
    runFrames(200);

    leaveWindow();
    runFrames(200);

    for (const offset of layerOffsets()) {
      expect(Math.abs(offset)).toBeLessThan(0.1);
    }
  });

  it('cancels pending animation when unmounted', () => {
    const mounted = mount();
    expect(requestFrame).toHaveBeenCalledOnce();

    mounted.unmount();
    scene = undefined;
    document.dispatchEvent(new Event('visibilitychange'));

    expect(cancelFrame).toHaveBeenCalledWith(FRAME_ID);
    expect(requestFrame).toHaveBeenCalledOnce();
  });

  it('does not animate when reduced motion is preferred', () => {
    mount(true);
    moveMouse(1000, 250);

    expect(requestFrame).not.toHaveBeenCalled();
  });

  it('ignores the mouse while paused', () => {
    const mounted = mount();
    mounted.setPaused(true);
    requestFrame.mockClear();

    moveMouse(1000, 250);

    expect(requestFrame).not.toHaveBeenCalled();
  });
});
