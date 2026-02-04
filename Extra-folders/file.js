goToPanel.style.display = "none";
loading.style.opacity = 0;

let followBestCar = true;
let manual = false;
const maxCarCount = 10; //for optimization
const stopForFittness = true;
const showVerticalButtons = false; // actually editing mode, enables nneditor and sets useHardcodedBrain to opposite and dec boundary visibility
const showDecisionBoundary = showVerticalButtons;
const useHardCodedBrain = !showVerticalButtons;
const showInspectionSection = false;
let showGrid = false;
let verticalButtonsWidth = 0;
let selectedCarIndex = 0;

let season = "summer";
let wDown = false;
let aDown = false;
let sDown = false;
let gDown = false;

//check if we're in the autumn months

const links = {
  Karelia:
    "https://www.karelia.fi/en/information-and-communication-technology",
  CGI: "https://www.cgi.com/en",
  Arbonaut: "https://www.arbonaut.com/en",
  Karelics: "https://karelics.fi/",
  Nolwenture: "https://www.nolwenture.com/",
  UEF: "https://www.uef.fi/en",
  Solenovo: "https://www.solenovo.fi",
  Siili: "https://www.siili.com",
  Blancco: "https://www.blancco.com",
};
let linkToVisit = links["Karelia"];

const multiDecisionBoundary = true; //always true...
// STORE THESE IN WORLD
const outputColors = ["green", "blue", "red", "#888"];

const initialZoom = 2; //1.5;
//const initialOffset = { x: 464, y: 405 }; //line
const initialOffset = { x: 636.5, y: 396 }; //parallel

const images = generateImages([
  "🠉",
  "🠈",
  "🠊",
  "🠋",
  "⬉",
  "⬆",
  "⬈",
  "⏱️",
  "🛑",
  "🚦",
  "🎯",
  "🚶",
  "⚠️",
  "🅿️",
]);

const carColors = [
  "#06F",
  "#F44",
  "#0B0",
  "#EB0",
  "magenta",
  "cyan",
  "black",
];

if (localStorage.getItem("mutation")) {
  mutationSld.value = localStorage.getItem("mutation") * 100;
}

const defaultOptions = localStorage.getItem("defaultOptions")
  ? JSON.parse(localStorage.getItem("defaultOptions"))
  : {
    type: "AI", // "KEYS" "DUMMY"
    width: 30,
    height: 50, //height: 90,
    maxSpeed: 3,
    color: "blue", //color:"orange",
    acceleration: 0.2,
    friction: 0.1,
    autoForward: true,
    sensorOptions: {
      rayCount: 5,
      rayLength: 250,
      raySpread: 0.6, //Math.PI / 2, // Math.PI / 2,
      rayOffset: 0, //-Math.PI/2//0//-Math.PI/4//, rayOffset: 0,
    },
    brainOptions: {
      extraInputs: [], //"s"], //"s"], //["s"], //"s"],
      hiddenLayerNodeCounts: [],
      outputs: ["🠉", "🠈", "🠊", "🠋"],
      //outputs: ["🠉", "🠋"],
      //outputs: ["🠉"],
      //outputs: ["🠈", "🠋", "🠊"],
      //outputs: [ "🠋"],
    },
  };
//setInterfaceOptions(defaultOptions);

const rightBarWidth = showInspectionSection ? 500 : 0;

if (!showInspectionSection) {
  inspectionSection.style.display = "none";
}
const carCanvas = document.getElementById("carCanvas");
carCanvas.width = window.innerWidth;
carCanvas.height = window.innerHeight;

goToPanel.style.left = carCanvas.width / 2 + "px";
followBtn.style.left = carCanvas.width - 120 + "px";
followBtn.style.top = window.innerHeight - 120 + "px";
//manualBtn.style.left = 0 + "px";
//manualBtn.style.top = "8px";//window.innerHeight - 120 + "px";

if (showVerticalButtons) {
  verticalButtons.style.display = "block";
  verticalButtonsWidth = 30;
}

if (!useHardCodedBrain) {
  carString = localStorage.getItem("car");
  carInfo = carString ? JSON.parse(carString) : null;
}

setInterfaceOptions(carInfo);

document.addEventListener("keydown", (event) => {
  if (event.key === "1") {
    selectCar(0);
  } else if (event.key === "2") {
    selectCar(1);
  } else if (event.key === "3") {
    selectCar(2);
  } else if (event.key === "4") {
    selectCar(3);
  } else if (event.key === "+") {
    viewport.zoomIn();
  } else if (event.key === "*") {
    viewport.zoomInDoubleMax();
  } else if (event.key === "-") {
    viewport.zoomOut();
  } else if (event.key === "T") {
    bestCar.x = viewport.mouse.x;
    bestCar.y = viewport.mouse.y;
  } else if (event.key === "W" || event.key === "w") {
    wDown = true;
  } else if (event.key === "A" || event.key === "a") {
    aDown = true;
  } else if (event.key === "S" || event.key === "s") {
    sDown = true;
  } else if (event.key === "G" || event.key === "g") {
    gDown = true;
  }
});

const nnCanvas = document.createElement("canvas");
nnCanvas.height = 0;
nnCanvas.width = 0;

//changeTarget(goingToSelect);

/*
const worldString = localStorage.getItem("world");
const world = worldString
? World.load(JSON.parse(worldString))
: new World(new Graph());
world.generate(false);
*/

const grid = Grid.load(carCanvas, world, world.grid);

const viewport = new Viewport(
  carCanvas,
  2,
  world.offset,
  true,
  true,
  0
);
//Visualizer.addEventListeners(decisionBoundaryCanvas);

const carCtx = carCanvas.getContext("2d");

const carMarkings = world.markings.filter((m) => m instanceof Start);

let stopBorders = world.markings
  .filter((m) => m instanceof Stop)
  .map((s) => [s.border.p2, s.border.p1]);
let yieldCrossingBorders = world.markings
  .filter((m) => m instanceof Yield)
  .map((s) => [s.border.p2, s.border.p1])
  .concat(
    world.markings
      .filter((m) => m instanceof Crossing)
      .map((s) => [
        [s.borders[0].p1, s.borders[0].p2],
        [s.borders[1].p1, s.borders[1].p2],
        [s.borders[0].p2, s.borders[0].p1],
        [s.borders[1].p2, s.borders[1].p1],
      ])
      .flat()
  );
// MAKE SURE CHANGE BELOW AS WELL
let lightBorders = world.markings
  .filter(
    (m) =>
      m instanceof Light &&
      (m.state == "red" || m.state == "yellow")
  )
  .map((s) => [s.border.p1, s.border.p2]);

const targets = world.markings.filter((m) => m instanceof Target);

for (let i = 0; i < targets.length; i++) {
  switch (i) {
    case 0:
      targets[i].name = "Wärtsilä";
      targets[i].img = new Image();
      targets[i].img.src = "imgs/maps-and-flags.png";

      break;
    case 1:
      targets[i].name = "Solenovo";
      targets[i].img = new Image();
      targets[i].img.src = "imgs/maps-and-flags.png";
      break;
    case 2:
      targets[i].name = "Karelics";
      targets[i].img = new Image();
      targets[i].img.src = "imgs/maps-and-flags.png";
      break;
    case 3:
      targets[i].name = "UEF";
      targets[i].img = new Image();
      targets[i].img.src = "imgs/maps-and-flags.png";
      break;
    case 4:
      targets[i].name = "CGI";
      targets[i].img = new Image();
      targets[i].img.src = "imgs/maps-and-flags.png";
      break;
    case 5:
      targets[i].name = "Arbonaut";
      targets[i].img = new Image();
      targets[i].img.src = "imgs/maps-and-flags.png";
      break;
    case 6:
      targets[i].name = "Tikkarinne";
      targets[i].img = new Image();
      targets[i].img.src = "imgs/maps-and-flags.png";
      break;
  }
}

const roadBorders = world.roadBorders.map((s) => [s.p1, s.p2]);

const optimizing = localStorage.getItem("optimizing");

const N = optimizing ? maxCarCount : carMarkings.length;

const cars = generateCars(N, carMarkings);
if (carInfo) {
  setInterfaceOptions(carInfo);
  for (let i = 0; i < cars.length; i++) {
    //cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
    cars[i].clone(carInfo);
    cars[i].nn = NN.load(carInfo.nn, nnCanvas.height);

    if (i > 0) {
      /*
NeuralNetwork.mutate(
   cars[i].brain,
   0.2,
   Visualizer.selectedBiases,
   Visualizer.selectedWeights
);
*/
      cars[i].nn.mutate(mutationSld.value / 100);
    }
  }
}
for (let i = 0; i < cars.length; i += carMarkings.length) {
  for (
    let j = 1;
    j < carMarkings.length && i + j < cars.length;
    j++
  ) {
    cars[i + j].brain = JSON.parse(JSON.stringify(cars[i].brain));
    cars[i + j].nn = NN.load(JSON.parse(JSON.stringify(cars[i].nn)));
  }
}

let bestCar = cars[0];

let nnViewport = null;
let nnEditor = null;
const decisionBoundaries = [];
const networkCtxts = [];

generateCarInspector(0);

const traffic = [];

/*
const world = World.load(worldInfo);
const miniMap = new MiniMap(miniMapContainer, world.graph);
road.borders = world.roadPoly.segments.map((s) => [s.p1, s.p2]);

const index = Math.floor(Math.random() * world.graph.segments.length);
const startSeg = world.graph.segments[index];
const startPoint = startSeg.p1;
const vec = subtract(startSeg.p2, startSeg.p1);

for (const car of cars) {
car.x = startPoint.x;
car.y = startPoint.y;
car.angle = -2;
}

let ZOOM = 1.5;
carCanvas.onwheel = (evt) => {
const dir = Math.sign(evt.deltaY);
const step = 0.05;
ZOOM -= dir * step;
ZOOM = Math.min(2, Math.max(0.5, ZOOM));
};
*/
let lastLoop = new Date();

localStorage.removeItem("optimizing");

giveAllPaths();

setTimeout(() => {
  stage.style.opacity = 1;
  loading.style.display = "none";

  const today = new Date();
  const month = today.getMonth();
  if (month >= 9 && month <= 10) {
    season = "autumn";
  }
  if (month >= 10 || month <= 1) {
    season = "winter";
  }

  if (wDown) {
    season = "winter";
  } else if (aDown) {
    season = "autumn";
  } else if (sDown) {
    season = "summer";
  }

  if (gDown) {
    showGrid = true;
  }

  animate();
}, 500);

function setInterfaceOptions(carInfo) {
  rayCount.value = carInfo.sensorOptions.rayCount;
  rayLength.value = carInfo.sensorOptions.rayLength;
  raySpread.value = carInfo.sensorOptions.raySpread;
  rayOffset.value = carInfo.sensorOptions.rayOffset;
  output_forward.style.backgroundColor =
    carInfo.brainOptions.outputs.includes("🠉") ? "white" : "gray";
  output_left.style.backgroundColor =
    carInfo.brainOptions.outputs.includes("🠈") ? "white" : "gray";
  output_right.style.backgroundColor =
    carInfo.brainOptions.outputs.includes("🠊") ? "white" : "gray";
  output_reverse.style.backgroundColor =
    carInfo.brainOptions.outputs.includes("🠋") ? "white" : "gray";

  hiddenOnOff.checked =
    carInfo.brainOptions.hiddenLayerNodeCounts.length > 0;
  if (hiddenOnOff.checked) {
    hiddenCount.value =
      carInfo.brainOptions.hiddenLayerNodeCounts.join(",");
  } else {
    hiddenCount.value = "3,4";
  }
  toggleHidden();

  aiOnOff.checked = carInfo.type == "AI";
  speedOnOff.checked =
    carInfo.brainOptions.extraInputs.includes("⏱️");
  stopOnOff.checked = carInfo.brainOptions.extraInputs.includes("🛑");
  lightOnOff.checked =
    carInfo.brainOptions.extraInputs.includes("🚦");
  targetsOnOff.checked =
    carInfo.brainOptions.extraInputs.includes("🎯"); //!!! REMEMBER IN CAR
  crossingOnOff.checked =
    carInfo.brainOptions.extraInputs.includes("🚶");
  yieldOnOff.checked =
    carInfo.brainOptions.extraInputs.includes("⚠️");
  parkingOnOff.checked =
    carInfo.brainOptions.extraInputs.includes("🅿️");

  autoForwardOnOff.checked = carInfo.autoForward;

  localStorage.setItem("defaultOptions", JSON.stringify(carInfo));
}

function openOptionsPanel() {
  optionsPanel.style.display = "block";
}

function cancelOptions() {
  optionsPanel.style.display = "none";
}

function toggleHidden() {
  if (hiddenOnOff.checked) {
    hiddenCount.disabled = false;
  } else {
    hiddenCount.disabled = true;
  }
}

function toggleOutput(emoji) {
  switch (emoji) {
    case "🠉":
      output_forward.style.backgroundColor =
        output_forward.style.backgroundColor == "white"
          ? "gray"
          : "white";
      break;
    case "🠈":
      output_left.style.backgroundColor =
        output_left.style.backgroundColor == "white"
          ? "gray"
          : "white";
      break;
    case "🠊":
      output_right.style.backgroundColor =
        output_right.style.backgroundColor == "white"
          ? "gray"
          : "white";
      break;
    case "🠋":
      output_reverse.style.backgroundColor =
        output_reverse.style.backgroundColor == "white"
          ? "gray"
          : "white";
      break;
  }
}

function selectCar(index) {
  bestCar = cars[index];
  viewport.flyTo(bestCar, true);
  bestCar.resetControls();
  goingToSelect.value = bestCar.destination.name;
  manual = !bestCar.useBrain;
  manualBtn.style.backgroundColor = manual ? "blue" : "rgba(0,0,0,0)";
}

function followCar() {
  //followBestCar=true;
  viewport.flyTo(bestCar, true);
}

function toggleManual() {
  manual = !manual;
  bestCar.useBrain = !manual;
  bestCar.controls.forward = false;
  bestCar.controls.left = false;
  bestCar.controls.right = false;
  bestCar.controls.reverse = false;
  if (manual) {
    goingToSelect.style.pointerEvents = "none";
    goingToSelect.style.opacity = 0.5;
    bestCar.resetControls();
    bestCar.assignedBorders = [];
    bestCar.shortestPath = [];
    miniMap.destination = null;
  } else {
    changeTarget(goingToSelect);
    goingToSelect.style.pointerEvents = "";
    goToPanel.style.opacity = 1;
  }
  manualBtn.style.backgroundColor = manual ? "blue" : "rgba(0,0,0,0)";
}

function navToLink() {
  window.open(linkToVisit, "_blank");
}