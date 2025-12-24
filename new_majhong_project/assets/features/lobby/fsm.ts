// Lobby State Machine setup

import { StateMachine, State, Transition } from '../../shared/fsm';
import { logger } from '../../shared/logger';

export function createLobbyFSM(): StateMachine {
  const fsm = new StateMachine();

  // States
  const idleState: State = {
    id: 'idle',
    onEnter: () => {
      logger.debug('LobbyFSM', 'Entered idle state');
    }
  };

  const searchingState: State = {
    id: 'searching',
    onEnter: () => {
      logger.debug('LobbyFSM', 'Entered searching state');
    }
  };

  const matchedState: State = {
    id: 'matched',
    onEnter: () => {
      logger.debug('LobbyFSM', 'Entered matched state');
    }
  };

  fsm.addState(idleState);
  fsm.addState(searchingState);
  fsm.addState(matchedState);

  // Transitions
  fsm.addTransition({
    from: 'idle',
    to: 'searching',
    event: 'START_SEARCH'
  });

  fsm.addTransition({
    from: 'searching',
    to: 'idle',
    event: 'STOP_SEARCH'
  });

  fsm.addTransition({
    from: 'searching',
    to: 'matched',
    event: 'MATCHED'
  });

  fsm.addTransition({
    from: 'matched',
    to: 'idle',
    event: 'RESET'
  });

  return fsm;
}

