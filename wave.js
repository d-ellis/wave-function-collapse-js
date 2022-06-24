let gridDOM = [];
let gridTiles = [];
let gridEntropy = [];
let rules = [];

document.getElementById('init').addEventListener('click', init);
document.getElementById('iterate').addEventListener('click', iterate);
document.getElementById('complete').addEventListener('click', async () => {
  const s = performance.now();
  while (!isComplete()) {
    await iterate();
  }
  const e = performance.now();
  console.log(`Time taken: ${e - s}ms`);
})

async function init() {
  // Load rules
  const response = await fetch('./rules.json');
  rules = await response.json();
  showComparison();

  // Get grid details
  const container = document.getElementById('output');
  const size = document.getElementById('size').value;
  container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
  // Remove any existing tiles
  while (container.firstChild) {
    container.removeChild(container.lastChild);
  }
  gridDOM = [];
  gridTiles = [];
  gridEntropy = [];
  const possibilities = [];
  for (let i = 0; i < rules.length; i++) {
    possibilities.push(i);
  }

  // Create new elements
  for (let x = 0; x < size; x++) {
    gridDOM.push([]);
    gridTiles.push([]);
    gridEntropy.push([]);
  }
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const tile = document.createElement('img');
      gridDOM[x].push(tile);
      gridTiles[x].push(possibilities);
      gridEntropy[x].push(rules.length);
      tile.style.width = '100%';
      tile.style.height = '100%';
      container.appendChild(tile);
    }
  }
  addEventListeners();
}

function addEventListeners() {
  const reference = document.getElementById('comparison');
  const size = gridTiles.length;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      gridDOM[x][y].addEventListener('mouseenter', () => {
        const entropy = gridTiles[x][y].length;
        for (let t = 0; t < entropy; t++) {
          reference.childNodes[gridTiles[x][y][t]].style.border = '2px solid green';
        }
      })
      gridDOM[x][y].addEventListener('mouseout', () => {
        const entropy = gridTiles[x][y].length;
        for (let t = 0; t < entropy; t++) {
          reference.childNodes[gridTiles[x][y][t]].style.border = '2px solid transparent';
        }
      })
    }
  }
}

function showComparison() {
  const container = document.getElementById('comparison');
  while (container.firstChild) {
    container.removeChild(container.lastChild);
  }
  for (let t = 0; t < rules.length; t++) {
    const current = rules[t];
    const tileContainer = document.createElement('div');
    tileContainer.classList.add('tile-ref');
    container.appendChild(tileContainer);

    const tile = document.createElement('img');
    tile.style.gridArea = 'tile';
    tile.src = `./textures/${current.src}`;

    const north = document.createElement('div');
    north.style.gridArea = 'north';
    north.textContent = current.north.length;
    const east = document.createElement('div');
    east.style.gridArea = 'east';
    east.textContent = current.east.length;
    const south = document.createElement('div');
    south.style.gridArea = 'south';
    south.textContent = current.south.length;
    const west = document.createElement('div');
    west.style.gridArea = 'west';
    west.textContent = current.west.length;

    tileContainer.appendChild(tile);
    tileContainer.appendChild(north);
    tileContainer.appendChild(east);
    tileContainer.appendChild(south);
    tileContainer.appendChild(west);
  }
}

/*
  Given an index coordinate, what are all coordinates that directly connect
*/
function getValidDirections(index) {
  const size = gridTiles.length;
  const directions = [];
  if (index[0] < size - 1) {
    // East
    directions.push([index[0] + 1, index[1]]);
  }
  if (index[0] > 0) {
    // West
    directions.push([index[0] - 1, index[1]]);
  }
  if (index[1] < size - 1) {
    // South
    directions.push([index[0], index[1] + 1]);
  }
  if (index[1] > 0) {
    // North
    directions.push([index[0], index[1] - 1]);
  }
  //console.log(directions);
  return directions;
}

function getPossibleNeighbours(current, other) {
  /*
    Get direction of other from current
    N = 0
    E = 1
    S = 2
    W = 3
  */
  let direction;
  if (other[1] === current[1] - 1) {
    direction = 0;
  }
  if (other[0] === current[0] + 1) {
    direction = 1;
  }
  if (other[1] === current[1] + 1) {
    direction = 2;
  }
  if (other[0] === current[0] - 1) {
    direction = 3;
  }

  let possibleNeighbours = [];
  switch (direction) {
    case 0:
      for (let i = 0; i < gridTiles[current[0]][current[1]].length; i++) {
        possibleNeighbours = possibleNeighbours.concat([...rules[gridTiles[current[0]][current[1]][i]].north]);
      }
      break;
    case 1:
      for (let i = 0; i < gridTiles[current[0]][current[1]].length; i++) {
        possibleNeighbours = possibleNeighbours.concat([...rules[gridTiles[current[0]][current[1]][i]].east]);
      }
      break;
    case 2:
      for (let i = 0; i < gridTiles[current[0]][current[1]].length; i++) {
        possibleNeighbours = possibleNeighbours.concat([...rules[gridTiles[current[0]][current[1]][i]].south]);
      }
      break;
    case 3:
      for (let i = 0; i < gridTiles[current[0]][current[1]].length; i++) {
        possibleNeighbours = possibleNeighbours.concat([...rules[gridTiles[current[0]][current[1]][i]].west]);
      }
      break;
  }
  return [...new Set(possibleNeighbours)];

}

async function calculateEntropies(index) {
  // Complex entropy calculation here
  // Create stack of co-ordinates
  const stack = [index];
  // Loop until stack is empty
  while (stack.length > 0) {
    const currentIndex = stack.pop();
    // Check cell in every valid direction
    const others = await getValidDirections(currentIndex);
    for (const other of others) {
      // console.log(other);
      let isAdded = false;
      // Get the possible entries for the other cell
      let otherPossibilities = [...gridTiles[other[0]][other[1]]];
      // If the other cell is already set, skip
      if (otherPossibilities.length === 1) continue;
      // Get all neighbour tiles allowed by current cell
      const possibleNeighbours = await getPossibleNeighbours(currentIndex, other);
      // For every possibility of the other cell
      for (let i = 0; i < otherPossibilities.length; i++) {
        const otherPossibility = otherPossibilities[i];
        // If it's not a possibility for this cells neighbours, remove from other cell
        if (!possibleNeighbours.includes(otherPossibility)) {
          const possibilityIndex = otherPossibilities.indexOf(otherPossibility);
          otherPossibilities.splice(possibilityIndex, 1);
          gridEntropy[other[0]][other[1]]--;
          i--;
          // If other isn't in stack already, add to stack
          if (!isAdded) {
            stack.push(other);
            isAdded = true;
          }
        }
      }
      gridTiles[other[0]][other[1]] = [...otherPossibilities];
    }
  }
}

function isComplete() {
  const size = gridTiles.length;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (gridEntropy[x][y] !== 1) return false;
    }
  }
  return true;
}

function getRandomPossibility([x,y]) {
  return gridTiles[x][y][Math.floor(Math.random()*gridTiles[x][y].length)];
}

async function iterate() {
  // Find grid entry with lowest entropy
  const size = gridTiles.length;
  const index = [-1, -1];
  let lowestEntropy = Infinity;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (gridEntropy[x][y] < lowestEntropy && gridEntropy[x][y] > 1) {
        lowestEntropy = gridEntropy[x][y];
        index[0] = x;
        index[1] = y;
      }
    }
  }
  // Give entry random value
  gridTiles[index[0]][index[1]] = [getRandomPossibility(index)]; //[gridTiles[index[0]][index[1]][Math.floor(Math.random()*gridTiles[index[0]][index[1]].length)]];
  gridEntropy[index[0]][index[1]] = 1;
  // Update entropies
  await calculateEntropies(index);
  // Update all visuals
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (gridEntropy[x][y] === 1) {
        gridDOM[x][y].src = `./textures/${rules[gridTiles[x][y][0]].src}`;
      }
    }
  }
}
