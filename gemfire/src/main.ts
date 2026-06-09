import './style.css';
import { WorldFactory } from '@/core/WorldFactory';
import { GameScreenComponent } from '@/ui/game/GameScreenComponent';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app mount point missing from index.html');
}

const world = new WorldFactory().create();
const screen = new GameScreenComponent(world);
screen.mount(app);
