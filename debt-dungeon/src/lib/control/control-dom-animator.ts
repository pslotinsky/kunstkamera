import type { ControlDomBlock } from './control-dom-block';

export class ControlDomAnimator {
  private readonly block: ControlDomBlock;
  private readonly signal: AbortSignal;

  constructor(block: ControlDomBlock, signal: AbortSignal) {
    this.block = block;
    this.signal = signal;
  }

  public async animateClass(
    className: string,
    root: Element = this.block.root,
  ): Promise<void> {
    root.classList.add(className);

    try {
      await this.waitForAnimations(root.getAnimations());
    } finally {
      root.classList.remove(className);
    }
  }

  public async transition(change: () => void): Promise<void> {
    const root = this.block.root;

    root.getAnimations({ subtree: true });
    change();

    await this.waitForAnimations(root.getAnimations({ subtree: true }));
  }

  private async waitForAnimations(animations: Animation[]): Promise<void> {
    const cancel = () => {
      for (const animation of animations) {
        animation.cancel();
      }
    };

    this.signal.addEventListener('abort', cancel, { once: true });

    try {
      await Promise.all(animations.map((animation) => animation.finished));
      this.signal.throwIfAborted();
    } finally {
      this.signal.removeEventListener('abort', cancel);
      cancel();
    }
  }
}
