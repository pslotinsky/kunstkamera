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
import { CampaignSoundDirector } from '@/ui/app/Campaign/CampaignSoundDirector';
import { SoundBoard } from '@/ui/common/sound/SoundBoard';

import {
  makeBattle,
  makeFamily,
  makeGeneral,
  makeInvasion,
  makeOutcome,
  makeProvince,
  makeWorld,
} from './factories';

const directors: CampaignSoundDirector[] = [];

function setup() {
  const mine = makeFamily({ name: 'Alderwyn' });
  const theirs = makeFamily({ name: 'Fitzroy' });
  const home = makeProvince({ number: 1, name: 'Lorraine', family: mine });
  const beyond = makeProvince({ number: 2, name: 'Anjou', family: theirs });
  const { world, events } = makeWorld([home, beyond], mine);
  const sounds = new SoundBoard();
  const director = new CampaignSoundDirector({ world, events, sounds });

  director.listen();
  directors.push(director);

  return { mine, theirs, home, beyond, events, sounds };
}

function makeSuccession(deposed = makeGeneral()): Coronation {
  return new Coronation({
    family: makeFamily({ name: 'Fitzroy' }),
    deposed,
    heirs: [makeGeneral({ name: 'Voric' })],
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
  vi.restoreAllMocks();
});

describe('CampaignSoundDirector', () => {
  it('plays the map music as soon as the campaign is directed', () => {
    const music = vi.spyOn(SoundBoard.prototype, 'playMusic');

    setup();

    expect(music).toHaveBeenLastCalledWith('map');
  });

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

  it('wails once instead of tolling for a ruler death', () => {
    const { events, sounds } = setup();
    const banshee = vi.spyOn(sounds, 'playBanshee');
    const bell = vi.spyOn(sounds, 'playBell');

    events.publish(reportSuccession('death'));

    expect(banshee).toHaveBeenCalledOnce();
    expect(bell).not.toHaveBeenCalled();
  });

  it('keeps silent over a succession born of a banishment', () => {
    const { events, sounds } = setup();
    const bell = vi.spyOn(sounds, 'playBell');

    const banshee = vi.spyOn(sounds, 'playBanshee');

    events.publish(reportSuccession('banishment'));

    expect(bell).not.toHaveBeenCalled();
    expect(banshee).not.toHaveBeenCalled();
  });

  it('glitters when an artifact is found', () => {
    const { events, sounds, home, beyond } = setup();
    const glitter = vi.spyOn(sounds, 'playGlitter');
    const sword = new Artifact({
      name: 'Cinderbrand',
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
});
