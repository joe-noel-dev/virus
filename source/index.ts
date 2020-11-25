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

  state: State;
}

interface World {
  people: Person[];
}

const numPeople = 200;
const startingInfectionRate = 0.05;
const personRadius = 4;
const chanceOfInfection = 0.05;
const infectionRadius = 1 / 100;

function generatePerson(): Person {
  return {
    xPosition: Math.random(),
    yPosition: Math.random(),

    xVelocity: Math.random() * 2 - 1,
    yVelocity: Math.random() * 2 - 1,

    state: Math.random() < startingInfectionRate ? State.infected : State.susceptible,
  };
}

function initialise(): World {
  let people: Person[] = [];
  for (let index = 0; index < numPeople; ++index) {
    people.push(generatePerson());
  }
  return {people};
}

function fillStyleForPerson(person: Person): string {
  const styles = [
    {state: State.susceptible, style: 'white'},
    {state: State.infected, style: 'red'},
    {state: State.recovered, style: 'green'},
    {state: State.dead, style: 'black'},
  ];

  let style = styles.find((style) => style.state === person.state);
  return style ? style.style : '';
}

function drawPerson(person: Person, context: CanvasRenderingContext2D, width: number, height: number) {
  context.beginPath();
  context.ellipse(
    personRadius + person.xPosition * (width - 2 * personRadius),
    personRadius + person.yPosition * (height - 2 * personRadius),
    2 * personRadius,
    2 * personRadius,
    0,
    0,
    Math.PI * 2
  );
  context.closePath();
  context.fillStyle = fillStyleForPerson(person);
  context.fill();
}

function draw(world: World) {
  let canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.height = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth;

  let context: CanvasRenderingContext2D = canvas.getContext('2d') || new CanvasRenderingContext2D();

  context.clearRect(0, 0, canvas.width, canvas.height);
  world.people.forEach((person) => {
    drawPerson(person, context, canvas.width, canvas.height);
  });
}

function updatePositions(world: World) {
  let speedConstant = 500;

  world.people.forEach((person) => {
    let newX = person.xPosition + person.xVelocity / speedConstant;
    if (0 <= newX && newX <= 1) {
      person.xPosition = newX;
    } else {
      person.xVelocity *= -1;
    }

    let newY = person.yPosition + person.yVelocity / speedConstant;
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
        if (Math.random() < chanceOfInfection) {
          susceptiblePerson.state = State.infected;
        }
      }
    });
  });
}

function animationFrame() {
  requestAnimationFrame(animationFrame);
  updatePositions(world);
  detectCollisions(world);
  draw(world);
}

let world = initialise();
draw(world);

requestAnimationFrame(animationFrame);
