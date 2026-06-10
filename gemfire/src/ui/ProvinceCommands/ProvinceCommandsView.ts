import { View } from '@/lib/View';

import type { ProvinceCommandsContext } from './types';

import styles from './ProvinceCommands.module.scss';

interface CommandGroup {
  readonly title: string;
  readonly commands: readonly string[];
}

const COMMAND_GROUPS: readonly CommandGroup[] = [
  {
    title: 'Military',
    commands: ['Attack', 'Recruit', 'Move Troops', 'Hire Monster'],
  },
  {
    title: 'Domestic',
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
    commands: ['Ally', 'Negotiate'],
  },
  {
    title: 'Vassal',
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

  private renderMenu(): string {
    return COMMAND_GROUPS.map((group) => this.renderGroup(group)).join('');
  }

  private renderGroup(group: CommandGroup): string {
    const commands = group.commands
      .map(
        (command) =>
          `<button class="${styles.command}" type="button" disabled>${command}</button>`,
      )
      .join('');

    return `
      <div class="${styles.group}">
        <h3>${group.title}</h3>
        <div class="${styles.commands}">${commands}</div>
      </div>
    `;
  }
}
