/*  ========================================================================  *\

    W A R N I N G . J S

    A warning.js fájl a játék oldalának orientációját ellenőrzi.

    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        A fájl tartalmazza a következő funkciókat:

            1. checkOrientation() 
                - Az oldal orientációjának ellenőrzése
            2. window.addEventListener("resize") 
                - Az oldal átméretezésének figyelése
            3. window.addEventListener("orientationchange") 
                - Az oldal orientációjának figyelése

        A fájlhoz tartozó CSS:
            - layout.css
            - components.css

\*  ========================================================================  */


document.addEventListener("DOMContentLoaded", () => {
    checkOrientation();

    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(checkOrientation, 200); // Debounce a resize eseményekhez
    });

    window.addEventListener("orientationchange", checkOrientation);
});

function checkOrientation() {
    const warning = document.getElementById("warning");
    if (!warning) return;

    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    const maxWidth = 768;

    if (isLandscape && window.innerWidth <= maxWidth) {
        warning.style.display = "flex";
        requestAnimationFrame(() => warning.classList.add("show")); // Sima animáció
    } else {
        warning.classList.remove("show");
        warning.addEventListener("transitionend", () => {
            if (!warning.classList.contains("show")) {
                warning.style.display = "none";
            }
        }, { once: true }); // Eltávolítja az event listenert, hogy ne halmozódjon
    }
}


/*  ========================================================================  *\
    E N D   O F   W A R N I N G . J S
\*  ========================================================================  */