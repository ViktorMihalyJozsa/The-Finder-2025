/*  ========================================================================  *\

    F I N D E R S . J S

    A finders.js fájl tartalmazza a kereső játék logikáját és funkcióit.

    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    A fájl tartalmazza a következő funkciókat:

        - DOM elemek - Játék tábla és vezérlő panelek
        - DOM elemek - Időzítő és jelölő gombok
        - Nehézségi beállítások
        - Mezők és játék állapotok
        - Játék kezdete
        - Játék újraindítása
        - Nehézségi beállítások változtatása
        - Mezők megjelenítése a játéktáblán
        - Nehézségi szint választás
        - Bal kattintás események
        - Jobb kattintás események
        - Mezők kattintás események
        - Mezők érvényessége
        - Játék vége ellenőrzése
        - Nyertes játék
        - Vesztes játék
        - Action-gomb állapotának frissítése
        - Célpontok megjelölve
        - Időzítő kezelése
        - Megtalált cél megjelenítése
        - Jelöletlen célok megjelenítése
        - Hibás jelölések megjelenítése
        - Feldezetlen mezők felfedezése
        - Számított mezőértékek
        - Számolja a mezők körül a célokat
        - Számolja meg a mezőket, amelyeket a játékos jelölt meg
        - Keresse meg a szomszédos mezőket
        - Helyezze el a célokat a térképen
        - Térkép és boolean mappa funkciók készítése
        - A számok konvertálása képes formátumba
        - A képek betöltésének kezelése
    
\*  ========================================================================  */

/*  ========================================================================  *\
      DOM ELEMEK - JÁTÉK TÁBLA ÉS VEZÉRLŐ PANELEK
\*  ========================================================================  */

const bodyWidth = document.body.clientWidth;
const bodyHeight = document.body.clientHeight;

const gameContainer = document.getElementById('gameContainer');
const controlPanel = document.getElementById('control-panel');
const controlPanelWidth = controlPanel.offsetWidth;


/*  ========================================================================  *\
      DOM ELEMEK - IDŐZÍTŐ ÉS JELÖLŐ GOMBOK
\*  ========================================================================  */

const actionButton = document.getElementById('main-action-button');
const markerCounter = document.getElementById('marker-counter');
const timeCounter = document.getElementById('time-counter');


/*  ========================================================================  *\
      NEHÉZSÉGI BEÁLLÍTÁSOK
\*  ========================================================================  */

const difficultySettings = {
  easy: {
    size: controlPanelWidth / 8,
    columns: 8,
    rows: 8,
    targetCount: 8
  },
  medium: {
    size: controlPanelWidth / 10,
    columns: 10,
    rows: 10,
    targetCount: 12
  },
  hard: {
    size: controlPanelWidth / 12,
    columns: 12,
    rows: 12,
    targetCount: 16
  }
};


/*  ========================================================================  *\
      MEZŐK ÉS JÁTÉK ÁLLAPOTOK
\*  ========================================================================  */

let size;              // A mezők mérete
let columns;           // A mezők oszlopainak száma
let rows;              // A mezők sorainak száma
let targetCount;       // A célpontok száma

let isGameOver;        // A játék véget ért-e
let isFirstClick;      // Az első kattintás megtörtént-e
let exploredFields;    // Felfedezett mezők száma
let markerMap;         // Jelölt mezők térképe
let map;               // Játéktábla térképe
let exploredMap;       // Felfedezett mezők térképe
let remainingTargets;  // Megmaradt célpontok száma
let timer;             // Időzítő az időméréshez
let seconds = 0;       // Az eltelt másodpercek száma


/*  ========================================================================  *\
      JÁTÉK KEZDETE
\*  ========================================================================  */

function initGame() {
  isGameOver = false;
  isFirstClick = true;
  exploredFields = 0;
  map = createMap();
  exploredMap = createBooleanMap();
  markerMap = createBooleanMap();

  // Gomb osztályának visszaállítása
  actionButton.className = ''; // Töröljük az összes osztályt
  actionButton.classList.add('button-start');

  remainingTargets = targetCount;
  markerCounter.innerText = convertNumberTo3DigitString(remainingTargets);

  drawMap();
}

/*  ========================================================================  *\
      JÁTÉK ÚJRAINDÍTÁSA
\*  ========================================================================  */

function loadDefaultGame() {
  const settings = difficultySettings['easy'];
  size = settings.size;
  columns = settings.columns;
  rows = settings.rows;
  targetCount = settings.targetCount;

  gameContainer.style.width = `${columns * size}px`;
  gameContainer.style.height = `${rows * size}px`;

  // Gomb osztályának visszaállítása
  actionButton.className = ''; // Töröljük az összes osztályt
  actionButton.classList.add('button-start');

  initGame();
}

/*  ========================================================================  *\
      NEHÉZSÉGI BEÁLLÍTÁSOK VÁLTOZTATÁSA
\*  ========================================================================  */

function setDifficulty(difficulty) {
  stopTimer();
  timeCounter.innerText = convertNumberTo3DigitString(0);

  const settings = difficultySettings[difficulty];
  size = settings.size;
  columns = settings.columns;
  rows = settings.rows;
  targetCount = settings.targetCount;

  gameContainer.style.width = `${columns * size}px`;
  gameContainer.style.height = `${rows * size}px`;

  initGame();
}

/*  ========================================================================  *\
      MEZŐK MEGJELENÍTÉSE A JÁTÉKTÁBLÁN
\*  ========================================================================  */

function drawField(row, col, className) {
  const field = document.createElement('div');
  field.className = `field ${className}`;
  field.style.left = `${col * size}px`;
  field.style.top = `${row * size}px`;
  gameContainer.appendChild(field);
}

// Példa a mezőméret dinamikus beállítására
function setFieldSize() {
  gameContainer.style.setProperty('--field-size', `${size}px`);
}

// Hívás a megfelelő helyen
setFieldSize();


/*  ========================================================================  *\
      NEHÉZSÉGI SZINT VÁLASZTÁS
\*  ========================================================================  */

const levelSelector = document.getElementById('level-selector');
if (levelSelector) {
  levelSelector.addEventListener('change', function () {
    const difficulty = this.value;
    setDifficulty(difficulty);
  });
} 
else {
  console.error('Level selector element not found!');
}

if (actionButton) {
  actionButton.addEventListener('click', function () {
    if (levelSelector) {
      const difficulty = levelSelector.value;
      if (difficulty) {
        setDifficulty(difficulty);
        stopTimer();
        timeCounter.innerText = convertNumberTo3DigitString(0);
      } 
      else {
        alert('Please select a difficulty level before starting the game!');
      }
    }
  });
} 
else {
  console.error('Action button element not found!');
}


/*  ========================================================================  *\
      BAL KATTINTÁS ESEMÉNYEK
\*  ========================================================================  */

gameContainer.addEventListener('click', function (event) {
  if (isGameOver) return;

  const { row, col } = getMousePosition(event);
  if (!isValidField(row, col)) return;

  if (isFirstClick) {
    placeTargets(map, targetCount, row, col);
    calculateFieldValues(map);
    isFirstClick = false;
    startTimer();
  }

  exploreField(row, col);
  drawMap();
  checkGameEnd(row, col);
});


/*  ========================================================================  *\
      JOBB KATTINTÁS ESEMÉNYEK
\*  ========================================================================  */

gameContainer.addEventListener('contextmenu', function (event) {
  event.preventDefault();
  if (isGameOver) return;

  const { row, col } = getMousePosition(event);
  if (!isValidField(row, col)) return;

  if (exploredMap[row][col]) {
    const neighbourCoordinates = findNeighbourFields(map, row, col);
    let markedNeighbours = countMarkedNeighbours(neighbourCoordinates);
    if (markedNeighbours === map[row][col]) {
      for (let coordinate of neighbourCoordinates) {
        exploreField(coordinate.row, coordinate.col);
      }
    }
  } 
  else {
    markerMap[row][col] = !markerMap[row][col];
    remainingTargets += markerMap[row][col] ? -1 : 1;
    markerCounter.innerText = convertNumberTo3DigitString(remainingTargets);
  }

  drawMap();
  checkGameEnd(row, col);
  if (isGameOver) {
    showWrongMarkers();
    stopTimer();
  }
});


/*  ========================================================================  *\
      MEZŐK KATTINTÁS ESEMÉNYEK
\*  ========================================================================  */

// Kiszámítja az egér pozícióját a tábla mezői alapján
function getMousePosition(event) {
  const rect = gameContainer.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const col = Math.floor(x / size);
  const row = Math.floor(y / size);

  return { row, col };
}


/*  ========================================================================  *\
      MEZŐK ÉRVÉNYESSÉGE
\*  ========================================================================  */

// Ellenőrzi, hogy a mező érvényes-e a játéktáblán
function isValidField(row, col) {
  return row >= 0 && row < rows && col >= 0 && col < columns;
}


/*  ========================================================================  *\
      JÁTÉK VÉGE ELLENŐRZÉSE
\*  ========================================================================  */

function checkGameEnd(row, col) {
  // Ellenőrizzük, hogy a játékos veszített-e
  if (map[row][col] === 'target' && exploredMap[row][col]) {
    loseGame();
    return;
  }

  // Ellenőrizzük, hogy a játékos nyert-e
  const allFieldsExplored = exploredFields === rows * columns - targetCount;
  const allTargetsMarked = allTargetsMarkedCorrectly();

  if (allFieldsExplored && allTargetsMarked) {
    winGame();
  }
}

/*  ========================================================================  *\
      NYERTES JÁTÉK
\*  ========================================================================  */

function winGame() {
  isGameOver = true;

  // Gomb állapotának frissítése
  updateActionButton('won');

  // Időzítő leállítása
  stopTimer();
}

/*  ========================================================================  *\
      VESZTES JÁTÉK
\*  ========================================================================  */

function loseGame() {
  isGameOver = true;

  // Gomb állapotának frissítése
  updateActionButton('lost');

  // Felrobbant aknák megjelenítése
 revealExploredTarget();

  // Hibás jelölések és meg nem talált aknák megjelenítése
  showWrongMarkers();
  showUnmarkedTargets();

  // Időzítő leállítása
  stopTimer();
}


/*  ========================================================================  *\
      ACTION-GOMB ÁLLAPOTÁNAK FRISSÍTÉSE
\*  ========================================================================  */

// Frissíti a gomb állapotát a játék állapota alapján
function updateActionButton(state) {
  actionButton.className = ''; // Töröljük az összes osztályt
  if (state === 'start') {
    actionButton.classList.add('button-start');
  } 
  else if (state === 'won') {
    actionButton.classList.add('button-won');
  } 
  else if (state === 'lost') {
    actionButton.classList.add('button-lost');
  }
}


/*  ========================================================================  *\
      CÉLPONTOK MEGJELÖLVE
\*  ========================================================================  */

function allTargetsMarkedCorrectly() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const isTarget = map[row][col] === 'target';
      const isMarked = markerMap[row][col];

      // Ha egy célpont nincs megjelölve
      if (isTarget && !isMarked) {
        return false;
      }

      // Ha egy nem célpont tévesen meg van jelölve
      if (!isTarget && isMarked) {
        return false;
      }
    }
  }
  return true; // Minden célpont helyesen meg van jelölve
}


/*  ========================================================================  *\
      IDŐZÍTŐ KEZELÉSE
\*  ========================================================================  */

function startTimer() {
  // Ellenőrizzük, hogy az időmérő már fut-e
  if (timer) return;

  // Indítjuk az időmérőt, maximum 960 másodpercig(16perc)
  timer = setInterval(() => {
    seconds = Math.min(seconds + 1, 960);
    timeCounter.innerText = convertNumberTo3DigitString(seconds);
  }, 1000);
}

function stopTimer() {
  // Leállítjuk az időmérőt
  clearInterval(timer);
  timer = null; // Időzítő nullázása
}

function resetTimer() {
  // Nullázzuk az időmérőt
  stopTimer();
  seconds = 0;
  timeCounter.innerText = convertNumberTo3DigitString(seconds);
}


/*  ========================================================================  *\
      MEGTALÁLT CÉL MEGJELENÍTÉSE
\*  ========================================================================  */

function revealExploredTarget() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (map[row][col] === 'target' && exploredMap[row][col]) {
        drawField(row, col, 'target');
      }
    }
  }
}


/*  ========================================================================  *\
      JELÖLETLEN CÉLOK MEGJELENÍTÉSE
\*  ========================================================================  */

function showUnmarkedTargets() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const isTarget = map[row][col] === 'target';
      const isNotMarked = !markerMap[row][col];
      const isNotExplored = !exploredMap[row][col];

      if (isTarget && isNotMarked && isNotExplored) {
        drawField(row, col, 'unmarked-target'); // Meg nem talált akna
      }
    }
  }
}

/*  ========================================================================  *\
      HIBÁS JELÖLÉSEK MEGJELENÍTÉSE
\*  ========================================================================  */

function showWrongMarkers() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const isMarked = markerMap[row][col];
      const isNotTarget = map[row][col] !== 'target';

      if (isMarked && isNotTarget) {
        drawField(row, col, 'incorrect-marker'); // Hibás jelölés
      }
    }
  }
}


/*  ========================================================================  *\
      FELDEZETLEN MEZŐK FELFEDEZÉSE
\*  ========================================================================  */

function exploreField(row, col) {
  // Ellenőrizzük, hogy a mező már felfedezett-e
  const stack = [{ row, col }];

  while (stack.length > 0) {
    const { row, col } = stack.pop();

    // Ellenőrizzük, hogy a mező érvényes-e
    const isOutOfBounds = row < 0 || row >= map.length || col < 0 || col >= map[0].length;
    if (isOutOfBounds) continue;

    const isAlreadyExplored = exploredMap[row][col];
    const isMarked = markerMap[row][col];
    if (isAlreadyExplored || isMarked) continue;

    // Jelöljük meg a mezőt felfedezettként
    exploredFields++;
    exploredMap[row][col] = true;

    // Ha a mező üres (0), fedezzük fel a szomszédos mezőket
    if (map[row][col] === 0) {
      const neighbours = findNeighbourFields(map, row, col);
      stack.push(...neighbours);
    }
  }
}


/*  ========================================================================  *\
      SZÁMÍTOTT MEZŐÉRTÉKEK
\*  ========================================================================  */

function calculateFieldValues(map) {
  // Végigmegyünk minden mezőn, és megszámoljuk a szomszédos célpontokat
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const isTarget = map[row][col] === 'target';

      // Csak akkor számolunk, ha a mező nem célpont
      if (!isTarget) {
        const neighbours = findNeighbourFields(map, row, col);
        const targetCount = countTargets(map, neighbours);
        map[row][col] = targetCount;
      }
    }
  }
}

/*  ========================================================================  *\
      SZÁMOLJA A MEZŐK KÖRÜL A CÉLOKAT
\*  ========================================================================  */

function countTargets(map, neighbours) {
  // Visszatér a célpontok számával a megadott szomszédos koordinátákon
  return neighbours.reduce((count, { row, col }) => {
    return count + (map[row][col] === 'target' ? 1 : 0);
  }, 0);
}


/*  ========================================================================  *\
      SZÁMOLJA MEG A MEZŐKET, AMELYEKET A JÁTÉKOS JELÖLT MEG
\*  ========================================================================  */

function countMarkedNeighbours(coordinates) {
  // Megszámolja, hány mezőt jelölt meg a játékos a megadott szomszédok közül
  return coordinates.reduce((count, { row, col }) => {
    return count + (markerMap[row][col] ? 1 : 0);
  }, 0);
}

/*  ========================================================================  *\
      KERESSE MEG A SZOMSZÉDOS MEZŐKET
\*  ========================================================================  */

const findNeighbourFields = (map, rowI, colI) => {
  const neighbourCoordinates = [];
  for (let row = rowI - 1; row <= rowI + 1; row++) {
    for (let col = colI - 1; col <= colI + 1; col++) {
      const isWithinBounds = row >= 0 && row < rows && col >= 0 && col < columns;
      const isNotSelf = row !== rowI || col !== colI;

      if (isWithinBounds && isNotSelf) {
        neighbourCoordinates.push({ row, col });
      }
    }
  }
  return neighbourCoordinates;
};


/*  ========================================================================  *\
      HELYEZZE EL A CÉLOKAT A TÉRKÉPEN
\*  ========================================================================  */

const placeTargets = (map, targetCount, startRow, startCol) => {
  let placedTargets = 0;

  while (placedTargets < targetCount) {
    const x = Math.floor(Math.random() * columns);
    const y = Math.floor(Math.random() * rows);

    const isAlreadyTarget = map[y][x] === 'target';
    const isTooCloseToStart = Math.abs(x - startCol) <= 1 && Math.abs(y - startRow) <= 1;

    if (!isAlreadyTarget && !isTooCloseToStart) {
      map[y][x] = 'target';
      placedTargets++;
    }
  }
};


/*  ========================================================================  *\
      TÉRKÉP ÉS BOOLEAN MAPPA FUNKCIOK KÉSZÍTÉSE
\*  ========================================================================  */

const createMap = () => Array.from({ length: rows }, () => Array(columns).fill(0));

const createBooleanMap = () => Array.from({ length: rows }, () => Array(columns).fill(false));

const drawMap = () => {
  gameContainer.innerHTML = '';  // Töröljük a korábbi mezőket
  for (let rowI = 0; rowI < rows; rowI++) {
    for (let colI = 0; colI < columns; colI++) {
      const isExplored = exploredMap[rowI][colI];
      const isMarked = markerMap[rowI][colI];
      const field = map[rowI][colI];

      if (!isExplored) {                           // Felfedezetlen mező
        drawField(rowI, colI, isMarked ? 'marker' : 'hidden');
      } 
      else if (field === 'target') {               // Célpont mező
        drawField(rowI, colI, 'target');
      } 
      else if (field === 0) {
        drawField(rowI, colI, 'number-0');         // Üres mező
      } 
      else {
        drawField(rowI, colI, `number-${field}`);  // Számok
      }
    }
  }
};

function drawField(row, col, className) {
  const field = document.createElement('div');
  field.className = `field ${className}`;
  field.style.position = 'absolute';
  field.style.left = `${col * size}px`;
  field.style.top = `${row * size}px`;
  field.style.width = `${size}px`;
  field.style.height = `${size}px`;
  gameContainer.appendChild(field);
}

/*  ========================================================================  *\
      A SZÁMOK KONVERTÁLÁSA KÉPES FORMÁTUMBA
\*  ========================================================================  */

const convertNumberTo3DigitString = (number) => {
  return number < 0 ? '🤡' : number.toString().padStart(3, '0');
};

/*  ========================================================================  *\
      A KÉPEK BETÖLTÉSÉNEK KEZELÉSE
\*  ========================================================================  */

// Ez a függvény megvárja, amíg az összes kép betöltődik, és csak utána hívja meg a paraméterként kapott másik függvényt.
// Az első paraméter a meghívandó függvény, a második paraméter a betöltési idő, ami 0-ról indul.
function whenAllImagesLoaded(onAllImagesLoaded, loadTime = 0) {
  const imageCount = Object.values(images).length; // az összes kép száma
  let loadedImages = 0; // azoknak a képeknek a száma, amik már betöltődtek
  
  for (let image of Object.values(images)) { // végigmegyünk az összes képen
    if (image.complete) { // ha a kép betöltődött
      loadedImages++; // növeljük a betöltött képek számát
    }
  }

  // ha még nem töltődött be minden kép, és még nem telt el 3 másodperc
  if (loadedImages < imageCount && loadTime < 3000) { 
    console.log('Waiting for images to load'); // kiírjuk, hogy várunk a képekre
    setTimeout(() => { // 100ms múlva újra meghívjuk ezt a függvényt
      whenAllImagesLoaded(onAllImagesLoaded, loadTime + 100); // a betöltési időt 100ms-al növeljük
    }, 100);
  }
  if (loadTime >= 3000) { // ha már eltelt 3 másodperc
    console.log('Images could not be loaded'); // kiírjuk, hogy nem sikerült betölteni a képeket
    onAllImagesLoaded(); // de ettől még elindítjuk a játékot
  } else if (imageCount === loadedImages) { // különben ha minden kép betöltődött
    onAllImagesLoaded(); // meghívjuk a paraméterként kapott függvényt
  }
}

// Az oldal betöltésekor először megvárjuk, hogy az összes kép betöltődjön
window.addEventListener('DOMContentLoaded', () => {
  whenAllImagesLoaded(() => {
    loadDefaultGame(); // csak akkor indítjuk el a játékot, ha minden kép betöltődött
  });
});

/* ======================================================================== *\
   E N D   O F   F I N D E R S . J S
\* ======================================================================== */