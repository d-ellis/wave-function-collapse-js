let rules, currentDirection, currentTile;
const PATH = './textures/';

init();

async function init() {
  await getTextures();
  initNeighbourList();
  setCurrentTile(0);
  setDirection('north');
  addDirectionListeners();
}

async function getTextures() {
  const response = await fetch(PATH);
  const html = await response.text();
  const regex = /"(.+\.png)"/g;
  const matches = html.matchAll(regex);
  rules = [];
  for (const match of matches) {
    rules.push(
      {
        src: match[1],
        north: [],
        east: [],
        south: [],
        west: [],
      }
    );
    const img = document.createElement('img');
    img.src = PATH + match[1];
    const index = rules.length - 1;
    document.getElementById('textureList').appendChild(img);
    img.draggable = false;
    img.addEventListener('click', () => {
      setCurrentTile(index);
    })
  }
}

function initNeighbourList() {
  for (let t = 0; t < rules.length; t++) {
    const tile = document.createElement('img');
    tile.draggable = false;
    tile.classList.add('neighbour');
    tile.src = PATH + rules[t].src;
    document.getElementById('neighbourList').appendChild(tile);
    tile.addEventListener('click', () => {
      toggleTile(getTileDirectionList(), t);
      toggleTile(getOppositeDirection(t), rules.indexOf(currentTile));
      tile.classList.toggle('selected');
    })
  }
}

function addDirectionListeners() {
  const directions = document.querySelectorAll('.direction');
  for (const button of directions) {
    button.addEventListener('click', () => {
      setDirection(button.id);
    });
  }
}

function setDirection(direction) {
  currentDirection = direction;
  const directions = document.querySelectorAll('.direction');
  for (const button of directions) {
    if (button.id === direction) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  }
  updateNeighbourList();
}

function setCurrentTile(tileIndex) {
  currentTile = rules[tileIndex];
  document.getElementById('currentTile').src = PATH + currentTile.src;
  const textureList = document.getElementById('textureList');
  for (let i = 0; i < textureList.childNodes.length; i++) {
    const node = textureList.childNodes[i];
    node.classList.remove('selected');
  }
  textureList.childNodes[tileIndex].classList.add('selected');
  updateNeighbourList();
}

function updateNeighbourList() {
  const neighbourList = document.getElementById('neighbourList');
  for (let i = 0; i < neighbourList.childNodes.length; i++) {
    neighbourList.childNodes[i].classList.remove('selected');
  }
  const tiles = getTileDirectionList() || [];
  for (let i = 0; i < tiles.length; i++) {
    neighbourList.childNodes[tiles[i]].classList.add('selected');
  }
}

function getTileDirectionList() {
  switch (currentDirection) {
    case 'north':
      return currentTile.north;
      break;
    case 'east':
      return currentTile.east;
      break;
    case 'south':
      return currentTile.south;
      break;
    case 'west':
      return currentTile.west;
      break;
  }
}

function getOppositeDirection(tileIndex) {
  switch (currentDirection) {
    case 'north':
      return rules[tileIndex].south;
      break;
    case 'east':
      return rules[tileIndex].west;
      break;
    case 'south':
      return rules[tileIndex].north;
      break;
    case 'west':
      return rules[tileIndex].east;
      break;
  }
}

function toggleTile(list, value) {
  if (list.includes(value)) {
    const index = list.indexOf(value);
    list.splice(index, 1);
  } else {
    list.push(value);
    list.sort();
  }
}

document.getElementById('download').addEventListener('click', () => {
  let json = JSON.stringify(rules);
  json = [json];
  const blob = new Blob(json, { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  const link = URL.createObjectURL(blob);
  a.download = 'rules.json';
  a.href = link;
  a.click();
})
