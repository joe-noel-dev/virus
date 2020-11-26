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

interface Zone {
  xPosition: number;
  yPosition: number;

  width: number;
  height: number;
}

interface World {
  people: Person[];
  time: number;
  wetMarket: Zone;
  hotspots: Zone[];
  lockdown: boolean;
  maskCoverage: number;
  maskEffectiveness: number;
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
const chanceOfInfection = 0.012;
const infectionRadius = 1 / 100;
const infectionDuration = 750;
const immunityDuration = infectionDuration + 1500;
const incubationTime = 0.5 * infectionDuration;
const chanceOfDeath = 0.1;

const speedMultiplier = 1 / 750;

const logSize = 100;

function randomVelocity(): number {
  return speedMultiplier * (Math.random() * 2 - 1);
}

function generatePerson(maskCoverage: number): Person {
  const respectsAuthority = Math.random();
  return {
    xPosition: Math.random(),
    yPosition: Math.random(),

    xVelocity: randomVelocity(),
    yVelocity: randomVelocity(),

    mask: 1.0 - respectsAuthority < maskCoverage,
    respectsAuthority,
    isolating: false,

    state: Math.random() < startingInfectionRate ? State.infected : State.susceptible,
    infectionTime: 0,
  };
}

function generateZone(size: number): Zone {
  return {
    xPosition: Math.random() * (1 - size),
    yPosition: Math.random() * (1 - size),

    width: size,
    height: size,
  };
}

function getMaskCoverage(): number {
  const element = document.getElementById('maskCoverage') as HTMLInputElement;
  return element ? parseFloat(element.value) / 100 : 0.5;
}

function getMaskEffectiveness(): number {
  const element = document.getElementById('maskEffectiveness') as HTMLInputElement;
  return element ? parseFloat(element.value) / 100 : 0.5;
}

function initialise(): World {
  const maskCoverage = getMaskCoverage();
  return {
    people: [...Array(numPeople)].map(() => generatePerson(maskCoverage)),
    time: 0,
    wetMarket: generateZone(0.01),
    lockdown: false,
    maskCoverage,
    maskEffectiveness: getMaskEffectiveness(),
    hotspots: [],
  };
}

function toggleHotspots() {
  if (world.hotspots.length) {
    world.hotspots = [];
  } else {
    world.hotspots = [...Array(3)].map(() => generateZone(0.1));
  }
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
  let size = convertSize({width: 2 * infectionRadius, height: 2 * infectionRadius}, {width, height});
  context.fillStyle = 'rgba(255, 255, 255, 0.25)';
  context.fillRect(centre.x - size.width / 2, centre.y - size.height / 2, size.width, size.height);
}

function drawPerson(person: Person, context: CanvasRenderingContext2D, width: number, height: number) {
  if (person.state === State.infected && !person.isolating) {
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
    context.rect(centre.x, centre.y - personRadius, personRadius, personRadius);
    context.closePath();
    context.fillStyle = 'blue';
    context.fill();
  }
}

function drawZone(zone: Zone, context: CanvasRenderingContext2D, width: number, height: number, colour: string) {
  let position = convertPosition({x: zone.xPosition, y: zone.yPosition}, width, height);
  let size = convertSize({width: zone.width, height: zone.height}, {width, height});
  context.fillStyle = colour;
  context.fillRect(position.x, position.y, size.width, size.height);
}

function draw(world: World) {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.height = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth;

  const context: CanvasRenderingContext2D = canvas.getContext('2d') || new CanvasRenderingContext2D();

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawZone(world.wetMarket, context, canvas.width, canvas.height, 'rgba(255, 10, 10, 0.5)');
  world.hotspots.forEach((hotspot) => {
    drawZone(hotspot, context, canvas.width, canvas.height, 'rgba(10, 10, 255, 0.5)');
  });
  world.people.forEach((person) => {
    drawPerson(person, context, canvas.width, canvas.height);
  });
}

function isPositionInZone(zone: Zone, xPosition: number, yPosition: number): boolean {
  return (
    zone.xPosition <= xPosition &&
    xPosition <= zone.xPosition + zone.width &&
    zone.yPosition <= yPosition &&
    yPosition <= zone.yPosition + zone.height
  );
}

function updatePositions(world: World) {
  world.people.forEach((person) => {
    const newX = person.xPosition + person.xVelocity;
    const newY = person.yPosition + person.yVelocity;

    world.hotspots.forEach((hotspot) => {
      if (!isPositionInZone(hotspot, person.xPosition, person.yPosition)) return;

      if (Math.random() < 0.2) return;

      if (!(hotspot.xPosition <= newX && newX <= hotspot.xPosition + hotspot.width)) {
        person.xVelocity *= -1;
      }

      if (!(hotspot.yPosition <= newY && newY <= hotspot.yPosition + hotspot.height)) {
        person.yVelocity *= -1;
      }
    });

    if (0 <= newX && newX <= 1) {
      person.xPosition = newX;
    } else {
      person.xVelocity *= -1;
    }

    if (0 <= newY && newY <= 1) {
      person.yPosition = newY;
    } else {
      person.yVelocity *= -1;
    }
  });
}

function detectCollisions(world: World) {
  const infectedPeople = world.people.filter((person) => person.state === State.infected && !person.isolating);
  const susceptiblePeople = world.people.filter((person) => person.state === State.susceptible && !person.isolating);
  infectedPeople.forEach((infectedPerson) => {
    susceptiblePeople.forEach((susceptiblePerson) => {
      if (Math.abs(infectedPerson.xPosition - susceptiblePerson.xPosition) > infectionRadius) return;

      if (Math.abs(infectedPerson.yPosition - susceptiblePerson.yPosition) > infectionRadius) return;

      let myChanceOfInfection = chanceOfInfection;
      const maskEffectiveness = getMaskEffectiveness();
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
    });
  });
}

function judgement(world: World) {
  const infectedPeople = world.people.filter((person) => person.state === State.infected);
  infectedPeople.forEach((person) => {
    if (person.infectionTime + incubationTime < world.time) {
      person.isolating = true;
      person.xVelocity = 0;
      person.yVelocity = 0;
    }

    if (person.infectionTime + infectionDuration < world.time) {
      if (Math.random() < chanceOfDeath) {
        person.state = State.dead;
        person.xVelocity = 0;
        person.yVelocity = 0;
      } else {
        person.state = State.recovered;
        person.isolating = false;
        person.xVelocity = randomVelocity();
        person.yVelocity = randomVelocity();
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

    person.xVelocity = world.lockdown ? person.xVelocity * (1 - person.respectsAuthority) : randomVelocity();
    person.yVelocity = world.lockdown ? person.yVelocity * (1 - person.respectsAuthority) : randomVelocity();

    if (world.lockdown && person.respectsAuthority > 0.7) {
      person.xVelocity = 0;
      person.yVelocity = 0;
    }
  });
}

function updateMasks() {
  const maskCoverage = getMaskCoverage();
  world.people.forEach((person) => {
    if (person.state === State.dead) return;
    person.mask = 1.0 - person.respectsAuthority < maskCoverage;
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
document.getElementById('zones').onclick = toggleHotspots;
document.getElementById('maskCoverage').oninput = updateMasks;
