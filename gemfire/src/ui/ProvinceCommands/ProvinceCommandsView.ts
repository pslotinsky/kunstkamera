import diplomacyIconUrl from '@/assets/icons/diplomacy.webp';
import domesticIconUrl from '@/assets/icons/domestic.webp';
import militaryIconUrl from '@/assets/icons/military.webp';
import vassalIconUrl from '@/assets/icons/vassal.webp';
import { View } from '@/lib/View';

import type { ProvinceCommandsContext } from './types';

import styles from './ProvinceCommands.module.scss';

interface CommandGroup {
  readonly title: string;
  readonly iconUrl: string;
  readonly commands: readonly string[];
}

const COMMAND_GROUPS: readonly CommandGroup[] = [
  {
    title: 'Military',
    iconUrl: militaryIconUrl,
    commands: ['Attack', 'Recruit', 'Move Troops', 'Hire Monster'],
  },
  {
    title: 'Domestic',
    iconUrl: domesticIconUrl,
    commands: [
      'Develop',
      'Cultivation',
      'Protection',
      'Trade',
      'Give Food',
      'Transport',
    ],
  },
  {
    title: 'Diplomacy',
    iconUrl: diplomacyIconUrl,
    commands: ['Ally', 'Negotiate'],
  },
  {
    title: 'Vassal',
    iconUrl: vassalIconUrl,
    commands: ['View', 'Change Lord', 'Entrust', 'Search'],
  },
];

export class ProvinceCommandsView extends View<ProvinceCommandsContext> {
  protected readonly rootClass = styles.root!;

  public render(): string {
    const province = this.context.selection;
    const menu = province?.isOwner(this.context.player)
      ? this.renderMenu()
      : '';

    return `<section class="${styles.root}">${menu}</section>`;
  }

  protected renderMenu(): string {
    const groupButtons = COMMAND_GROUPS.map((group) =>
      this.renderGroupButton(group),
    ).join('');
    const commandSections = COMMAND_GROUPS.map((group) =>
      this.renderCommands(group),
    ).join('');

    return `
      <div class="${styles.groups}">${groupButtons}</div>
      ${commandSections}
    `;
  }

  protected renderGroupButton(group: CommandGroup): string {
    return `
      <button class="${styles.groupButton}" type="button" data-group="${group.title}" aria-pressed="false">
        <img class="${styles.groupIcon}" src="${group.iconUrl}" alt="" />
        <span>${group.title}</span>
      </button>
    `;
  }

  protected renderCommands(group: CommandGroup): string {
    const classes = `${styles.commands} ${styles.hidden}`;
    const commands = group.commands
      .map(
        (command) =>
          `<button class="${styles.command}" type="button" disabled>${command}</button>`,
      )
      .join('');

    return `<div class="${classes}" data-group="${group.title}">${commands}</div>`;
  }

  protected override onMount(): void {
    this.element.addEventListener(
      'click',
      (event) => this.handleGroupClick(event),
      { signal: this.abortController.signal },
    );
  }

  private handleGroupClick(event: MouseEvent): void {
    if (event.target instanceof Element) {
      const groupButton =
        event.target.closest<HTMLButtonElement>('button[data-group]');

      if (groupButton) {
        this.toggleGroup(groupButton);
      }
    }
  }

  private toggleGroup(groupButton: HTMLButtonElement): void {
    const isOpen = groupButton.classList.contains(styles.open!);

    this.clearSelection();

    if (!isOpen) {
      this.select(groupButton);
    }
  }

  private clearSelection(): void {
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

  private select(groupButton: HTMLButtonElement): void {
    groupButton.classList.add(styles.open!);
    groupButton.setAttribute('aria-pressed', 'true');

    const section = this.element.querySelector<HTMLElement>(
      `div[data-group="${groupButton.dataset.group}"]`,
    );

    section?.classList.remove(styles.hidden!);
  }
}
