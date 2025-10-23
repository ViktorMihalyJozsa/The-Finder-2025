/*  ========================================================================  *\

    D R O P D O W N . J S

    A dropdown.js fájl a játék oldalának lenyíló menüjét kezeli.

    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    A fájl tartalmazza a következő funkciókat:

        - Lenyíló menü megjelenítése és elrejtése kattintásra
        - AJAX segítségével betölti a menü tartalmát

\*  ========================================================================  */

/*  ========================================================================  *\
      Eseménykezelők és funkciók a lenyíló menühöz
\*  ========================================================================  */

document.addEventListener('DOMContentLoaded', function() {
    const textContainer = document.getElementById('game-info'); 
    const dropdownContent = document.getElementById('dropdown-content'); 

    if (!textContainer || !dropdownContent) {  
        console.error('Hiba: Nem található a textContainer vagy a dropdownContent!');
        return;
    }

    textContainer.addEventListener('click', function(event) { 
        dropdownContent.classList.toggle('show'); 
        event.stopPropagation(); 
    });

    document.addEventListener('click', function(event) {
        if (!textContainer.contains(event.target) && !dropdownContent.contains(event.target)) {  
            dropdownContent.classList.remove('show');  
        }
    });


/*  ========================================================================  *\
      AJAX kérés a dropdown tartalmának betöltéséhez
\*  ========================================================================  */

    fetch('page/game-info-page.html') 
        .then(response => {
            if (!response.ok) { 
                throw new Error(`HTTP hiba! Status: ${response.status}`); 
            }
            return response.text(); 
        })
        .then(data => {
            dropdownContent.innerHTML = data; 
            dropdownContent.style.opacity = 1; 
        })
        .catch(error => { 
            console.error('Hiba a dropdown tartalmának betöltésekor:', error);  
            dropdownContent.innerHTML = '<p>Nem sikerült betölteni a tartalmat.</p>'; 
        });

    dropdownContent.style.transition = 'opacity 3s ease-in-out'; 
    dropdownContent.style.opacity = 0; 
});


/*  ========================================================================  *\
    E N D   O F   D R O P D O W N . J S
\*  ========================================================================  */