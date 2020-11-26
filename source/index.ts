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
  isolating: boolean;

  state: State;
  infectionTime: number;
}

interface World {
  people: Person[];
  time: number;
}

const numPeople = 200;
const startingInfectionRate = 0.05;
const personRadius = 4;
const chanceOfInfection = 0.05;
const infectionRadius = 1 / 50;
const healingTime = 500;
const chanceOfDeath = 0.002;

const maskAdherence = 0.5;
const maskEffectiveness = 0.1;

const speedMultiplier = 1 / 1000;

function generatePerson(): Person {
  return {
    xPosition: Math.random(),
    yPosition: Math.random(),

    xVelocity: speedMultiplier * (Math.random() * 2 - 1),
    yVelocity: speedMultiplier * (Math.random() * 2 - 1),

    mask: Math.random() < maskAdherence,
    isolating: false,

    state: Math.random() < startingInfectionRate ? State.infected : State.susceptible,
    infectionTime: 0,
  };
}

function initialise(): World {
  return {people: [...Array(numPeople)].map(generatePerson), time: 0};
}

function fillStyleForPerson(person: Person): string {
  const styles = [
    {state: State.susceptible, style: 'white'},
    {state: State.infected, style: 'yellow'},
    {state: State.recovered, style: 'green'},
    {state: State.dead, style: 'red'},
  ];

  const style = styles.find((style) => style.state === person.state);
  return style ? style.style : '';
}

interface XY {
  x: number;
  y: number;
}

function convertPosition(normalisedPosition: XY, width: number, height: number): XY {
  return {
    x: personRadius + normalisedPosition.x * (width - 2 * personRadius),
    y: personRadius + normalisedPosition.y * (height - 2 * personRadius),
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
  context.fillStyle = fillStyleForPerson(person);
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

function draw(world: World) {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.height = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth;

  const context: CanvasRenderingContext2D = canvas.getContext('2d') || new CanvasRenderingContext2D();

  context.clearRect(0, 0, canvas.width, canvas.height);
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

function heal(world: World) {
  const infectedPeople = world.people.filter((person) => person.state === State.infected);
  infectedPeople.forEach((person) => {
    if (person.infectionTime + healingTime < world.time) {
      person.state = State.recovered;
    }
  });
}

function kill(world: World) {
  const infectedPeople = world.people.filter((person) => person.state === State.infected);
  infectedPeople.forEach((person) => {
    if (Math.random() < chanceOfDeath) {
      person.state = State.dead;
      person.xVelocity = 0;
      person.yVelocity = 0;
    }
  });
}

function animationFrame() {
  requestAnimationFrame(animationFrame);
  updatePositions(world);
  detectCollisions(world);
  heal(world);
  kill(world);
  draw(world);
  world.time = world.time + 1;
}

const world = initialise();
draw(world);

requestAnimationFrame(animationFrame);
