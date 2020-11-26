import {generateWorld, tick, toggleLockdown, toggleHotspots, updateMasks} from './world';
import {Log, updateLog} from './log';
import {draw} from './draw';

function getMaskCoverage(): number {
  const element = document.getElementById('maskCoverage') as HTMLInputElement;
  return element ? parseFloat(element.value) / 100 : 0.5;
}

function getMaskEffectiveness(): number {
  const element = document.getElementById('maskEffectiveness') as HTMLInputElement;
  return element ? parseFloat(element.value) / 100 : 0.5;
}

function generate() {
  return generateWorld({
    numPeople: 2000,
    maskCoverage: getMaskCoverage(),
    maskEffectiveness: getMaskEffectiveness(),
    personRadius: 4,
    infectionRadius: 0.01,
    chanceOfInfection: 0.012,
    infectionDuration: 750,
    immunityDuration: 2000,
    incubationTime: 375,
    chanceOfDeath: 0.1,
  });
}

function animationFrame() {
  requestAnimationFrame(animationFrame);
  draw(world);
  tick(world);
  if (world.time % 60 === 0) {
    updateLog(world, log);
  }
}

document.getElementById('lockdown').onclick = () => {
  toggleLockdown(world);
};
document.getElementById('reset').onclick = () => {
  log.logs = [];
  world = generate();
};

document.getElementById('zones').onclick = () => {
  toggleHotspots(world);
};
document.getElementById('maskCoverage').oninput = () => {
  world.maskCoverage = getMaskCoverage();
  updateMasks(world);
};

document.getElementById('maskEffectiveness').oninput = () => {
  world.maskEffectiveness = getMaskEffectiveness();
};

const log: Log = {
  logs: [],
};

let world = generate();
draw(world);
requestAnimationFrame(animationFrame);
