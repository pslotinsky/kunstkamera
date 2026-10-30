import { describe, expect, it } from 'vitest';

import { EventBus } from '@/lib/EventBus';

class PingEvent {}

describe('EventBus', () => {
  it('delays subscribers and observers until the outer batch finishes', () => {
    const events = new EventBus();
    const first = new PingEvent();
    const second = new PingEvent();
    const reaction = new PingEvent();
    const observed: object[] = [];
    const received: PingEvent[] = [];

    events.observe((event) => observed.push(event));
    events.subscribe(PingEvent, (event) => {
      received.push(event);

      if (event === first) {
        events.batch(() => events.publish(reaction));
      }
    });

    events.batch(() => {
      events.publish(first);
      events.batch(() => events.publish(second));

      expect(observed).toEqual([]);
      expect(received).toEqual([]);
    });

    expect(observed).toEqual([first, second, reaction]);
    expect(received).toEqual([first, second, reaction]);
  });

  it('resumes delivery after a batch throws', () => {
    const events = new EventBus();
    const observed: object[] = [];
    const first = new PingEvent();
    const second = new PingEvent();

    events.observe((event) => observed.push(event));

    expect(() =>
      events.batch(() => {
        events.publish(first);
        throw new Error('Interrupted');
      }),
    ).toThrow('Interrupted');
    events.publish(second);

    expect(observed).toEqual([first, second]);
  });

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
