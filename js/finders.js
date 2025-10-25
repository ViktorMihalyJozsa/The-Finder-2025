/*  ========================================================================  *\

    F I N D E R S . J S

    A finders.js fájl tartalmazza a kereső játék logikáját és funkcióit.

    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    A fájl tartalmazza a következő funkciókat:

        - DOM elemek kiválasztása
        - Nehézségi beállítások definiálása
        - Mezők és játék állapotok kezelése
        - Segédfunkciók
        - Térkép és boolean map létrehozása
        - Mezők megjelenítése a játéktáblán
        - Játék kezdetének méretezése
        - Játék kezdete
        - Játék újraindítása
        - Nehézségi beállítások változtatása
        - Időzítő kezelése
        - Célok elhelyezése a térképen
        - Mezők keresése és számlálása
        - Számított mezőértékek
        - Felfedezetlen mezők felfedezése
        - Játék vége ellenőrzése
        - Játék kimenetei
        - Action-gomb állapotának frissítése
        - Célok megjelölve
        - Egér pozíció kiszámítása
        - Kattintás eseménykezelők
        - Mezők érvényessége
        - Képek betöltésének kezelése
        - DOM Content Loaded eseménykezelő

\*  ========================================================================  */

/*  ========================================================================  *\
      DOM ELEMEK KIVÁLASZTÁSA
\*  ========================================================================  */

const gameContainer = document.getElementById('gameContainer');
const controlPanel = document.getElementById('control-panel');
const actionButton = document.getElementById('main-action-button');
const markerCounter = document.getElementById('marker-counter');
const timeCounter = document.getElementById('time-counter');
const levelSelector = document.getElementById('level-selector');


/*  ========================================================================  *\
      NEHÉZSÉGI BEÁLLÍTÁSOK DEFINIÁLÁSA
\*  ========================================================================  */

/*
    Minden nehézségi szinthez definiáljuk:
        - sorok és oszlopok számát
        - teljes célpontszámot
        - mezőméret számításhoz használt divisor
        - célpontok értékének minimumát és maximumát
*/
const difficultySettings = {
    easy:   { columns: 8,  rows: 8,  targetCount: 10, divisor: 8,  minTargetValue: 1, maxTargetValue: 3 },
    medium: { columns: 10, rows: 10, targetCount: 20, divisor: 10, minTargetValue: 1, maxTargetValue: 5 },
    hard:   { columns: 12, rows: 12, targetCount: 30, divisor: 12, minTargetValue: 1, maxTargetValue: 8 }
};


/*  ========================================================================  *\
      MEZŐK ÉS JÁTÉK ÁLLAPOTOK KEZELÉSE
\*  ========================================================================  */

let size, columns, rows, targetCount;
let isGameOver = false;
let isFirstClick = true;
let exploredFields = 0;
let markerMap = [];
let map = [];
let exploredMap = [];
let remainingTargets = 0;
let timer = null;
let seconds = 0;


/*  ========================================================================  *\
      SEGÉDFUNKCIÓK
\*  ========================================================================  */

/* — Biztonságos vezérlőpanel szélesség kiszámítás — */
function safeControlPanelWidth() {
    const w = controlPanel && controlPanel.offsetWidth ? controlPanel.offsetWidth : Math.min(window.innerWidth, 600);
    return w;
}

/* — Mezőméret kiszámítása az aktuális ablak / panel szélesség alapján — */
function computeSizeFor(difficulty) {
    const div = difficultySettings[difficulty].divisor || 10;
    return Math.max(20, Math.floor(safeControlPanelWidth() / div)); // min. 20px
}

/* — Szám konvertálása 3 karakter hosszú sztringgé — */
const convertNumberTo3DigitString = (number) => {
    return number < 0 ? '🤡' : number.toString().padStart(3, '0');
};


/*  ========================================================================  *\
      TÉRKÉP ÉS BOOLEAN MAP LÉTREHOZÁSA
\*  ========================================================================  */

const createMap = () => Array.from({ length: rows }, () => Array(columns).fill(0));
const createBooleanMap = () => Array.from({ length: rows }, () => Array(columns).fill(false));


/*  ========================================================================  *\
      MEZŐK MEGJELENÍTÉSE A JÁTÉKTÁBLÁN
\*  ========================================================================  */

/* — Egy mező kirajzolása a játéktáblára — */
function drawField(row, col, className) {
    const field = document.createElement('div');
    field.className = `field ${className}`;
    field.dataset.row = row;
    field.dataset.col = col;
    field.style.position = 'absolute';
    field.style.left = `${col * size}px`;
    field.style.top = `${row * size}px`;
    field.style.width = `${size}px`;
    field.style.height = `${size}px`;
    gameContainer.appendChild(field);
}

/* — Térkép kirajzolása (teljes frissítés) — */
const drawMap = () => {
    if (!gameContainer) return;
    gameContainer.innerHTML = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const isExplored = exploredMap[r][c];
            const isMarked = markerMap[r][c];
            const field = map[r][c];

            if (!isExplored) {
                drawField(r, c, isMarked ? 'marker' : 'hidden');
            } else if (field && field.type === 'target') {
                drawField(r, c, 'target');
            } else if (field === 0) {
                drawField(r, c, 'number-0');
            } else {
                drawField(r, c, `number-${field}`);
            }
        }
    }
};


/*  ========================================================================  *\
      JÁTÉK KEZDETÉNEK MÉRETEZÉSE
\*  ========================================================================  */

function applyContainerSize() {
    if (!gameContainer) return;
    gameContainer.style.setProperty('--field-size', `${size}px`);
    gameContainer.style.width = `${columns * size}px`;
    gameContainer.style.height = `${rows * size}px`;
}


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

    updateActionButton('start');
    remainingTargets = targetCount;
    markerCounter.innerText = convertNumberTo3DigitString(remainingTargets);

    applyContainerSize();
    drawMap();
}


/*  ========================================================================  *\
      JÁTÉK ÚJRAINDÍTÁSA
\*  ========================================================================  */

function loadDefaultGame() {
    const settings = difficultySettings.easy;
    columns = settings.columns;
    rows = settings.rows;
    targetCount = settings.targetCount;
    size = computeSizeFor('easy');

    applyContainerSize();
    initGame();
}


/*  ========================================================================  *\
      NEHÉZSÉGI BEÁLLÍTÁSOK VÁLTOZTATÁSA
\*  ========================================================================  */

function setDifficulty(difficulty) {
    if (!difficultySettings[difficulty]) {
        console.warn('Ismeretlen nehézségi szint:', difficulty);
        return;
    }

    stopTimer();
    resetTimerDisplay();

    const settings = difficultySettings[difficulty];
    columns = settings.columns;
    rows = settings.rows;
    targetCount = settings.targetCount;
    size = computeSizeFor(difficulty);

    applyContainerSize();
    initGame();
}


/*  ========================================================================  *\
      IDŐZÍTŐ KEZELÉSE
\*  ========================================================================  */

function startTimer() {
    if (timer) return;
    timer = setInterval(() => {
        seconds = Math.min(seconds + 1, 960);
        timeCounter.innerText = convertNumberTo3DigitString(seconds);
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

function resetTimer() {
    stopTimer();
    seconds = 0;
    timeCounter.innerText = convertNumberTo3DigitString(seconds);
}

function resetTimerDisplay() {
    timeCounter.innerText = convertNumberTo3DigitString(0);
}


/*  ========================================================================  *\
      CÉLOK ELHELYEZÉSE A TÉRKÉPEN
\*  ========================================================================  */

const placeTargets = (mapRef, tCount, startRow, startCol) => {
    const { minTargetValue, maxTargetValue } = difficultySettings[levelSelector.value || 'easy'];
    let placed = 0;
    while (placed < tCount) {
        const x = Math.floor(Math.random() * columns);
        const y = Math.floor(Math.random() * rows);
        const already = mapRef[y][x] && mapRef[y][x].type === 'target';
        const tooClose = Math.abs(x - startCol) <= 1 && Math.abs(y - startRow) <= 1;
        if (!already && !tooClose) {
            mapRef[y][x] = { type: 'target', value: Math.floor(Math.random() * (maxTargetValue - minTargetValue + 1)) + minTargetValue };
            placed++;
        }
    }
};


/*  ========================================================================  *\
      MEZŐK KERESÉSE ÉS SZÁMLÁLÁSA
\*  ========================================================================  */

const findNeighbourFields = (mapRef, rowI, colI) => {
    const coords = [];
    for (let r = rowI - 1; r <= rowI + 1; r++) {
        for (let c = colI - 1; c <= colI + 1; c++) {
            const within = r >= 0 && r < rows && c >= 0 && c < columns;
            const notSelf = r !== rowI || c !== colI;
            if (within && notSelf) coords.push({ row: r, col: c });
        }
    }
    return coords;
};

function countTargets(mapRef, neighbours) {
    return neighbours.reduce((acc, { row, col }) => acc + ((mapRef[row][col] && mapRef[row][col].type === 'target') ? 1 : 0), 0);
}

function countMarkedNeighbours(coords) {
    return coords.reduce((acc, { row, col }) => acc + (markerMap[row][col] ? 1 : 0), 0);
}


/*  ========================================================================  *\
      SZÁMÍTOTT MEZŐÉRTÉKEK
\*  ========================================================================  */

function calculateFieldValues(mapRef) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (!mapRef[r][c] || mapRef[r][c].type !== 'target') {
                const neighbours = findNeighbourFields(mapRef, r, c);
                const tc = countTargets(mapRef, neighbours);
                mapRef[r][c] = tc;
            }
        }
    }
}


/*  ========================================================================  *\
      FELFEDEZETLEN MEZŐK FELFEDEZÉSE
\*  ========================================================================  */

function exploreField(startR, startC) {
    const stack = [{ row: startR, col: startC }];
    while (stack.length > 0) {
        const { row, col } = stack.pop();
        if (row < 0 || row >= rows || col < 0 || col >= columns) continue;
        if (exploredMap[row][col]) continue;
        if (markerMap[row][col]) continue;

        exploredMap[row][col] = true;
        exploredFields++;

        if (map[row][col] === 0) {
            const neighbours = findNeighbourFields(map, row, col);
            stack.push(...neighbours);
        }
    }
}


/*  ========================================================================  *\
      JÁTÉK VÉGE ELLENŐRZÉSE
\*  ========================================================================  */

function allTargetsMarkedCorrectly() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const cell = map[r][c];
            const isTarget = cell && cell.type === 'target';
            const isMarked = markerMap[r][c];
            if (isTarget && !isMarked) return false;
            if (!isTarget && isMarked) return false;
        }
    }
    return true;
}

function checkGameEnd(row, col) {
    const cell = map[row][col];
    if (cell && cell.type === 'target' && exploredMap[row][col]) {
        loseGame();
        return;
    }

    const allFieldsExplored = exploredFields === rows * columns - targetCount;
    const allTargetsMarked = allTargetsMarkedCorrectly();

    if (allFieldsExplored && allTargetsMarked) {
        winGame();
    }
}


/*  ========================================================================  *\
      JÁTÉK KIMENETEI
\*  ========================================================================  */

function winGame() {
    isGameOver = true;
    updateActionButton('won');
    stopTimer();
}

function loseGame() {
    isGameOver = true;
    updateActionButton('lost');
    revealExploredTarget();
    showWrongMarkers();
    showUnmarkedTargets();
    stopTimer();
}


/*  ========================================================================  *\
      ACTION-GOMB ÁLLAPOTÁNAK FRISSÍTÉSE
\*  ========================================================================  */

function updateActionButton(state) {
    actionButton.className = '';
    if (state === 'start') actionButton.classList.add('button-start');
    else if (state === 'won') actionButton.classList.add('button-won');
    else if (state === 'lost') actionButton.classList.add('button-lost');
}


/*  ========================================================================  *\
      CÉLOK MEGJELÖLVE
\*  ========================================================================  */

function revealExploredTarget() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const cell = map[r][c];
            if (cell && cell.type === 'target' && exploredMap[r][c]) {
                drawField(r, c, 'target');
            }
        }
    }
}

function showUnmarkedTargets() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const cell = map[r][c];
            if (cell && cell.type === 'target' && !markerMap[r][c] && !exploredMap[r][c]) {
                drawField(r, c, 'unmarked-target');
            }
        }
    }
}

function showWrongMarkers() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const cell = map[r][c];
            if (markerMap[r][c] && (!cell || cell.type !== 'target')) {
                drawField(r, c, 'incorrect-marker');
            }
        }
    }
}


/*  ========================================================================  *\
      EGÉR POZÍCIÓ KISZÁMÍTÁSA
\*  ========================================================================  */

function getMousePosition(event) {
    const rect = gameContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { row: Math.floor(y / size), col: Math.floor(x / size) };
}


/*  ========================================================================  *\
      KATTINTÁS ESEMÉNYKEZELŐK
\*  ========================================================================  */

if (gameContainer) {
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

    gameContainer.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        if (isGameOver) return;
        const { row, col } = getMousePosition(event);
        if (!isValidField(row, col)) return;

        if (exploredMap[row][col]) {
            const neighbours = findNeighbourFields(map, row, col);
            const markedNeighbours = countMarkedNeighbours(neighbours);
            if (markedNeighbours === map[row][col]) {
                for (let coord of neighbours) exploreField(coord.row, coord.col);
            }
        } else {
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
}


/*  ========================================================================  *\
      MEZŐK ÉRVÉNYESSÉGE
\*  ========================================================================  */

function isValidField(row, col) {
    return typeof row === 'number' && typeof col === 'number' && row >= 0 && row < rows && col >= 0 && col < columns;
}


/*  ========================================================================  *\
      KÉPEK BETÖLTÉSÉNEK KEZELÉSE
\*  ========================================================================  */

const imageFiles = [
    'images/wooden-background.webp',
    'images/logo.webp',
    'images/button-start.webp',
    'images/button-lost.webp',
    'images/button-won.webp',
    'images/counter.webp',
    'images/0.webp','images/1.webp','images/2.webp','images/3.webp','images/4.webp','images/5.webp','images/6.webp','images/7.webp','images/8.webp',
    'images/hidden.webp',
    'images/target.webp',
    'images/unmarked-target.webp',
    'images/marker.webp',
    'images/incorrect-marker.webp',
    'images/favicon.webp'
];

function whenAllImagesLoaded(onAllImagesLoaded, minDisplayMs = 5000) {
    const total = imageFiles.length;
    const percentEl = document.getElementById('loading-percentage');
    const overlay = document.getElementById('loading-overlay');
    const start = performance.now();
    let loaded = 0;

    function updatePercent() {
        const pct = total === 0 ? 100 : Math.round((loaded / total) * 100);
        percentEl.innerText = `${pct}%`;
    }

    if (total === 0) {
        const elapsed = performance.now() - start;
        const wait = Math.max(0, minDisplayMs - elapsed);
        setTimeout(() => {
            overlay.style.display = 'none';
            onAllImagesLoaded();
        }, wait);
        return;
    }

    imageFiles.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loaded++;
            updatePercent();
            const pct = Math.round((loaded / total) * 100);
            const circle = document.getElementById('circle-fg');
            if (circle) {
                const circumference = 2 * Math.PI * 45;
                const offset = Math.round(circumference - (pct / 100) * circumference);
                circle.style.strokeDashoffset = offset;
            }
        };
        img.src = src;
    });

    const poll = setInterval(() => {
        updatePercent();
        const elapsed = performance.now() - start;
        if (loaded >= total && elapsed >= minDisplayMs) {
            clearInterval(poll);
            overlay.style.display = 'none';
            onAllImagesLoaded();
        }
    }, 100);
}


/*  ========================================================================  *\
      DOM CONTENT LOADED ESEMÉNYKEZELŐ
\*  ========================================================================  */

document.addEventListener('DOMContentLoaded', () => {
    const startPreloader = () => whenAllImagesLoaded(() => loadDefaultGame(), 5000);

    if (typeof loadPageInto === 'function') {
        loadPageInto('#gameContainer', 'page/loading.html')
            .then(() => startPreloader())
            .catch(() => startPreloader());
    } else {
        startPreloader();
    }

    if (levelSelector) {
        levelSelector.addEventListener('change', function () {
            setDifficulty(this.value);
        });
    }

    if (actionButton) {
        actionButton.addEventListener('click', function () {
            const difficulty = levelSelector ? levelSelector.value : 'easy';
            if (difficulty) {
                setDifficulty(difficulty);
                stopTimer();
                resetTimer();
            } else {
                alert('Válassz nehézségi szintet a játék indítása előtt!');
            }
        });
    }
});


/*  ========================================================================  *\
      E N D   O F   F I N D E R S . J S
\*  ========================================================================  */
