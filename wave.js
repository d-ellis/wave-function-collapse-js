/*
  Times to beat:
  16:  755.35
  32:  10,677.8
  100: Crash

  Final times:
  16:  53.175
  32:  211.725
  100: 2179.625

  All times averaged over four runs
*/

let gridDOM = [];
let gridTiles = [];
let gridEntropy = [];
let rules = [];
let selectedTile = null;
document.body.addEventListener('click', (e) => {
  if (!e.target.classList.contains('grid-tile') && !e.target.classList.contains('unavailable') && !e.target.parentNode.classList.contains('unavailable')) {
    resetTileSelection();
  }
})

document.getElementById('init').addEventListener('click', init);
document.getElementById('iterate').addEventListener('click', iterate);
document.getElementById('complete').addEventListener('click', async () => {
  const s = performance.now();
  const size = gridTiles.length;
  while (!isComplete()) {
    await iterate(true);
  }
  let x = 0;
  while (x < size) {
    let y = 0;
    while (y < size) {
      gridDOM[x][y].src = `./textures/${rules[gridTiles[x][y][0]].src}`;
      y++;
    }
    x++;
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
  let x = 0;
  while (x < size) {
    gridDOM.push([]);
    gridTiles.push([]);
    gridEntropy.push([]);
    x++;
  }
  x = 0;
  while (x < size) {
    let y = 0;
    while (y < size) {
      const tile = document.createElement('img');
      tile.classList.add('grid-tile');
      gridDOM[x].push(tile);
      gridTiles[x].push(possibilities);
      gridEntropy[x].push(rules.length);
      tile.style.width = '100%';
      tile.style.height = '100%';
      container.appendChild(tile);
      y++;
    }
    x++;
  }
  addEventListeners();
}

function addEventListeners() {
  const reference = document.getElementById('comparison');
  const size = gridTiles.length;
  let x = 0;
  while (x < size) {
    let y = 0;
    while (y < size) {
      const thisX = x;
      const thisY = y;
      gridDOM[x][y].addEventListener('mouseenter', () => {
        const entropy = gridTiles[thisX][thisY].length;
        let t = 0;
        while (t < entropy) {
          const thisNode = reference.childNodes[gridTiles[thisX][thisY][t]];
          if (selectedTile === null) {
            thisNode.style.border = '2px solid green';
          }
          t++;
        }
      });
      gridDOM[x][y].addEventListener('mouseout', () => {
        const entropy = gridTiles[thisX][thisY].length;
        let t = 0;
        while (t < entropy) {
          const thisNode = reference.childNodes[gridTiles[thisX][thisY][t]];
          thisNode.style.border = '2px solid transparent';
          t++;
        }
      });
      gridDOM[x][y].addEventListener('click', () => {
        const selectedTiles = document.querySelectorAll('img.selected');
        let t = 0;
        while (t < selectedTiles) {
          selectedTiles[t].classList.remove('selected');
          t++;
        }
        gridDOM[thisX][thisY].classList.add('selected');
        prepSelection(thisX, thisY);
      });
      y++;
    }
    x++;
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
    const thisTile = t;
    tileContainer.addEventListener('click', () => {
      if (!tileContainer.classList.contains('unavailable')) {
        insertTile(thisTile);
      }
    });
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
  let i = 0;
  switch (direction) {
    case 0:
      while (i < gridTiles[current[0]][current[1]].length) {
        possibleNeighbours = possibleNeighbours.concat([...rules[gridTiles[current[0]][current[1]][i]].north]);
        i++;
      }
      break;
    case 1:
      while (i < gridTiles[current[0]][current[1]].length) {
        possibleNeighbours = possibleNeighbours.concat([...rules[gridTiles[current[0]][current[1]][i]].east]);
        i++;
      }
      break;
    case 2:
      while (i < gridTiles[current[0]][current[1]].length) {
        possibleNeighbours = possibleNeighbours.concat([...rules[gridTiles[current[0]][current[1]][i]].south]);
        i++;
      }
      break;
    case 3:
      while (i < gridTiles[current[0]][current[1]].length) {
        possibleNeighbours = possibleNeighbours.concat([...rules[gridTiles[current[0]][current[1]][i]].west]);
        i++;
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
    let o = 0;
    while (o < others.length) {
      // console.log(other);
      let isAdded = false;
      // Get the possible entries for the other cell
      let otherPossibilities = [...gridTiles[others[o][0]][others[o][1]]];
      // If the other cell is already set, skip
      if (otherPossibilities.length === 1) {
        o++;
        continue;
      }
      // Get all neighbour tiles allowed by current cell
      const possibleNeighbours = await getPossibleNeighbours(currentIndex, others[o]);
      // For every possibility of the other cell
      let i = 0;
      while (i < otherPossibilities.length) {
        const otherPossibility = otherPossibilities[i];
        // If it's not a possibility for this cells neighbours, remove from other cell
        if (!possibleNeighbours.includes(otherPossibility)) {
          const possibilityIndex = otherPossibilities.indexOf(otherPossibility);
          otherPossibilities.splice(possibilityIndex, 1);
          gridEntropy[others[o][0]][others[o][1]]--;
          i--;
          // If other isn't in stack already, add to stack
          if (!isAdded) {
            stack.push(others[o]);
            isAdded = true;
          }
        }
        i++;
      }
      gridTiles[others[o][0]][others[o][1]] = [...otherPossibilities];
      o++;
    }
  }
}

function isComplete() {
  const size = gridTiles.length;
  let x = 0;
  while (x < size) {
    let y = 0;
    while (y < size) {
      if (gridEntropy[x][y] !== 1) return false;
      y++;
    }
    x++;
  }
  return true;
}

function getRandomPossibility([x,y]) {
  return gridTiles[x][y][Math.floor(Math.random()*gridTiles[x][y].length)];
}

async function iterate(skipTiles = false) {
  // Find grid entry with lowest entropy
  const size = gridTiles.length;
  const index = [-1, -1];
  let lowestEntropy = Infinity;
  let x = 0;
  while (x < size) {
    let y = 0;
    while (y < size) {
      if (gridEntropy[x][y] < lowestEntropy && gridEntropy[x][y] > 1) {
        lowestEntropy = gridEntropy[x][y];
        index[0] = x;
        index[1] = y;
      }
      y++;
    }
    x++;
  }
  // Give entry random value
  gridTiles[index[0]][index[1]] = [getRandomPossibility(index)]; //[gridTiles[index[0]][index[1]][Math.floor(Math.random()*gridTiles[index[0]][index[1]].length)]];
  gridEntropy[index[0]][index[1]] = 1;
  // Update entropies
  await calculateEntropies(index);
  if (skipTiles === true) return;
  // Update all visuals
  x = 0;
  while (x < size) {
    let y = 0;
    while (y < size) {
      if (gridEntropy[x][y] === 1) {
        gridDOM[x][y].src = `./textures/${rules[gridTiles[x][y][0]].src}`;
      }
      y++;
    }
    x++;
  }
}

function prepSelection(x, y) {
  selectedTile = [x, y];
  const comparisonTiles = document.querySelectorAll('.tile-ref');
  let r = 0;
  while (r < rules.length) {
    if (gridTiles[x][y].includes(r)) {
      comparisonTiles[r].classList.add('available');
      comparisonTiles[r].classList.remove('unavailable');
    } else {
      comparisonTiles[r].classList.remove('available');
      comparisonTiles[r].classList.add('unavailable');
    }
    r++;
  }
}

function resetTileSelection() {
  selectedTile = null;
  const comparisonTiles = document.querySelectorAll('.tile-ref');
  let t = 0;
  while (t < comparisonTiles.length) {
    comparisonTiles[t].classList.remove('available');
    comparisonTiles[t].classList.remove('unavailable');
    t++;
  }
}

async function insertTile(choice) {
  gridTiles[selectedTile[0]][selectedTile[1]] = [choice];
  gridEntropy[selectedTile[0]][selectedTile[1]] = 1;
  gridDOM[selectedTile[0]][selectedTile[1]].src = `./textures/${rules[gridTiles[selectedTile[0]][selectedTile[1]][0]].src}`;

  await calculateEntropies(selectedTile);
  resetTileSelection();
}
