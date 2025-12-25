import { Module } from "@nestjs/common";
import { CoReadingStateMachine } from "./co-reading-state-machine.service";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [EventsModule],
  providers: [CoReadingStateMachine],
  exports: [CoReadingStateMachine],
})
export class StateMachineModule {}
