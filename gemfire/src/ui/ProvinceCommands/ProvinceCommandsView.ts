import diplomacyIconUrl from '@/assets/icons/diplomacy.webp';
import domesticIconUrl from '@/assets/icons/domestic.webp';
import militaryIconUrl from '@/assets/icons/military.webp';
import vassalIconUrl from '@/assets/icons/vassal.webp';
import type {
  CommandGroup,
  CommandGroupTitle,
} from '@/core/commands/province/catalog';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import { View } from '@/lib/View';

import { CommandSelectedEvent } from './CommandSelectedEvent';
import { TurnSkippedEvent } from './TurnSkippedEvent';
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

  public render(): string {
    const groupButtons = this.context.commands
      .map((group) => this.renderGroupButton(group))
      .join('');
    const commandSections = this.context.commands
      .map((group) => this.renderCommands(group))
      .join('');

    return `
      <section class="${styles.root} ${styles.hidden}">
        <div class="${styles.groups}">${groupButtons}</div>
        ${commandSections}
        ${this.views.cultivationDialog.render()}
        <button class="${styles.skipTurn}" type="button" data-action="skip-turn" disabled>Skip Turn</button>
      </section>
    `;
  }

  protected renderGroupButton(group: CommandGroup): string {
    return `
      <button class="${styles.groupButton}" type="button" data-group="${group.title}" aria-pressed="false">
        <img class="${styles.groupIcon}" src="${GROUP_ICONS[group.title]}" alt="" />
        <span>${group.title}</span>
      </button>
    `;
  }

  protected renderCommands(group: CommandGroup): string {
    const classes = `${styles.commands} ${styles.hidden}`;
    const commands = group.commands
      .map((command) => this.renderCommand(command))
      .join('');

    return `<div class="${classes}" data-group="${group.title}">${commands}</div>`;
  }

  protected renderCommand(command: WorldCommand): string {
    return `<button class="${styles.command}" type="button" data-command="${command.label}" disabled>${command.label}</button>`;
  }

  protected override onMount(): void {
    this.element.addEventListener('click', (event) => this.handleClick(event), {
      signal: this.lifetime.signal,
    });
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

  private handleClick(event: MouseEvent): void {
    if (event.target instanceof Element) {
      const button = event.target.closest<HTMLButtonElement>('button');

      if (button?.dataset.group) {
        this.toggleGroup(button);
      } else if (button?.dataset.command) {
        this.selectCommandAction(button.dataset.command);
      } else if (button?.dataset.action === 'skip-turn') {
        this.publish(new TurnSkippedEvent());
      }
    }
  }

  private selectCommandAction(label: string): void {
    const command = this.findCommand(label);

    if (command) {
      this.publish(new CommandSelectedEvent(command));
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
