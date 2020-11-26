import {State, colourForState} from './state';
import {World} from './world';

export interface LogEntry {
  counts: Map<State, number>;
  newEntries: Map<State, number>;
}

export interface Log {
  logs: LogEntry[];
}

const logSize = 100;

function drawGraph(log: Log) {
  const canvas = document.getElementById('graph') as HTMLCanvasElement;
  canvas.height = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth;

  const context: CanvasRenderingContext2D = canvas.getContext('2d') || new CanvasRenderingContext2D();

  context.clearRect(0, 0, canvas.width, canvas.height);

  const numPoints = 100;
  const start = Math.max(0, log.logs.length - numPoints);
  const displayLogs = log.logs.slice(start);
  const yMax = 100;

  const states = [State.infected, State.dead];
  states.forEach((state) => {
    context.beginPath();
    displayLogs.forEach((log, index) => {
      const count = log.newEntries.get(state);
      context.lineTo((index * canvas.width) / numPoints, canvas.height - (count * canvas.height) / yMax);
    });
    context.strokeStyle = colourForState(state);
    context.stroke();
  });
}

export function updateLog(world: World, log: Log) {
  const counts = new Map<State, number>();
  const newEntries = new Map<State, number>();
  world.people.forEach((person) => {
    if (!counts.has(person.state)) counts.set(person.state, 0);
    counts.set(person.state, counts.get(person.state) + 1);
  });

  if (log.logs.length === 0) {
    log.logs.push({
      counts: new Map<State, number>([
        [State.susceptible, world.people.length],
        [State.infected, 0],
        [State.recovered, 0],
        [State.dead, 0],
      ]),
      newEntries: new Map<State, number>([
        [State.susceptible, 0],
        [State.infected, 0],
        [State.recovered, 0],
        [State.dead, 0],
      ]),
    });
  }

  const previousCounts = log.logs[log.logs.length - 1].counts;

  const get = (count: Map<State, number>, state: State): number => (count.has(state) ? count.get(state) : 0);

  const newRecovered = get(counts, State.recovered) - get(previousCounts, State.recovered);
  const newDead = get(counts, State.dead) - get(previousCounts, State.dead);

  newEntries.set(
    State.infected,
    get(counts, State.infected) - get(previousCounts, State.infected) + newRecovered + newDead
  );
  newEntries.set(State.dead, get(counts, State.dead) - get(previousCounts, State.dead));
  newEntries.set(State.recovered, get(counts, State.recovered) - get(previousCounts, State.recovered));

  log.logs.push({counts, newEntries});

  if (log.logs.length > logSize) {
    log.logs = log.logs.slice(log.logs.length - logSize);
  }

  drawGraph(log);

  document.getElementById('susceptible-count').innerHTML = `${get(counts, State.susceptible)}`;
  document.getElementById('infected-count').innerHTML = `${get(counts, State.infected)}`;
  document.getElementById('recovered-count').innerHTML = `${get(counts, State.recovered)}`;
  document.getElementById('dead-count').innerHTML = `${get(counts, State.dead)}`;
}
