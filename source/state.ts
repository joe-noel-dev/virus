export enum State {
  susceptible,
  infected,
  recovered,
  dead,
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
