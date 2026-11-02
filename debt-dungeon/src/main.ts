import { App } from './application/app';

import './style.module.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
const app = new App();

app.init(root);

window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  const error: unknown = event.reason;

  if (!(error instanceof DOMException) || error.name !== 'AbortError') {
    console.error(error);
  }
});
