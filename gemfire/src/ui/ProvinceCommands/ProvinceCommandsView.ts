import { html, type TemplateResult } from 'lit-html';

import diplomacyIconUrl from '@/assets/icons/diplomacy.webp';
import domesticIconUrl from '@/assets/icons/domestic.webp';
import militaryIconUrl from '@/assets/icons/military.webp';
import vassalIconUrl from '@/assets/icons/vassal.webp';
import type {
  CommandGroup,
  CommandGroupTitle,
} from '@/core/commands/province/catalog';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { View } from '@/lib/View';

import { CommandDialogView } from './CommandDialog/CommandDialogView';
import { CommandSelectedEvent } from './CommandSelectedEvent';
import type { ProvinceCommandsContext, ProvinceCommandsViews } from './types';

import styles from './ProvinceCommands.module.scss';

const GROUP_ICONS: Record<CommandGroupTitle, string> = {
  Military: militaryIconUrl,
  Domestic: domesticIconUrl,
  Diplomacy: diplomacyIconUrl,
  Vassal: vassalIconUrl,
};

export class ProvinceCommandsView extends View<
  ProvinceCommandsContext,
  ProvinceCommandsViews
> {
  protected readonly rootClass = styles.root!;

  public show(): void {
    this.element.classList.remove(styles.hidden!);
    this.closeGroups();
    this.setActionsEnabled(true);
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  public selectCommand(label: string): void {
    const button = this.element.querySelector<HTMLButtonElement>(
      `button[data-command="${label}"]`,
    );

    button?.classList.add(styles.selected!);
  }

  public deselectCommand(label: string): void {
    const button = this.element.querySelector<HTMLButtonElement>(
      `button[data-command="${label}"]`,
    );

    button?.classList.remove(styles.selected!);
  }

  public closeGroups(): void {
    const groupButtons =
      this.element.querySelectorAll<HTMLButtonElement>('button[data-group]');

    for (const button of groupButtons) {
      button.classList.remove(styles.open!);
      button.setAttribute('aria-pressed', 'false');
    }

    const commandSections =
      this.element.querySelectorAll<HTMLElement>('div[data-group]');

    for (const section of commandSections) {
      section.classList.add(styles.hidden!);
    }
  }

  public disableActions(): void {
    this.setActionsEnabled(false);
  }

  public get template(): TemplateResult {
    return html`
      <section class="${styles.root} ${styles.hidden}">
        <div class=${styles.groups}>
          ${this.context.commands.map((group) => this.renderGroupButton(group))}
        </div>
        ${this.context.commands.map((group) => this.renderCommands(group))}
        ${this.renderDialogs()}
        <button
          class=${styles.skipTurn}
          type="button"
          data-action="skip-turn"
          disabled
          @click=${() => this.skipTurn()}
        >
          Skip Turn
        </button>
      </section>
    `;
  }

  protected renderDialogs(): TemplateResult[] {
    return Object.values(this.views)
      .filter((view) => view instanceof CommandDialogView)
      .map((view) => view.template);
  }

  protected renderGroupButton(group: CommandGroup): TemplateResult {
    return html`
      <button
        class=${styles.groupButton}
        type="button"
        data-group=${group.title}
        aria-pressed="false"
        @click=${(event: Event) =>
          this.toggleGroup(event.currentTarget as HTMLButtonElement)}
      >
        <img class=${styles.groupIcon} src=${GROUP_ICONS[group.title]} alt="" />
        <span>${group.title}</span>
      </button>
    `;
  }

  protected renderCommands(group: CommandGroup): TemplateResult {
    return html`
      <div class="${styles.commands} ${styles.hidden}" data-group=${group.title}>
        ${group.commands.map((command) => this.renderCommand(command))}
      </div>
    `;
  }

  protected renderCommand(command: WorldCommand): TemplateResult {
    return html`
      <button
        class=${styles.command}
        type="button"
        data-command=${command.label}
        disabled
        @click=${() => this.publish(new CommandSelectedEvent(command))}
      >
        ${command.label}
      </button>
    `;
  }

  private skipTurn(): void {
    const { world, events } = this.context;

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
  }

  private setActionsEnabled(enabled: boolean): void {
    const commandButtons = this.element.querySelectorAll<HTMLButtonElement>(
      'button[data-command]',
    );

    for (const button of commandButtons) {
      const command = this.findCommand(button.dataset.command ?? '');

      button.disabled = !enabled || !command?.canExecute();
    }

    const skipButton = this.element.querySelector<HTMLButtonElement>(
      'button[data-action="skip-turn"]',
    );

    if (skipButton) {
      skipButton.disabled = !enabled;
    }
  }

  private findCommand(label: string): WorldCommand | undefined {
    return this.context.commands
      .flatMap((group) => group.commands)
      .find((candidate) => candidate.label === label);
  }

  private toggleGroup(groupButton: HTMLButtonElement): void {
    const isOpen = groupButton.classList.contains(styles.open!);

    this.closeGroups();

    if (!isOpen) {
      this.openGroup(groupButton);
    }
  }

  private openGroup(groupButton: HTMLButtonElement): void {
    groupButton.classList.add(styles.open!);
    groupButton.setAttribute('aria-pressed', 'true');

    const section = this.element.querySelector<HTMLElement>(
      `div[data-group="${groupButton.dataset.group}"]`,
    );

    section?.classList.remove(styles.hidden!);
  }
}
