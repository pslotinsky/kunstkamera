const STEPS_COUNT = 10;
const ANIMATION_DURATION_MS = 500;

export function countTo(element: Element, from: number, to: number): void {
  const stepSize = (to - from) / STEPS_COUNT;
  const stepDuration = ANIMATION_DURATION_MS / STEPS_COUNT;
  let step = 0;

  const interval = setInterval(() => {
    step++;

    if (step < STEPS_COUNT) {
      const value = Math.round(from + stepSize * step);
      element.textContent = value.toString();
    } else {
      clearInterval(interval);
      element.textContent = to.toString();
    }
  }, stepDuration);
}
