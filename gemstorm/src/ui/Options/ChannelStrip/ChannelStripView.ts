import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';
import type { SoundChannel } from '@/ui/sound/SoundChannel';

import { MuteChangedEvent } from '../events/MuteChangedEvent';
import { VolumeChangedEvent } from './events/VolumeChangedEvent';
import { VolumeDragEndedEvent } from './events/VolumeDragEndedEvent';

import styles from './ChannelStrip.module.scss';

const FULL_PERCENT = 100;

export interface ChannelStripContext {
  readonly channel: SoundChannel;
  readonly name: string;
  readonly label: string;
}

export class ChannelStripView extends View<ChannelStripContext> {
  protected readonly rootClass = styles.root!;

  protected override get rootSelector(): string {
    return `[data-channel="${this.context.name}"]`;
  }

  public get template(): TemplateResult {
    const { channel, name, label } = this.context;
    const sliderId = `${name}-volume`;
    const percent = Math.round(channel.volume * FULL_PERCENT);

    return html`
      <div class=${styles.root} data-channel=${name}>
        <div class=${styles.heading}>
          <label class=${styles.toggle}>
            <input type="checkbox" class=${styles.checkbox} data-toggle
              ?checked=${channel.isEnabled}
              @change=${(event: Event) => this.changeMute(event)} />
            ${label}
          </label>
          <output class=${styles.volume} for=${sliderId} data-value>
            ${percent}%
          </output>
        </div>
        <input id=${sliderId} type="range" class=${styles.slider} data-slider
          aria-label="${label} volume" min="0" max=${FULL_PERCENT}
          value=${percent}
          @input=${(event: Event) => this.changeVolume(event)}
          @change=${() => this.publish(new VolumeDragEndedEvent())} />
      </div>
    `;
  }

  public showState(): void {
    const { channel } = this.context;

    this.toggle.checked = channel.isEnabled;
    this.toggle.disabled = !channel.isAdjustable;
    this.slider.disabled = !channel.isAudible;
  }

  private changeMute(event: Event): void {
    if (event.currentTarget instanceof HTMLInputElement) {
      const muted = !event.currentTarget.checked;

      this.publish(new MuteChangedEvent(muted));
    }
  }

  private changeVolume(event: Event): void {
    if (event.currentTarget instanceof HTMLInputElement) {
      const percent = event.currentTarget.valueAsNumber;

      this.value.value = `${percent}%`;
      this.publish(new VolumeChangedEvent(percent / FULL_PERCENT));
    }
  }

  private get toggle(): HTMLInputElement {
    return this.element.querySelector<HTMLInputElement>('[data-toggle]')!;
  }

  private get slider(): HTMLInputElement {
    return this.element.querySelector<HTMLInputElement>('[data-slider]')!;
  }

  private get value(): HTMLOutputElement {
    return this.element.querySelector<HTMLOutputElement>('[data-value]')!;
  }
}
