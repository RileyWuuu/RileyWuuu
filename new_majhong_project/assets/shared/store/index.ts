// Store implementation for state management

import { logger } from '../logger';

export type Action<T = any> = {
  type: string;
  payload?: T;
};

export type Reducer<S, A extends Action> = (state: S, action: A) => S;
export type Listener<S> = (state: S) => void;

export class Store<S, A extends Action> {
  private state: S;
  private reducer: Reducer<S, A>;
  private listeners: Set<Listener<S>> = new Set();
  private middleware: Array<(action: A, next: () => void) => void> = [];

  constructor(initialState: S, reducer: Reducer<S, A>) {
    this.state = initialState;
    this.reducer = reducer;
  }

  getState(): S {
    return this.state;
  }

  dispatch(action: A): void {
    if (this.middleware.length > 0) {
      let index = 0;
      const next = () => {
        if (index < this.middleware.length) {
          const middleware = this.middleware[index++];
          middleware(action, next);
        } else {
          this.executeDispatch(action);
        }
      };
      next();
    } else {
      this.executeDispatch(action);
    }
  }

  private executeDispatch(action: A): void {
    const prevState = this.state;
    this.state = this.reducer(this.state, action);
    
    if (prevState !== this.state) {
      logger.debug('Store', `State updated by action: ${action.type}`);
      this.listeners.forEach(listener => listener(this.state));
    }
  }

  subscribe(listener: Listener<S>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  use(middleware: (action: A, next: () => void) => void): void {
    this.middleware.push(middleware);
  }
}

