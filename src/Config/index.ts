import type { TimestepEngineOptions } from '../Core/TimestepEngine';
import { Decimal } from 'decimal.js';

export const TimestepEngineConfig: Partial<TimestepEngineOptions> = {
  timestep: new Decimal(1000).div(60).toNumber(),
  maxUpdates: 10,
  alphaClamp: 1.0,
  targetFPS: 60,
  useRAF: true,
  mode: 'adaptive',
  enableStats: true,
};
