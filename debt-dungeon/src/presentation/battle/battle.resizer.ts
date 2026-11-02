import type { ControlDom } from '@/lib/control';

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export class BattleResizer {
  private readonly dom: ControlDom;
  private abortController: AbortController | null = null;

  constructor(dom: ControlDom) {
    this.dom = dom;
  }

  public start(): void {
    this.abortController = new AbortController();
    window.addEventListener('resize', () => this.fitFrame(), {
      signal: this.abortController.signal,
    });
    this.fitFrame();
  }

  public stop(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private fitFrame(): void {
    const scale = Math.min(
      window.innerWidth / DESIGN_WIDTH,
      window.innerHeight / DESIGN_HEIGHT,
    );

    this.dom.setStyleProperty('--battle-screen-scale', String(scale));
  }
}
