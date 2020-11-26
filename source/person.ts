import {randomVelocity} from './utils';

export enum State {
  susceptible,
  infected,
  recovered,
  dead,
}

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

export function colourForState(state: State): string {
  const styles = [
    {state: State.susceptible, style: 'white'},
    {state: State.infected, style: 'yellow'},
    {state: State.recovered, style: 'green'},
    {state: State.dead, style: 'red'},
  ];

  const style = styles.find((style) => style.state === state);
  return style ? style.style : '';
}
