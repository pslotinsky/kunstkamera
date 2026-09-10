import './style.scss';
import { createCommandGroups } from '@/core/commands/province/catalog';
import { WorldEngine } from '@/core/WorldEngine';
import { WorldFactory } from '@/core/WorldFactory';
import { EventBus } from '@/lib/EventBus';
import { AppControl } from '@/ui/App/AppControl';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app mount point missing from index.html');
}

const world = new WorldFactory().create();
const events = new EventBus();
const engine = new WorldEngine(world, events);
const commands = createCommandGroups({ world, events });

if (import.meta.env.DEV) {
  events.observe((event) => {
    console.debug(`[event] ${event.constructor.name}`, event);
  });
}

engine.start();

const shell = new AppControl({ world, events, commands });
shell.mount(app);
