import type { EventClass } from './EventBus';
import type { AnyView, View } from './View';

export type AnyControl = Control<AnyView, any>;
export type ControlRecord = Record<string, AnyControl>;

export type ContextOf<TView extends AnyView> =
  TView extends View<infer Context, any> ? Context : never;

export type ViewsOf<TView extends AnyView> =
  TView extends View<any, infer Views> ? Views : never;

export type ChildrenViews<Controls extends ControlRecord> = {
  [Key in keyof Controls]: Controls[Key]['view'];
};

type ViewConstructor<TView extends AnyView> = new (
  context: Readonly<ContextOf<TView>>,
  views: ViewsOf<TView>,
) => TView;

export abstract class Control<
  TView extends AnyView,
  Controls extends ControlRecord = Record<string, never>,
> {
  public readonly view: TView;

  protected readonly context: ContextOf<TView>;
  protected readonly controls: Controls;

  public constructor(
    ViewClass: ViewConstructor<TView>,
    context: ContextOf<TView>,
    controls: Controls = {} as Controls,
  ) {
    this.context = context;
    this.controls = controls;
    this.view = new ViewClass(context, this.collectViews());
  }

  public mount(container: HTMLElement): void {
    this.view.mount(container);
    this.connect();
  }

  public unmount(): void {
    this.disconnect();
    this.view.unmount();
  }

  public subscribe<EventType extends object>(
    eventClass: EventClass<EventType>,
    handler: (event: EventType) => void,
  ): void {
    this.view.subscribe(eventClass, handler);
  }

  protected onMount(): void {}

  protected onUnmount(): void {}

  private connect(): void {
    for (const control of Object.values(this.controls)) {
      control.connect();
    }

    this.onMount();
  }

  private disconnect(): void {
    this.onUnmount();

    for (const control of Object.values(this.controls)) {
      control.disconnect();
    }
  }

  private collectViews(): ViewsOf<TView> {
    const controlEntries = Object.entries(this.controls) as [
      string,
      AnyControl,
    ][];

    const viewEntries = controlEntries.map(
      ([key, control]) => [key, control.view] as const,
    );

    return Object.fromEntries(viewEntries) as ViewsOf<TView>;
  }
}
