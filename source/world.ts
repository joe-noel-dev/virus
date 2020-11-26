import {Person, generatePerson} from './person';
import {Zone, generateZone} from './zone';
import {State} from './state';
import {randomVelocity} from './utils';

export interface World {
  people: Person[];
  time: number;
  wetMarket: Zone;
  hotspots: Zone[];
  lockdown: boolean;
  maskCoverage: number;
  maskEffectiveness: number;

  personRadius: number;
  infectionRadius: number;

  chanceOfInfection: number;
  infectionDuration: number;
  immunityDuration: number;
  incubationTime: number;
  chanceOfDeath: number;
}

interface Options {
  numPeople: number;
  maskCoverage: number;
  maskEffectiveness: number;
  personRadius: number;
  infectionRadius: number;

  chanceOfInfection: number;
  infectionDuration: number;
  immunityDuration: number;
  incubationTime: number;
  chanceOfDeath: number;
}

export function generateWorld(options: Options): World {
  return {
    people: [...Array(options.numPeople)].map(() => generatePerson(options.maskCoverage)),
    time: 0,
    wetMarket: generateZone(0.01),
    lockdown: false,
    hotspots: [],
    ...options,
  };
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
      if (Math.abs(infectedPerson.xPosition - susceptiblePerson.xPosition) > world.infectionRadius) return;

      if (Math.abs(infectedPerson.yPosition - susceptiblePerson.yPosition) > world.infectionRadius) return;

      let myChanceOfInfection = world.chanceOfInfection;
      const maskEffectiveness = world.maskEffectiveness;
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
    if (person.infectionTime + world.incubationTime < world.time) {
      person.isolating = true;
      person.xVelocity = 0;
      person.yVelocity = 0;
    }

    if (person.infectionTime + world.infectionDuration < world.time) {
      if (Math.random() < world.chanceOfDeath) {
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
    if (person.infectionTime + world.immunityDuration < world.time) {
      person.state = State.susceptible;
    }
  });
}

export function updateMasks(world: World) {
  world.people.forEach((person) => {
    if (person.state === State.dead) return;
    person.mask = 1.0 - person.respectsAuthority < world.maskCoverage;
  });
}

export function toggleHotspots(world: World) {
  if (world.hotspots.length) {
    world.hotspots = [];
  } else {
    world.hotspots = [...Array(3)].map(() => generateZone(0.1));
  }
}

export function toggleLockdown(world: World) {
  world.lockdown = !world.lockdown;
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

export function tick(world: World) {
  updatePositions(world);
  detectCollisions(world);
  judgement(world);
  market(world);
  immunity(world);
  world.time++;
}
