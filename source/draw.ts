import {Person} from './person';
import {World} from './world';
import {State, colourForState} from './state';
import {Zone} from './zone';

interface XY {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

function convertPosition(normalisedPosition: XY, width: number, height: number, personRadius: number): XY {
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

function drawInfectionRing(
  person: Person,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  personRadius: number,
  infectionRadius: number
) {
  let centre = convertPosition({x: person.xPosition, y: person.yPosition}, width, height, personRadius);
  let size = convertSize({width: 2 * infectionRadius, height: 2 * infectionRadius}, {width, height});
  context.fillStyle = 'rgba(255, 255, 255, 0.25)';
  context.fillRect(centre.x - size.width / 2, centre.y - size.height / 2, size.width, size.height);
}

function drawPerson(
  person: Person,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  personRadius: number,
  infectionRadius: number
) {
  if (person.state === State.infected && !person.isolating) {
    drawInfectionRing(person, context, width, height, personRadius, infectionRadius);
  }

  let centre = convertPosition({x: person.xPosition, y: person.yPosition}, width, height, personRadius);

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

function drawZone(
  zone: Zone,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  colour: string,
  personRadius: number
) {
  let position = convertPosition({x: zone.xPosition, y: zone.yPosition}, width, height, personRadius);
  let size = convertSize({width: zone.width, height: zone.height}, {width, height});
  context.fillStyle = colour;
  context.fillRect(position.x, position.y, size.width, size.height);
}

export function draw(world: World) {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.height = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth;

  const context: CanvasRenderingContext2D = canvas.getContext('2d') || new CanvasRenderingContext2D();

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawZone(world.wetMarket, context, canvas.width, canvas.height, 'rgba(255, 10, 10, 0.5)', world.personRadius);
  world.hotspots.forEach((hotspot) => {
    drawZone(hotspot, context, canvas.width, canvas.height, 'rgba(10, 10, 255, 0.5)', world.personRadius);
  });
  world.people.forEach((person) => {
    drawPerson(person, context, canvas.width, canvas.height, world.personRadius, world.infectionRadius);
  });
}
