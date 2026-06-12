import diplomacyIconUrl from '@/assets/icons/diplomacy.webp';
import domesticIconUrl from '@/assets/icons/domestic.webp';
import militaryIconUrl from '@/assets/icons/military.webp';
import vassalIconUrl from '@/assets/icons/vassal.webp';
import type {
  CommandGroup,
  CommandGroupTitle,
} from '@/core/commands/province/catalog';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { Province } from '@/core/domain/Province';
import { View } from '@/lib/View';

import { CommandSelectedEvent } from './CommandSelectedEvent';
import { TurnSkippedEvent } from './TurnSkippedEvent';
import type { ProvinceCommandsContext } from './types';

import styles from './ProvinceCommands.module.scss';

const GROUP_ICONS: Record<CommandGroupTitle, string> = {
  Military: militaryIconUrl,
  Domestic: domesticIconUrl,
  Diplomacy: diplomacyIconUrl,
  Vassal: vassalIconUrl,
};

export class ProvinceCommandsView extends View<ProvinceCommandsContext> {
  protected readonly rootClass = styles.root!;

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
        <button class="${styles.skipTurn}" type="button" data-action="skip-turn" disabled>Skip Turn</button>
      </section>
    `;
  }

  public showProvince(province: Province): void {
    const { world } = this.context;

    if (province.isOwner(world.player)) {
      this.element.classList.remove(styles.hidden!);
      this.closeGroups();
      this.setActionsEnabled(world.turnQueue.current === province);
    } else {
      this.hide();
    }
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
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
    const actionButtons = this.element.querySelectorAll<HTMLButtonElement>(
      'button[data-command], button[data-action]',
    );

    for (const button of actionButtons) {
      button.disabled = !enabled;
    }
  }

  private handleClick(event: MouseEvent): void {
    if (event.target instanceof Element) {
      const button = event.target.closest<HTMLButtonElement>('button');

      if (button?.dataset.group) {
        this.toggleGroup(button);
      } else if (button?.dataset.command) {
        this.selectCommand(button.dataset.command);
      } else if (button?.dataset.action === 'skip-turn') {
        this.publish(new TurnSkippedEvent());
      }
    }
  }

  private selectCommand(label: string): void {
    const command = this.context.commands
      .flatMap((group) => group.commands)
      .find((candidate) => candidate.label === label);

    if (command) {
      this.publish(new CommandSelectedEvent(command));
    }
  }

  private toggleGroup(groupButton: HTMLButtonElement): void {
    const isOpen = groupButton.classList.contains(styles.open!);

    this.closeGroups();

    if (!isOpen) {
      this.openGroup(groupButton);
    }
  }

  private closeGroups(): void {
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

  private openGroup(groupButton: HTMLButtonElement): void {
    groupButton.classList.add(styles.open!);
    groupButton.setAttribute('aria-pressed', 'true');

    const section = this.element.querySelector<HTMLElement>(
      `div[data-group="${groupButton.dataset.group}"]`,
    );

    section?.classList.remove(styles.hidden!);
  }
}
