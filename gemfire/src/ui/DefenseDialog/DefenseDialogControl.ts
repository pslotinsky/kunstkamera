import { DefendCommand } from '@/core/commands/DefendCommand';
import type { DefenderAnswer } from '@/core/domain/DefensePolicy';
import type { FifthUnit } from '@/core/domain/FifthUnit';
import type { DefenseChoice, Invasion } from '@/core/domain/Invasion';
import type { Province } from '@/core/domain/Province';
import { DefenseRequestedEvent } from '@/core/events/DefenseRequestedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { Control } from '@/lib/Control';
import { DropdownControl } from '@/ui/Dropdown/DropdownControl';
import {
  findOptionProvince,
  toProvinceOptions,
  toUnitOptions,
} from '@/ui/Dropdown/dropdown-options';
import { TargetingEndedEvent } from '@/ui/ProvinceCommands/TargetingEndedEvent';
import { TargetingStartedEvent } from '@/ui/ProvinceCommands/TargetingStartedEvent';
import { TurnHold } from '@/ui/TurnHold';

import { AnswerChosenEvent } from './AnswerChosenEvent';
import {
  type DefenseDialogContext,
  type DefenseDialogControls,
  DefenseDialogView,
} from './DefenseDialogView';
import { RefugeCancelledEvent } from './RefugeCancelledEvent';
import { RefugeConfirmedEvent } from './RefugeConfirmedEvent';

export class DefenseDialogControl extends Control<
  DefenseDialogView,
  DefenseDialogControls
> {
  private readonly defend: DefendCommand;
  private readonly turnHold: TurnHold;

  private invasion?: Invasion | undefined;
  private picking = false;

  public constructor(context: DefenseDialogContext) {
    super(DefenseDialogView, context, {
      unit: new DropdownControl({ name: 'unit' }),
      refuge: new DropdownControl({ name: 'refuge' }),
    });
    this.defend = new DefendCommand(context);
    this.turnHold = new TurnHold(context.events);
  }

  public get isPicking(): boolean {
    return this.picking;
  }

  public pickRefuge(province: Province): void {
    if (this.picking && this.invasion?.refuges.includes(province)) {
      this.controls.refuge.setValue(String(province.number));
    }
  }

  protected override onMount(): void {
    this.context.events.subscribe(
      DefenseRequestedEvent,
      (event) => this.open(event.invasion),
      this.signal,
    );
    this.subscribe(AnswerChosenEvent, (event) => this.answer(event.answer));
    this.subscribe(RefugeConfirmedEvent, () => this.flee());
    this.subscribe(RefugeCancelledEvent, () => this.stepBack());
  }

  private open(invasion: Invasion): void {
    this.invasion = invasion;
    this.turnHold.hold();
    this.offerUnits(invasion);
    this.view.askForAnswer(invasion);
  }

  private offerUnits(invasion: Invasion): void {
    this.controls.unit.setOptions(toUnitOptions(invasion.defendingUnits));
    this.controls.unit.setValue(invasion.defender.unit?.name ?? '');
  }

  private answer(answer: DefenderAnswer): void {
    const invasion = this.invasion;

    if (invasion && answer === 'retreat' && invasion.refuges.length > 1) {
      this.askForRefuge(invasion);
    } else if (invasion) {
      this.settle(invasion, {
        answer,
        unit: this.findChosenUnit(invasion),
        refuge: invasion.refuges[0],
      });
    }
  }

  private askForRefuge(invasion: Invasion): void {
    const { refuges } = invasion;

    this.picking = true;
    this.controls.refuge.setOptions(toProvinceOptions(refuges));
    this.controls.refuge.setValue(String(invasion.chooseRefuge()?.number));
    this.context.events.publish(
      new TargetingStartedEvent(
        refuges.map((refuge) => refuge.number),
        false,
      ),
    );
    this.view.askForRefuge();
  }

  private flee(): void {
    const invasion = this.invasion;

    if (invasion) {
      this.stopPicking();
      this.settle(invasion, {
        answer: 'retreat',
        refuge: findOptionProvince(
          invasion.refuges,
          this.controls.refuge.value,
        ),
      });
    }
  }

  private stepBack(): void {
    if (this.invasion) {
      this.stopPicking();
      this.view.askForAnswer(this.invasion);
    }
  }

  private stopPicking(): void {
    this.picking = false;
    this.context.events.publish(new TargetingEndedEvent());
  }

  private settle(invasion: Invasion, choice: DefenseChoice): void {
    const { world, events } = this.context;

    this.invasion = undefined;
    this.view.hide();
    this.defend.defend(invasion, choice);
    this.defend.execute();

    if (!this.defend.suspendsTurn()) {
      events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
    }

    this.turnHold.release();
  }

  private findChosenUnit(invasion: Invasion): FifthUnit | undefined {
    const chosen = this.controls.unit.value;

    return invasion.defendingUnits.find((unit) => unit.name === chosen);
  }
}
