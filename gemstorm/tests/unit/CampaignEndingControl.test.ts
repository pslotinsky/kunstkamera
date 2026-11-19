// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommandExecutor } from '@/core/CommandExecutor';
import { NegotiateCommand } from '@/core/commands/province/NegotiateCommand';
import { CampaignOutcome } from '@/core/domain/CampaignOutcome';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { CampaignEndedEvent } from '@/core/events/CampaignEndedEvent';
import { TurnHeldEvent } from '@/core/events/TurnHeldEvent';
import { TurnReleasedEvent } from '@/core/events/TurnReleasedEvent';
import { WarReportedEvent } from '@/core/events/WarReportedEvent';
import { WorldFactory } from '@/core/WorldFactory';
import { AnnouncementsControl } from '@/ui/Announcements/AnnouncementsControl';
import { BattleReportClosedEvent } from '@/ui/BattleReport/BattleReportClosedEvent';
import { BattleReportControl } from '@/ui/BattleReport/BattleReportControl';
import styles from '@/ui/CampaignEnding/CampaignEnding.module.scss';
import { CampaignEndingControl } from '@/ui/CampaignEnding/CampaignEndingControl';
import { CaptiveDialogControl } from '@/ui/CaptiveDialog/CaptiveDialogControl';
import { SoundBoard } from '@/ui/sound/SoundBoard';

import {
  advanceTo,
  makeCaptive,
  makeFamily,
  makeInvasionReport,
  makeProvince,
  makeWorld,
} from './factories';

function setup() {
  const player = makeFamily({ name: 'Alderwyn', fame: 200 });
  const rival = makeFamily({ name: 'Stormmere', fame: 0 });
  const provinces = Array.from({ length: 30 }, (_, index) => {
    const family = index === 29 ? rival : player;

    return makeProvince({ number: index + 1, family, governor: family.ruler });
  });
  const context = makeWorld(provinces, player);
  const container = document.createElement('div');
  const reportContainer = document.createElement('div');
  const newsContainer = document.createElement('div');
  const captiveContainer = document.createElement('div');
  const sounds = new SoundBoard();
  const battle = new BattleReportControl({ ...context, sounds });
  const news = new AnnouncementsControl(context);
  const captive = new CaptiveDialogControl(context);
  const ending = new CampaignEndingControl(context);

  vi.spyOn(sounds, 'playFanfare').mockImplementation(() => {});
  vi.spyOn(sounds, 'playDirge').mockImplementation(() => {});
  document.body.append(
    container,
    reportContainer,
    newsContainer,
    captiveContainer,
  );
  battle.mount(reportContainer);
  news.mount(newsContainer);
  captive.mount(captiveContainer);
  ending.mount(container);
  advanceTo(context.world, provinces[0]!);

  return {
    ...context,
    player,
    rival,
    provinces,
    container,
    reportContainer,
    newsContainer,
    captiveContainer,
    battle,
    panel: container.querySelector<HTMLElement>('[data-ending]')!,
    shown: () =>
      !container
        .querySelector('[data-ending]')!
        .classList.contains(styles.hidden!),
    text: () => container.querySelector('[data-ending-account]')!.textContent,
    finish: () => {
      context.world.absorb(rival, player);
      return context.world.campaign.assess()!;
    },
  };
}

function setupEnding() {
  const player = makeFamily({ name: 'Alderwyn' });
  const province = makeProvince({ family: player });
  const advisor = new WorldFactory()
    .createAdvisors()
    .find((candidate) => candidate.name === 'Brannoc')!;
  const context = makeWorld([province], player, undefined, advisor);
  const container = document.createElement('div');
  const ending = new CampaignEndingControl(context);

  document.body.append(container);
  ending.mount(container);

  return {
    ...context,
    advisor,
    text: () => container.querySelector('[data-ending-account]')!.textContent,
    farewell: () =>
      container
        .querySelector('[data-farewell]')!
        .classList.contains(styles.hidden!)
        ? undefined
        : container.querySelector('[data-farewell-line]')!.textContent,
  };
}

describe('Campaign ending presentation', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('follows the final battle report and skips captive decisions', async () => {
    const fixture = setup();
    const {
      world,
      events,
      player,
      rival,
      provinces,
      container,
      reportContainer,
      captiveContainer,
    } = fixture;
    const captive = makeCaptive({
      general: rival.ruler,
      house: rival,
      captor: player,
    });
    const report = makeInvasionReport({
      source: provinces[0]!,
      target: provinces[29]!,
      defending: rival,
    });

    world.hold(captive);
    const outcome = fixture.finish();

    events.publish(new BattleReportedEvent(report));
    events.publish(new CampaignEndedEvent(outcome));
    await Promise.resolve();

    expect(fixture.shown()).toBe(false);
    reportContainer.querySelector<HTMLButtonElement>('button')!.click();
    await Promise.resolve();

    expect(fixture.shown()).toBe(true);
    expect(fixture.text()).toContain('Alderwyn has united Aureth');
    expect(captiveContainer.textContent).not.toContain('Recruit —');
    expect(document.activeElement).toBe(
      container.querySelector('[data-inspect]'),
    );
    expect(world.isHeld(captive.general)).toBe(true);
  });

  it('waits for a war animation and its report even after other turn holds release', async () => {
    const fixture = setup();
    const { events, provinces, rival, battle, reportContainer } = fixture;
    const report = makeInvasionReport({
      source: provinces[0]!,
      target: provinces[29]!,
      defending: rival,
    });
    const holder = {};
    const outcome = fixture.finish();

    events.publish(new TurnHeldEvent(holder));
    events.publish(new WarReportedEvent(report));
    events.publish(new CampaignEndedEvent(outcome));
    events.publish(new TurnReleasedEvent(holder));
    await Promise.resolve();

    expect(fixture.shown()).toBe(false);
    battle.showWar(report);
    await Promise.resolve();

    expect(fixture.shown()).toBe(false);
    reportContainer.querySelector<HTMLButtonElement>('button')!.click();
    await Promise.resolve();

    expect(fixture.shown()).toBe(true);
  });

  it('shows the surrender announcement before a diplomatic victory', async () => {
    const fixture = setup();
    const { events, rival, newsContainer } = fixture;
    const reports: BattleReportedEvent[] = [];
    const negotiate = new NegotiateCommand(fixture);
    const executor = new CommandExecutor(fixture);

    events.subscribe(BattleReportedEvent, (event) => reports.push(event));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    negotiate.demandSurrender(rival);
    executor.execute(negotiate);
    await Promise.resolve();

    expect(fixture.shown()).toBe(false);
    expect(newsContainer.querySelector('[data-text]')!.textContent).toContain(
      'Stormmere yields',
    );
    newsContainer.querySelector<HTMLButtonElement>('[data-continue]')!.click();
    await Promise.resolve();

    expect(fixture.shown()).toBe(true);
    expect(reports).toHaveLength(0);
  });

  it('hides and reopens the ending without automatically presenting it again', async () => {
    const fixture = setup();
    const { events, container } = fixture;
    const outcome = fixture.finish();

    events.publish(new CampaignEndedEvent(outcome));
    await Promise.resolve();
    const account = fixture.text();

    container.querySelector<HTMLButtonElement>('[data-inspect]')!.click();

    expect(fixture.shown()).toBe(false);
    events.publish(new CampaignEndedEvent(outcome));
    events.publish(new BattleReportClosedEvent());
    await Promise.resolve();

    expect(fixture.shown()).toBe(false);
    container.querySelector<HTMLButtonElement>('[data-reopen-ending]')!.click();

    expect(fixture.shown()).toBe(true);
    expect(fixture.text()).toBe(account);
  });

  it.each([
    {
      reason: 'absorption' as const,
      rival: 'Stormmere',
      expected: 'absorbed into Stormmere',
      absent: 'died',
    },
    {
      reason: 'no-heir' as const,
      rival: undefined,
      expected: 'Avar died and left no eligible heir',
      absent: 'Stormmere',
    },
    {
      reason: 'no-heir' as const,
      rival: 'Stormmere',
      expected: 'Stormmere banished Avar',
      absent: 'died',
    },
    {
      reason: 'last-province-lost' as const,
      rival: 'Stormmere',
      expected: 'last province to Stormmere',
      absent: 'absorbed',
    },
  ])(
    'explains $reason truthfully with rival $rival',
    async ({ reason, rival, expected, absent }) => {
      const fixture = setupEnding();
      const outcome = new CampaignOutcome({
        reason,
        rival,
        date: fixture.world.date,
        house: 'Alderwyn',
        ruler: 'Avar',
      });

      fixture.events.publish(new CampaignEndedEvent(outcome));
      await Promise.resolve();

      expect(fixture.text()).toContain(expected);
      expect(fixture.text()).not.toContain(absent);
    },
  );

  it.each([
    { reason: 'unification' as const, speaks: true },
    { reason: 'last-province-lost' as const, speaks: false },
  ])(
    'lets the advisor speak only after a victory: $reason',
    async ({ reason, speaks }) => {
      const fixture = setupEnding();
      const outcome = new CampaignOutcome({
        reason,
        date: fixture.world.date,
        house: 'Alderwyn',
        ruler: 'Avar',
      });

      fixture.events.publish(new CampaignEndedEvent(outcome));
      await Promise.resolve();

      expect(fixture.farewell()).toBe(
        speaks ? `“${fixture.advisor.farewell}”` : undefined,
      );
    },
  );
});
