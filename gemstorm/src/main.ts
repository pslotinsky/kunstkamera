import './style.scss';
import { createCommandGroups } from '@/core/commands/province/catalog';
import { WorldEngine } from '@/core/WorldEngine';
import { WorldFactory } from '@/core/WorldFactory';
import { EventBus } from '@/lib/EventBus';
import { AppControl } from '@/ui/App/AppControl';
import { SoundBoard } from '@/ui/sound/SoundBoard';
import { SoundDirector } from '@/ui/sound/SoundDirector';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app mount point missing from index.html');
}

const world = new WorldFactory().create();
const events = new EventBus();
const engine = new WorldEngine(world, events);
const commands = createCommandGroups({ world, events });
const sounds = new SoundBoard();

if (import.meta.env.DEV) {
  events.observe((event) => {
    console.debug(`[event] ${event.constructor.name}`, event);
  });
  Object.assign(window, { sounds });
}
const shell = new AppControl({ world, events, commands, sounds });
const director = new SoundDirector({ world, events, sounds });

shell.mount(app);
director.listen();

engine.start();
