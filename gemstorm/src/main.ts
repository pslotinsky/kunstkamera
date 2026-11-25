import './style.scss';

import { GameSaves } from '@/core/saves/GameSaves';
import { AppControl } from '@/ui/app/App/AppControl';
import { SoundDirector } from '@/ui/app/SoundDirector';
import { SoundBoard } from '@/ui/common/sound/SoundBoard';
import { SoundSettings } from '@/ui/common/sound/SoundSettings';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app mount point missing from index.html');
}

const sounds = new SoundBoard();

new SoundSettings(sounds).restore();

if (import.meta.env.DEV) {
  Object.assign(window, { sounds });
}
const saves = new GameSaves();
const shell = new AppControl({ sounds, saves });
const director = new SoundDirector({ sounds });

shell.mount(app);
director.listen();
