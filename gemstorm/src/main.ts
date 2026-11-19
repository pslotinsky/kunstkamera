import './style.scss';

import { AppControl } from '@/ui/app/App/AppControl';
import { SoundDirector } from '@/ui/app/SoundDirector';
import { SoundBoard } from '@/ui/common/sound/SoundBoard';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app mount point missing from index.html');
}

const sounds = new SoundBoard();

if (import.meta.env.DEV) {
  Object.assign(window, { sounds });
}
const shell = new AppControl({ sounds });
const director = new SoundDirector({ sounds });

shell.mount(app);
director.listen();
