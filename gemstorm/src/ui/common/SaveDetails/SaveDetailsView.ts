import { html, nothing, render, type TemplateResult } from 'lit-html';

import type { SaveSlot } from '@/core/saves/GameSaves';
import type { SaveSummary } from '@/core/saves/SavedGame';
import { formatDateTime } from '@/lib/date/formatDateTime';
import { View } from '@/lib/View';
import { getGeneralPortraitUrl } from '@/ui/common/art/getGeneralPortraitUrl';
import { hideBrokenImage } from '@/ui/common/art/hideBrokenImage';

import styles from './SaveDetails.module.scss';

export class SaveDetailsView extends View {
  protected readonly rootClass = styles.detailsPanel!;

  public get template(): TemplateResult {
    return html`<div class=${styles.detailsPanel}></div>`;
  }

  public show(slot?: SaveSlot): void {
    const details =
      slot?.status === 'ready' ? this.renderPreview(slot.summary) : nothing;

    render(details, this.element);
  }

  private renderPreview(summary: SaveSummary): TemplateResult {
    const { family, ruler, scenario, date, province, savedAt } = summary;

    return html`<div class=${styles.preview}>
      <img class=${styles.portrait} src=${getGeneralPortraitUrl({ name: ruler })}
        alt="" @error=${hideBrokenImage} />
      <div class=${styles.previewText}>
        <p class=${styles.house}>${family}</p>
        <p class=${styles.scenario}>${scenario}</p>
        <p class=${styles.moment}>${date} · ${province}</p>
        <p class=${styles.savedAt}>Saved ${formatDateTime(savedAt)}</p>
      </div>
    </div>`;
  }
}
