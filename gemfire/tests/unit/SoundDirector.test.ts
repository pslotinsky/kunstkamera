// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Artifact } from '@/core/domain/Artifact';
import { Coronation } from '@/core/domain/Coronation';
import { AllianceOfferedEvent } from '@/core/events/AllianceOfferedEvent';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { DefenseRequestedEvent } from '@/core/events/DefenseRequestedEvent';
import { GeneralDiedEvent } from '@/core/events/GeneralDiedEvent';
import {
  type SuccessionCause,
  SuccessionReportedEvent,
} from '@/core/events/SuccessionReportedEvent';
import { SoundBoard } from '@/ui/sound/SoundBoard';
import { SoundDirector } from '@/ui/sound/SoundDirector';

import {
  makeBattle,
  makeFamily,
  makeGeneral,
  makeInvasion,
  makeOutcome,
  makeProvince,
  makeWorld,
} from './factories';

const directors: SoundDirector[] = [];

function setup() {
  const mine = makeFamily({ name: 'Blanche' });
  const theirs = makeFamily({ name: 'Fitzroy' });
  const home = makeProvince({ number: 1, name: 'Lorraine', family: mine });
  const beyond = makeProvince({ number: 2, name: 'Anjou', family: theirs });
  const { world, events } = makeWorld([home, beyond], mine);
  const sounds = new SoundBoard();
  const director = new SoundDirector({ world, events, sounds });

  director.listen();
  directors.push(director);

  return { mine, theirs, home, beyond, events, sounds };
}

function makeSuccession(deposed = makeGeneral()): Coronation {
  return new Coronation({
    family: makeFamily({ name: 'Fitzroy' }),
    deposed,
    heirs: [makeGeneral({ name: 'Elgis' })],
    provinces: [],
  });
}

function reportSuccession(cause: SuccessionCause): SuccessionReportedEvent {
  return new SuccessionReportedEvent(makeSuccession(), cause);
}

afterEach(() => {
  for (const director of directors.splice(0)) {
    director.stop();
  }

  document.body.innerHTML = '';
});

describe('SoundDirector', () => {
  it('sounds the horn and the battle music when a battle opens', () => {
    const { events, sounds } = setup();
    const horn = vi.spyOn(sounds, 'playHorn');
    const music = vi.spyOn(sounds, 'playMusic');

    events.publish(new BattleStartedEvent(makeInvasion(), makeBattle()));

    expect(horn).toHaveBeenCalledOnce();
    expect(music).toHaveBeenCalledWith('battle');
  });

  it('returns to the map music when the battle ends', () => {
    const { events, sounds } = setup();
    const music = vi.spyOn(sounds, 'playMusic');

    events.publish(new BattleEndedEvent(makeOutcome()));

    expect(music).toHaveBeenCalledWith('map');
  });

  it('heralds an alliance offer to the player', () => {
    const { events, sounds, beyond, theirs } = setup();
    const herald = vi.spyOn(sounds, 'playHerald');

    events.publish(new AllianceOfferedEvent(beyond, theirs));

    expect(herald).toHaveBeenCalledOnce();
  });

  it('tolls the bell for a death in the player family', () => {
    const { events, sounds, mine } = setup();
    const bell = vi.spyOn(sounds, 'playBell');

    events.publish(new GeneralDiedEvent(makeGeneral(), mine));

    expect(bell).toHaveBeenCalledOnce();
  });

  it('keeps silent when a stranger dies', () => {
    const { events, sounds, theirs } = setup();
    const bell = vi.spyOn(sounds, 'playBell');

    events.publish(new GeneralDiedEvent(makeGeneral(), theirs));

    expect(bell).not.toHaveBeenCalled();
  });

  it('tolls the bell for a succession born of a death', () => {
    const { events, sounds } = setup();
    const bell = vi.spyOn(sounds, 'playBell');

    events.publish(reportSuccession('death'));

    expect(bell).toHaveBeenCalledOnce();
  });

  it('keeps silent over a succession born of a banishment', () => {
    const { events, sounds } = setup();
    const bell = vi.spyOn(sounds, 'playBell');

    events.publish(reportSuccession('banishment'));

    expect(bell).not.toHaveBeenCalled();
  });

  it('glitters when an artifact is found', () => {
    const { events, sounds, home, beyond } = setup();
    const glitter = vi.spyOn(sounds, 'playGlitter');
    const sword = new Artifact({
      name: 'Sword of Fire',
      characteristic: 'war',
      bonus: 30,
    });

    events.publish(new ArtifactFoundEvent(home, beyond, sword));

    expect(glitter).toHaveBeenCalledOnce();
  });

  it('alarms when the player must answer an attack', () => {
    const { events, sounds } = setup();
    const alarm = vi.spyOn(sounds, 'playAlarm');

    events.publish(new DefenseRequestedEvent(makeInvasion()));

    expect(alarm).toHaveBeenCalledOnce();
  });

  it('clicks for every button pressed', () => {
    const { sounds } = setup();
    const click = vi.spyOn(sounds, 'playClick');
    const button = document.createElement('button');

    document.body.append(button);
    button.click();

    expect(click).toHaveBeenCalledOnce();
  });

  it('clicks for a province picked on the map', () => {
    const { sounds } = setup();
    const click = vi.spyOn(sounds, 'playClick');
    const province = document.createElement('div');

    province.className = 'province';
    document.body.append(province);
    province.click();

    expect(click).toHaveBeenCalledOnce();
  });

  it('keeps silent for clicks beside a button', () => {
    const { sounds } = setup();
    const click = vi.spyOn(sounds, 'playClick');
    const panel = document.createElement('div');

    document.body.append(panel);
    panel.click();

    expect(click).not.toHaveBeenCalled();
  });
});
