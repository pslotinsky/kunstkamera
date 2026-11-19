import { SearchReportedEvent } from '@/core/events/SearchReportedEvent';
import { Control } from '@/lib/Control';

import { SearchReportClosedEvent } from './SearchReportClosedEvent';
import { SearchReportDismissedEvent } from './SearchReportDismissedEvent';
import { type SearchReportContext, SearchReportView } from './SearchReportView';

export class SearchReportControl extends Control<SearchReportView> {
  public constructor(context: SearchReportContext) {
    super(SearchReportView, context);
  }

  protected override onMount(): void {
    this.context.events.subscribe(
      SearchReportedEvent,
      (event) => this.view.showReport(event),
      this.signal,
    );
    this.subscribe(SearchReportDismissedEvent, () => this.close());
  }

  private close(): void {
    this.view.hide();
    this.context.events.publish(new SearchReportClosedEvent());
  }
}
