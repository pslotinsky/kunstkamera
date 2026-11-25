import { html, nothing, render, type TemplateResult } from 'lit-html';

import type { SaveSlot, SlotNumber } from '@/core/saves/GameSaves';
import type { SaveSummary } from '@/core/saves/SavedGame';
import { View } from '@/lib/View';
import { isDefined } from '@/lib/value/isDefined';
import { getFamilyCrestUrl } from '@/ui/common/art/getFamilyCrestUrl';
import { hideBrokenImage } from '@/ui/common/art/hideBrokenImage';

import { SaveSlotSelectedEvent } from './events/SaveSlotSelectedEvent';

import styles from './SaveSlots.module.scss';

export interface SaveSlotsContext {
  readonly canChoose: (slot: SaveSlot) => boolean;
}

type UnusableStatus = Exclude<SaveSlot['status'], 'ready'>;

export class SaveSlotsView extends View<SaveSlotsContext> {
  private static readonly LABELS: Record<UnusableStatus, string> = {
    empty: 'Empty',
    damaged: 'Unreadable save',
    unsupported: 'Unsupported version',
    unavailable: 'Storage unavailable',
  };

  protected readonly rootClass = styles.slots!;

  public get template(): TemplateResult {
    return html`<div class=${styles.slots}></div>`;
  }

  public show(slots: readonly SaveSlot[], selected?: SlotNumber): void {
    const buttons = slots.map((slot) => this.renderSlot(slot, selected));

    render(buttons, this.element);
  }

  public focus(preferred?: SlotNumber): boolean {
    const button =
      this.element.querySelector<HTMLButtonElement>(
        `[data-slot="${preferred}"]:enabled`,
      ) ?? this.element.querySelector<HTMLButtonElement>('[data-slot]:enabled');

    button?.focus();

    return isDefined(button);
  }

  private renderSlot(slot: SaveSlot, selected?: SlotNumber): TemplateResult {
    const { number, status } = slot;
    const label =
      status === 'ready'
        ? this.renderCampaign(slot.summary)
        : SaveSlotsView.LABELS[status];
    const pressed = isDefined(selected) ? number === selected : nothing;

    return html`<button class=${styles.slot} type="button" data-slot=${number}
      aria-pressed=${pressed} ?disabled=${!this.context.canChoose(slot)}
      @click=${() => this.publish(new SaveSlotSelectedEvent(slot))}>
      <span>Slot ${number}</span> ${label}
    </button>`;
  }

  private renderCampaign({ family, date }: SaveSummary): TemplateResult {
    return html`<span class=${styles.campaign}>
      <img class=${styles.crest} src=${getFamilyCrestUrl({ name: family })} alt=${family}
        @error=${hideBrokenImage} />
      <span class=${styles.date}>${date}</span>
    </span>`;
  }
}
