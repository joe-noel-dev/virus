enum State {
  susceptible,
  infected,
  recovered,
  dead,
}

interface Person {
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

interface WetMarket {
  xPosition: number;
  yPosition: number;

  width: number;
  height: number;
}

interface World {
  people: Person[];
  time: number;
  wetMarket: WetMarket;
  lockdown: boolean;
}

interface LogEntry {
  counts: Map<State, number>;
  newEntries: Map<State, number>;
}

interface Log {
  logs: LogEntry[];
}

const numPeople = 2000;
const startingInfectionRate = 0.0;
const personRadius = 4;
const chanceOfInfection = 0.01;
const infectionRadius = 1 / 100;
const infectionDuration = 500;
const immunityDuration = infectionDuration + 1500;
const chanceOfDeath = 0.1;

const maskAdherence = 0.2;
const maskEffectiveness = 0.5;

const speedMultiplier = 1 / 750;

const logSize = 100;

function randomVelocity(): number {
  return speedMultiplier * (Math.random() * 2 - 1);
}

function generatePerson(): Person {
  return {
    xPosition: Math.random(),
    yPosition: Math.random(),

    xVelocity: randomVelocity(),
    yVelocity: randomVelocity(),

    mask: Math.random() < maskAdherence,
    respectsAuthority: Math.random(),
    isolating: false,

    state: Math.random() < startingInfectionRate ? State.infected : State.susceptible,
    infectionTime: 0,
  };
}

function generateWetMarket(): WetMarket {
  const size = 0.01;
  return {
    xPosition: Math.random() * (1 - size),
    yPosition: Math.random() * (1 - size),

    width: size,
    height: size,
  };
}

function initialise(): World {
  return {people: [...Array(numPeople)].map(generatePerson), time: 0, wetMarket: generateWetMarket(), lockdown: false};
}

function reset() {
  log.logs = [];
  world = initialise();
}

function colourForState(state: State): string {
  const styles = [
    {state: State.susceptible, style: 'white'},
    {state: State.infected, style: 'yellow'},
    {state: State.recovered, style: 'green'},
    {state: State.dead, style: 'red'},
  ];

  const style = styles.find((style) => style.state === state);
  return style ? style.style : '';
}

interface XY {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

function convertPosition(normalisedPosition: XY, width: number, height: number): XY {
  return {
    x: personRadius + normalisedPosition.x * (width - 2 * personRadius),
    y: personRadius + normalisedPosition.y * (height - 2 * personRadius),
  };
}

function convertSize(normalisedSize: Size, canvasSize: Size): Size {
  return {
    width: normalisedSize.width * canvasSize.width,
    height: normalisedSize.height * canvasSize.height,
  };
}

function drawInfectionRing(person: Person, context: CanvasRenderingContext2D, width: number, height: number) {
  let centre = convertPosition({x: person.xPosition, y: person.yPosition}, width, height);
  context.beginPath();
  context.ellipse(
    centre.x,
    centre.y,
    infectionRadius * (width - 2 * personRadius),
    infectionRadius * (height - 2 * personRadius),
    0,
    0,
    Math.PI * 2
  );
  context.closePath();
  context.fillStyle = 'rgba(255, 255, 255, 0.25)';
  context.fill();
}

function drawPerson(person: Person, context: CanvasRenderingContext2D, width: number, height: number) {
  if (person.state === State.infected) {
    drawInfectionRing(person, context, width, height);
  }

  let centre = convertPosition({x: person.xPosition, y: person.yPosition}, width, height);

  context.beginPath();
  context.ellipse(centre.x, centre.y, personRadius, personRadius, 0, 0, Math.PI * 2);
  context.closePath();
  context.fillStyle = colourForState(person.state);
  context.fill();

  if (person.mask) {
    context.beginPath();
    context.moveTo(centre.x - personRadius, centre.y);
    context.lineTo(centre.x + personRadius, centre.y);
    context.lineTo(centre.x, centre.y + personRadius);
    context.closePath();
    context.fillStyle = 'blue';
    context.fill();
  }
}

function drawWetMarket(wetMarket: WetMarket, context: CanvasRenderingContext2D, width: number, height: number) {
  let position = convertPosition({x: wetMarket.xPosition, y: wetMarket.yPosition}, width, height);
  let size = convertSize({width: wetMarket.width, height: wetMarket.height}, {width, height});
  context.fillStyle = 'rgba(255, 10, 10, 0.5)';
  context.fillRect(position.x, position.y, size.width, size.height);
}

function draw(world: World) {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.height = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth;

  const context: CanvasRenderingContext2D = canvas.getContext('2d') || new CanvasRenderingContext2D();

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawWetMarket(world.wetMarket, context, canvas.width, canvas.height);
  world.people.forEach((person) => {
    drawPerson(person, context, canvas.width, canvas.height);
  });
}

function updatePositions(world: World) {
  world.people.forEach((person) => {
    const newX = person.xPosition + person.xVelocity;
    if (0 <= newX && newX <= 1) {
      person.xPosition = newX;
    } else {
      person.xVelocity *= -1;
    }

    const newY = person.yPosition + person.yVelocity;
    if (0 <= newY && newY <= 1) {
      person.yPosition = newY;
    } else {
      person.yVelocity *= -1;
    }
  });
}

function distanceBetween(personA: Person, personB: Person): number {
  const xSquared = Math.pow(personB.xPosition - personA.xPosition, 2);
  const ySquared = Math.pow(personB.yPosition - personA.yPosition, 2);
  return Math.sqrt(xSquared + ySquared);
}

function detectCollisions(world: World) {
  const infectedPeople = world.people.filter((person) => person.state === State.infected);
  const susceptiblePeople = world.people.filter((person) => person.state === State.susceptible);
  infectedPeople.forEach((infectedPerson) => {
    susceptiblePeople.forEach((susceptiblePerson) => {
      if (distanceBetween(infectedPerson, susceptiblePerson) < infectionRadius) {
        let myChanceOfInfection = chanceOfInfection;
        if (susceptiblePerson.mask) {
          myChanceOfInfection *= 1 - maskEffectiveness;
        }
        if (infectedPerson.mask) {
          myChanceOfInfection *= 1 - maskEffectiveness;
        }
        if (Math.random() < myChanceOfInfection) {
          susceptiblePerson.state = State.infected;
          susceptiblePerson.infectionTime = world.time;
        }
      }
    });
  });
}

function judgement(world: World) {
  const infectedPeople = world.people.filter((person) => person.state === State.infected);
  infectedPeople.forEach((person) => {
    if (person.infectionTime + infectionDuration < world.time) {
      if (Math.random() < chanceOfDeath) {
        person.state = State.dead;
        person.xVelocity = 0;
        person.yVelocity = 0;
      } else {
        person.state = State.recovered;
      }
    }
  });
}

function market(world: World) {
  const wetMarket = world.wetMarket;
  const susceptiblePeople = world.people.filter((person) => person.state === State.susceptible);
  susceptiblePeople.forEach((person) => {
    if (
      wetMarket.xPosition <= person.xPosition &&
      person.xPosition <= wetMarket.xPosition + wetMarket.width &&
      wetMarket.yPosition <= person.yPosition &&
      person.yPosition <= wetMarket.yPosition + wetMarket.height
    ) {
      person.state = State.infected;
      person.infectionTime = world.time;
    }
  });
}

function immunity(world: World) {
  const recoveredPeople = world.people.filter((person) => person.state === State.recovered);
  recoveredPeople.forEach((person) => {
    if (person.infectionTime + immunityDuration < world.time) {
      person.state = State.susceptible;
    }
  });
}

function lockdown(world: World) {
  world.people.forEach((person) => {
    if (person.state === State.dead) return;

    person.xVelocity = world.lockdown ? person.xVelocity * person.respectsAuthority : randomVelocity();
    person.yVelocity = world.lockdown ? person.yVelocity * person.respectsAuthority : randomVelocity();

    if (world.lockdown && person.respectsAuthority > 0.7) {
      person.xVelocity = 0;
      person.yVelocity = 0;
    }
  });
}

function toggleLockdown() {
  world.lockdown = !world.lockdown;
  lockdown(world);
}

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

const log: Log = {
  logs: [],
};

function animationFrame() {
  requestAnimationFrame(animationFrame);
  updatePositions(world);
  detectCollisions(world);
  judgement(world);
  market(world);
  immunity(world);
  draw(world);

  if (world.time % 60 === 0) {
    const counts = new Map<State, number>();
    const newEntries = new Map<State, number>();
    world.people.forEach((person) => {
      if (!counts.has(person.state)) counts.set(person.state, 0);
      counts.set(person.state, counts.get(person.state) + 1);
    });

    if (log.logs.length === 0) {
      log.logs.push({
        counts: new Map<State, number>([
          [State.susceptible, numPeople],
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

  world.time = world.time + 1;
}

var world = initialise();
draw(world);

requestAnimationFrame(animationFrame);

document.getElementById('lockdown').onclick = toggleLockdown;
document.getElementById('reset').onclick = reset;
