import { describe, expect, it } from 'vitest';

import { EventBus } from '@/lib/EventBus';

class PingEvent {}

describe('EventBus', () => {
  it('delivers a published event to its subscribers', () => {
    const events = new EventBus();
    let calls = 0;

    events.subscribe(PingEvent, () => {
      calls += 1;
    });
    events.publish(new PingEvent());

    expect(calls).toBe(1);
  });

  it('drops a subscription once its signal aborts', () => {
    const events = new EventBus();
    const lifetime = new AbortController();
    let calls = 0;

    events.subscribe(
      PingEvent,
      () => {
        calls += 1;
      },
      lifetime.signal,
    );

    events.publish(new PingEvent());
    expect(calls).toBe(1);

    lifetime.abort();
    events.publish(new PingEvent());
    expect(calls).toBe(1);
  });
});
