import './style.scss';
import { WorldFactory } from '@/core/WorldFactory';
import { GameScreenControl } from '@/ui/GameScreen/GameScreenControl';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app mount point missing from index.html');
}

const world = new WorldFactory().create();
const screen = new GameScreenControl({ world });
screen.mount(app);
