import {randomVelocity} from './utils';
import {State} from './state';

export interface Person {
  xPosition: number;
  yPosition: number;

  xVelocity: number;
  yVelocity: number;

  mask: boolean;
  respectsAuthority: number;
  isolating: boolean;

  state: State;
  infectionTime: number;
}

export function generatePerson(maskCoverage: number): Person {
  const respectsAuthority = Math.random();
  return {
    xPosition: Math.random(),
    yPosition: Math.random(),

    xVelocity: randomVelocity(),
    yVelocity: randomVelocity(),

    mask: 1.0 - respectsAuthority < maskCoverage,
    respectsAuthority,
    isolating: false,

    state: State.susceptible,
    infectionTime: 0,
  };
}
