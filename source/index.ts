interface Person {
  xPosition: number;
  yPosition: number;

  xVelocity: number;
  yVelocity: number;
}

interface World {
  people: Person[];
}

function generatePerson(): Person {
  return {
    xPosition: Math.random(),
    yPosition: Math.random(),

    xVelocity: Math.random() * 2 - 1,
    yVelocity: Math.random() * 2 - 1,
  };
}

function initialise(): World {
  let numPeople = 100;
  let people: Person[] = [];
  for (let index = 0; index < numPeople; ++index) {
    people.push(generatePerson());
  }
  return { people };
}

function draw(world: World) {
  let canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.height = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth;

  let radius = 5;

  let context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  world.people.forEach((person) => {
    context.beginPath();
    context.ellipse(
      radius + person.xPosition * (canvas.width - 2 * radius),
      radius + person.yPosition * (canvas.height - 2 * radius),
      2 * radius,
      2 * radius,
      0,
      0,
      Math.PI * 2
    );
    context.closePath();
    context.fillStyle = "red";
    context.fill();
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

function animationFrame() {
  requestAnimationFrame(animationFrame);
  updatePositions(world);
  draw(world);
}

let world = initialise();
draw(world);

requestAnimationFrame(animationFrame);
