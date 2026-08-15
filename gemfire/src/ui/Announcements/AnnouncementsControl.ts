import { UnitDesertedEvent } from '@/core/events/UnitDesertedEvent';
import { Control } from '@/lib/Control';

import { AnnouncementDismissedEvent } from './AnnouncementDismissedEvent';
import {
  type AnnouncementsContext,
  AnnouncementsView,
} from './AnnouncementsView';

export class AnnouncementsControl extends Control<AnnouncementsView> {
  private readonly queue: UnitDesertedEvent[] = [];

  public constructor(context: AnnouncementsContext) {
    super(AnnouncementsView, context);
  }

  protected override onMount(): void {
    this.context.events.subscribe(
      UnitDesertedEvent,
      (event) => this.announceDesertion(event),
      this.signal,
    );
    this.subscribe(AnnouncementDismissedEvent, () => this.dismiss());
  }

  private announceDesertion(event: UnitDesertedEvent): void {
    if (event.province.belongsTo(this.context.world.player)) {
      this.queue.push(event);
      this.refresh();
    }
  }

  private dismiss(): void {
    this.queue.shift();
    this.refresh();
  }

  private refresh(): void {
    const [head, ...waiting] = this.queue;

    if (head) {
      this.view.showDesertion(head, waiting.length);
    } else {
      this.view.hide();
    }
  }
}
