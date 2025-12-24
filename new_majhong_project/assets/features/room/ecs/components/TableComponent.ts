// Table Component - tracks tiles on the table

import { Component } from '../types';

export interface TableComponent extends Component {
  tiles: Array<{
    tileId: string;
    playerId: string;
    timestamp: number;
  }>;
}

