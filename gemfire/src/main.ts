import './style.scss';
import { createCommandGroups } from '@/core/commands/province/catalog';
import { WorldEngine } from '@/core/WorldEngine';
import { WorldFactory } from '@/core/WorldFactory';
import { EventBus } from '@/lib/EventBus';
import { GameScreenControl } from '@/ui/GameScreen/GameScreenControl';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app mount point missing from index.html');
}

const world = new WorldFactory().create();
const events = new EventBus();
const engine = new WorldEngine(world, events);
const commands = createCommandGroups({ world, events });

engine.start();

const screen = new GameScreenControl({ world, events, commands });
screen.mount(app);
