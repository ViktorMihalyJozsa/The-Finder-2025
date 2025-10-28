/*  ========================================================================  *\

    F I N D E R S . J S
    A finders.js fájl tartalmazza a kereső játék logikáját és funkcióit.

\*  ========================================================================  */

/*  ========================================================================  *\

      T A R T A L O M J E G Y Z É K
      1. DOM ELEMEK KIVÁLASZTÁSA ÉS LÉTREHOZÁSA
      2. NEHÉZSÉGI BEÁLLÍTÁSOK DEFINIÁLÁSA
      3. MEZŐK ÉS JÁTÉK ÁLLAPOTOK KEZELÉSE
      4. SEGÉDFUNKCIÓK
      5. TÉRKÉP ÉS BOOLEAN MAP LÉTREHOZÁSA
      6. MEZŐK MEGJELENÍTÉSE A JÁTÉKTÁBLÁN
      7. JÁTÉK KEZDETÉNEK MÉRETEZÉSE
      8. JÁTÉK KEZDETE
      9. JÁTÉK ÚJRAINDÍTÁSA
      10. NEHÉZSÉGI BEÁLLÍTÁSOK VÁLTOZTATÁSA
      11. IDŐZÍTŐ KEZELÉSE
      12. CÉLOK ELHELYEZÉSE A TÉRKÉPEN
      13. MEZŐK KERESÉSE ÉS SZÁMLÁLÁSA
      14. SZÁMÍTOTT MEZŐÉRTÉKEK
      15. FELFEDEZETLEN MEZŐK FELFEDEZÉSE
      16. JÁTÉK VÉGE ELLENŐRZÉSE
      17. JÁTÉK KIMENETEI
      18. ACTION-GOMB ÁLLAPOTÁNAK FRISSÍTÉSE
      19. CÉLOK ÉS MARADÉK MEZŐK MEGJELENÍTÉSE
      20. EGÉR POZÍCIÓ KISZÁMÍTÁSA
      21. KATTINTÁS ESEMÉNYKEZELŐK
      22. MEZŐK ÉRVÉNYESSÉGE
      23. KÉPEK BETÖLTÉSÉNEK KEZELÉSE
      24. LENYÍLÓ MENÜ KEZELÉSE
      25. DOM CONTENT LOADED ESEMÉNYKEZELŐ
      
\*  ========================================================================  */

/*  ========================================================================  *\
      1. DOM ELEMEK KIVÁLASZTÁSA ÉS LÉTREHOZÁSA
      A játékhoz szükséges DOM elemeket kiválasztjuk, és létrehozzuk a 
      #dropdown-content elemet dinamikusan.
\*  ========================================================================  */

const gameContainer = document.getElementById('gameContainer');
const controlPanel = document.getElementById('control-panel');
const actionButton = document.getElementById('main-action-button');
const markerCounter = document.getElementById('marker-counter');
const timeCounter = document.getElementById('time-counter');
const gameInfo = document.getElementById('game-info');
const levelSelector = document.getElementById('level-selector');

// Dinamikusan létrehozzuk a #dropdown-content elemet
function createDropdownContent() {
    const dropdownContent = document.createElement('div');
    dropdownContent.id = 'dropdown-content';
    dropdownContent.className = 'dropdown-content ui-element';
    // A #gameContainer pozíciójához igazítjuk
    const rect = gameContainer.getBoundingClientRect();
    dropdownContent.style.position = 'absolute';
    dropdownContent.style.left = `${rect.left + window.scrollX}px`;
    dropdownContent.style.top = `${rect.top + window.scrollY}px`;
    dropdownContent.style.width = `${gameContainer.offsetWidth}px`;
    dropdownContent.style.height = `${gameContainer.offsetHeight}px`;
    dropdownContent.style.opacity = '0';
    dropdownContent.style.transform = 'scale(0.8)';
    dropdownContent.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
    document.body.appendChild(dropdownContent);
    return dropdownContent;
}

const dropdownContent = createDropdownContent();

// A #main-action-button kezdetben nem kattintható
if (actionButton) {
    actionButton.classList.add('loading');
}

/*  ========================================================================  *\
      2. NEHÉZSÉGI BEÁLLÍTÁSOK DEFINIÁLÁSA
      A játék nehézségi szintjeinek beállításai (oszlopok, sorok, célok száma).
\*  ========================================================================  */

const difficultySettings = {
    easy:   { columns: 8,  rows: 8,  targetCount: 10, divisor: 8,  minTargetValue: 1, maxTargetValue: 3 },
    medium: { columns: 10, rows: 10, targetCount: 20, divisor: 10, minTargetValue: 1, maxTargetValue: 5 },
    hard:   { columns: 12, rows: 12, targetCount: 30, divisor: 12, minTargetValue: 1, maxTargetValue: 8 }
};

/*  ========================================================================  *\
      3. MEZŐK ÉS JÁTÉK ÁLLAPOTOK KEZELÉSE
      A játék állapotváltozói, mint a méret, oszlopok, sorok, célok száma.
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
let isLoading = true; // Betöltési állapot nyomon követése

/*  ========================================================================  *\
      4. SEGÉDFUNKCIÓK
      Segédfunkciók a vezérlőpanel szélességéhez, mezőméret kiszámításához és 
      számformázáshoz.
\*  ========================================================================  */

function safeControlPanelWidth() {
    const w = controlPanel && controlPanel.offsetWidth ? controlPanel.offsetWidth : Math.min(window.innerWidth, 600);
    return w;
}

function computeSizeFor(difficulty) {
    const div = difficultySettings[difficulty].divisor || 10;
    return Math.max(20, Math.floor(safeControlPanelWidth() / div));
}

const convertNumberTo3DigitString = (number) => {
    return number < 0 ? '🤡' : number.toString().padStart(3, '0');
};

/*  ========================================================================  *\
      5. TÉRKÉP ÉS BOOLEAN MAP LÉTREHOZÁSA
      A játéktábla és a logikai térképek inicializálása.
\*  ========================================================================  */

const createMap = () => Array.from({ length: rows }, () => Array(columns).fill(0));
const createBooleanMap = () => Array.from({ length: rows }, () => Array(columns).fill(false));

/*  ========================================================================  *\
      6. MEZŐK MEGJELENÍTÉSE A JÁTÉKTÁBLÁN
      A játéktábla mezőinek kirajzolása a #gameContainer-be.
\*  ========================================================================  */

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
      7. JÁTÉK KEZDETÉNEK MÉRETEZÉSE
      A játéktábla méretének beállítása a nehézségi szint alapján.
\*  ========================================================================  */

function applyContainerSize() {
    if (!gameContainer) return;
    gameContainer.style.setProperty('--field-size', `${size}px`);
    gameContainer.style.width = `${columns * size}px`;
    gameContainer.style.height = `${rows * size}px`;
    // Frissítjük a #dropdown-content pozícióját
    const rect = gameContainer.getBoundingClientRect();
    dropdownContent.style.left = `${rect.left + window.scrollX}px`;
    dropdownContent.style.top = `${rect.top + window.scrollY}px`;
    dropdownContent.style.width = `${gameContainer.offsetWidth}px`;
    dropdownContent.style.height = `${gameContainer.offsetHeight}px`;
}

/*  ========================================================================  *\
      8. JÁTÉK KEZDETE
      A játék inicializálása az alapértelmezett beállításokkal.
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
      9. JÁTÉK ÚJRAINDÍTÁSA
      Az alapértelmezett játék betöltése "easy" nehézségi szinttel.
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
      10. NEHÉZSÉGI BEÁLLÍTÁSOK VÁLTOZTATÁSA
      A nehézségi szint váltása a játék újraindításával.
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
      11. IDŐZÍTŐ KEZELÉSE
      Az időzítő indítása, leállítása és visszaállítása.
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
      12. CÉLOK ELHELYEZÉSE A TÉRKÉPEN
      A célpontok véletlenszerű elhelyezése a játéktáblán.
\*  ========================================================================  */

const placeTargets = (mapRef, tCount, startRow, startCol) => {
    const { minTargetValue, maxTargetValue } = difficultySettings[levelSelector.dataset.level || 'easy'];
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
      13. MEZŐK KERESÉSE ÉS SZÁMLÁLÁSA
      A szomszédos mezők keresése és a célpontok számlálása.
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
      14. SZÁMÍTOTT MEZŐÉRTÉKEK
      A mezők értékeinek kiszámítása a szomszédos célpontok alapján.
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
      15. FELFEDEZETLEN MEZŐK FELFEDEZÉSE
      A mezők rekurzív felfedezése, ha üres mezőre kattintunk.
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
      16. JÁTÉK VÉGE ELLENŐRZÉSE
      Ellenőrzi, hogy a játék véget ért-e (győzelem vagy vereség).
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
      17. JÁTÉK KIMENETEI
      A játék vége: győzelem vagy vereség kezelése.
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
    revealRemainingFields(); // Új függvény a maradék mezők felfedésére
    stopTimer();
}

/*  ========================================================================  *\
      18. ACTION-GOMB ÁLLAPOTÁNAK FRISSÍTÉSE
      A fő akció gomb állapotának frissítése (start, won, lost).
\*  ========================================================================  */

function updateActionButton(state) {
    if (!actionButton) return;
    actionButton.className = '';
    if (state === 'start') actionButton.classList.add('button-start');
    else if (state === 'won') actionButton.classList.add('button-won');
    else if (state === 'lost') actionButton.classList.add('button-lost');
    if (!isLoading) {
        actionButton.classList.remove('loading');
    }
}

/*  ========================================================================  *\
      19. CÉLOK ÉS MARADÉK MEZŐK MEGJELENÍTÉSE
      A célpontok, hibás jelölések és maradék számozott mezők megjelenítése vereség esetén.
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

function revealRemainingFields() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const cell = map[r][c];
            const isTarget = cell && cell.type === 'target';
            const isExplored = exploredMap[r][c];
            const isMarked = markerMap[r][c];
            if (!isTarget && !isExplored && !isMarked) {
                exploredMap[r][c] = true; // Jelöljük felfedezettként
                drawField(r, c, cell === 0 ? 'number-0' : `number-${cell}`);
            }
        }
    }
}

/*  ========================================================================  *\
      20. EGÉR POZÍCIÓ KISZÁMÍTÁSA
      Az egér pozíciójának kiszámítása a játéktáblán belül.
\*  ========================================================================  */

function getMousePosition(event) {
    const rect = gameContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { row: Math.floor(y / size), col: Math.floor(x / size) };
}

/*  ========================================================================  *\
      21. KATTINTÁS ESEMÉNYKEZELŐK
      A játéktábla kattintásainak és jobb kattintásainak kezelése.
\*  ========================================================================  */

if (gameContainer) {
    gameContainer.addEventListener('click', function (event) {
        if (isGameOver || isLoading) return;
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
        if (isGameOver || isLoading) return;
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
      22. MEZŐK ÉRVÉNYESSÉGE
      Ellenőrzi, hogy egy mező érvényes-e a játéktáblán belül.
\*  ========================================================================  */

function isValidField(row, col) {
    return typeof row === 'number' && typeof col === 'number' && row >= 0 && row < rows && col >= 0 && col < columns;
}

/*  ========================================================================  *\
      23. KÉPEK BETÖLTÉSÉNEK KEZELÉSE
      A játék képeinek betöltése és a betöltési folyamat kezelése.
      A #main-action-button csak a betöltés befejezése után válik kattinthatóvá.
\*  ========================================================================  */

const imageFiles = [
    'images/wooden-background.webp',
    'images/logo.webp',
    'images/button-start.webp',
    'images/button-lost.webp',
    'images/button-won.webp',
    'images/counter.webp',
    'images/0.webp', 'images/1.webp', 'images/2.webp', 'images/3.webp', 'images/4.webp', 'images/5.webp', 'images/6.webp', 'images/7.webp', 'images/8.webp',
    'images/hidden.webp',
    'images/target.webp',
    'images/unmarked-target.webp',
    'images/marker.webp',
    'images/incorrect-marker.webp',
    'images/favicon.webp'
];

function whenAllImagesLoaded(onAllImagesLoaded, minDisplayMs = 5000) {
    const total = imageFiles.length;
    const start = performance.now();
    let loaded = 0;

    function updatePercent() {
        const percentEl = document.getElementById('loading-percentage');
        const overlay = document.getElementById('loading-overlay');
        if (!percentEl || !overlay) {
            console.warn('Nem található a #loading-percentage vagy #loading-overlay elem.');
            return;
        }
        const pct = total === 0 ? 100 : Math.round((loaded / total) * 100);
        percentEl.innerText = `${pct}%`;
        const circle = document.querySelector('.circular');
        if (circle) {
            const circumference = 2 * Math.PI * 45;
            const offset = Math.round(circumference - (pct / 100) * circumference);
            circle.style.strokeDashoffset = offset;
        }
    }

    if (total === 0) {
        const elapsed = performance.now() - start;
        const wait = Math.max(0, minDisplayMs - elapsed);
        setTimeout(() => {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) overlay.style.display = 'none';
            isLoading = false;
            if (actionButton) actionButton.classList.remove('loading');
            onAllImagesLoaded();
        }, wait);
        return;
    }

    imageFiles.forEach(src => {
        const img = new Image();
        img.onload = () => {
            loaded++;
            updatePercent();
        };
        img.onerror = () => {
            console.warn(`Hiba a kép betöltésekor: ${src}`);
            loaded++;
            updatePercent();
        };
        img.src = src;
    });

    const poll = setInterval(() => {
        updatePercent();
        const elapsed = performance.now() - start;
        if (loaded >= total && elapsed >= minDisplayMs) {
            clearInterval(poll);
            const overlay = document.getElementById('loading-overlay');
            if (overlay) overlay.style.display = 'none';
            isLoading = false;
            if (actionButton) actionButton.classList.remove('loading');
            onAllImagesLoaded();
        }
    }, 100);
}

/*  ========================================================================  *\
      24. LENYÍLÓ MENÜ KEZELÉSE
      A #game-info és #level-selector gombok kezelése, a #dropdown-content 
      megjelenítése és elrejtése a #gameContainer tetején. Váltáskor 0.4s várakozás.
\*  ========================================================================  */

function setupDropdown() {
    if (!gameInfo || !levelSelector || !dropdownContent) {
        console.error('Hiba: Nem található a gameInfo, levelSelector vagy dropdownContent!');
        return;
    }

    // Segédfunkció a #dropdown-content elrejtéséhez
    function hideDropdown(callback) {
        if (dropdownContent.classList.contains('show')) {
            dropdownContent.classList.remove('show');
            dropdownContent.style.opacity = '0';
            dropdownContent.style.transform = 'scale(0.8)';
            setTimeout(() => {
                if (callback) callback();
            }, 400); // Csökkentett várakozási idő (0.4s) a gyorsabb váltásért
        } else if (callback) {
            callback();
        }
    }

    // Eseménykezelő a #game-info gombra
    gameInfo.addEventListener('click', function(event) {
        event.stopPropagation();
        if (isLoading) return;
        if (dropdownContent.classList.contains('show') && dropdownContent.dataset.content === 'game-info') {
            hideDropdown();
        } else {
            hideDropdown(() => {
                dropdownContent.dataset.content = 'game-info';
                fetch('page/game-info-page.html')
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP hiba: ${response.status}`);
                        return response.text();
                    })
                    .then(data => {
                        dropdownContent.innerHTML = data;
                        dropdownContent.classList.add('show');
                        dropdownContent.style.opacity = '1';
                        dropdownContent.style.transform = 'scale(1)';
                    })
                    .catch(error => {
                        console.error('Hiba a game-info-page.html betöltésekor:', error);
                        dropdownContent.innerHTML = '<p>Hiba a tartalom betöltésekor.</p>';
                        dropdownContent.classList.add('show');
                        dropdownContent.style.opacity = '1';
                        dropdownContent.style.transform = 'scale(1)';
                    });
            });
        }
    });

    // Eseménykezelő a #level-selector gombra
    levelSelector.addEventListener('click', function(event) {
        event.stopPropagation();
        if (isLoading) return;
        if (dropdownContent.classList.contains('show') && dropdownContent.dataset.content === 'level-selector') {
            hideDropdown();
        } else {
            hideDropdown(() => {
                dropdownContent.dataset.content = 'level-selector';
                fetch('page/level-selector-page.html')
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP hiba: ${response.status}`);
                        return response.text();
                    })
                    .then(data => {
                        dropdownContent.innerHTML = data;
                        dropdownContent.classList.add('show');
                        dropdownContent.style.opacity = '1';
                        dropdownContent.style.transform = 'scale(1)';
                        // Eseménykezelők a nehézségi szint gombokra
                        const buttons = dropdownContent.querySelectorAll('.level-buttons button');
                        if (buttons.length === 0) {
                            console.warn('Nem található .level-buttons button elem a level-selector-page.html-ben!');
                        }
                        buttons.forEach(button => {
                            button.removeAttribute('onclick');
                            button.addEventListener('click', function(e) {
                                e.stopPropagation();
                                const level = this.textContent.toLowerCase();
                                if (level && difficultySettings[level]) {
                                    setDifficulty(level);
                                    levelSelector.dataset.level = level;
                                    hideDropdown();
                                } else {
                                    console.warn('Érvénytelen nehézségi szint:', level);
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.error('Hiba a level-selector-page.html betöltésekor:', error);
                        dropdownContent.innerHTML = '<p>Hiba a tartalom betöltésekor.</p>';
                        dropdownContent.classList.add('show');
                        dropdownContent.style.opacity = '1';
                        dropdownContent.style.transform = 'scale(1)';
                    });
            });
        }
    });

    // Kattintás a dokumentum más részére: #dropdown-content elrejtése
    document.addEventListener('click', function(event) {
        if (isLoading) return;
        if (!gameInfo.contains(event.target) && !levelSelector.contains(event.target) && !dropdownContent.contains(event.target)) {
            hideDropdown();
        }
    });
}

/*  ========================================================================  *\
      25. DOM CONTENT LOADED ESEMÉNYKEZELŐ
      Az oldal betöltésekor inicializáljuk a játékot és a lenyíló menüt.
      A #main-action-button csak a betöltés befejezése után válik aktívvá.
\*  ========================================================================  */

document.addEventListener('DOMContentLoaded', () => {
    fetch('page/loading.html')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP hiba: ${response.status}`);
            return response.text();
        })
        .then(data => {
            gameContainer.innerHTML = data;
            whenAllImagesLoaded(() => {
                loadDefaultGame();
                setupDropdown();
            }, 5000);
        })
        .catch(error => {
            console.error('Hiba a loading.html betöltésekor:', error);
            whenAllImagesLoaded(() => {
                loadDefaultGame();
                setupDropdown();
            }, 5000);
        });

    if (actionButton) {
        actionButton.addEventListener('click', function () {
            if (isLoading) return;
            const difficulty = levelSelector.dataset.level || 'easy';
            setDifficulty(difficulty);
            stopTimer();
            resetTimer();
        });
    }
});

/*  ========================================================================  *\
      E N D   O F   F I N D E R S . J S
\*  ========================================================================  */