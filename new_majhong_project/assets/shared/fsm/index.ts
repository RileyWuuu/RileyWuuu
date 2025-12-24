// State Machine implementation

import { logger } from '../logger';

export type StateId = string;
export type EventId = string;

export interface State {
  id: StateId;
  onEnter?: () => void;
  onExit?: () => void;
  onUpdate?: (deltaTime: number) => void;
}

export interface Transition {
  from: StateId;
  to: StateId;
  event: EventId;
  condition?: () => boolean;
  onTransition?: () => void;
}

export class StateMachine {
  private states: Map<StateId, State> = new Map();
  private transitions: Map<EventId, Transition[]> = new Map();
  private currentState: StateId | null = null;
  private initialState: StateId | null = null;

  addState(state: State): void {
    this.states.set(state.id, state);
    if (!this.initialState) {
      this.initialState = state.id;
    }
  }

  addTransition(transition: Transition): void {
    if (!this.transitions.has(transition.event)) {
      this.transitions.set(transition.event, []);
    }
    this.transitions.get(transition.event)!.push(transition);
  }

  start(initialState?: StateId): void {
    const startState = initialState || this.initialState;
    if (!startState) {
      logger.error('FSM', 'No initial state defined');
      return;
    }

    if (!this.states.has(startState)) {
      logger.error('FSM', `Initial state not found: ${startState}`);
      return;
    }

    this.currentState = startState;
    const state = this.states.get(startState)!;
    state.onEnter?.();
    logger.debug('FSM', `Entered state: ${startState}`);
  }

  dispatch(event: EventId): boolean {
    if (!this.currentState) {
      logger.warn('FSM', 'Cannot dispatch event: no current state');
      return false;
    }

    const transitions = this.transitions.get(event);
    if (!transitions) {
      logger.debug('FSM', `No transitions for event: ${event}`);
      return false;
    }

    for (const transition of transitions) {
      if (transition.from === this.currentState) {
        if (transition.condition && !transition.condition()) {
          continue;
        }

        const fromState = this.states.get(transition.from);
        const toState = this.states.get(transition.to);

        if (!toState) {
          logger.error('FSM', `Target state not found: ${transition.to}`);
          continue;
        }

        fromState?.onExit?.();
        transition.onTransition?.();
        this.currentState = transition.to;
        toState.onEnter?.();

        logger.debug('FSM', `Transition: ${transition.from} -> ${transition.to} (event: ${event})`);
        return true;
      }
    }

    return false;
  }

  update(deltaTime: number): void {
    if (!this.currentState) {
      return;
    }

    const state = this.states.get(this.currentState);
    state?.onUpdate?.(deltaTime);
  }

  getCurrentState(): StateId | null {
    return this.currentState;
  }

  isInState(stateId: StateId): boolean {
    return this.currentState === stateId;
  }
}
