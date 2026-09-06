// Stato dell'inventario preso dal LocalStorage
let inventarioFrigo = JSON.parse(localStorage.getItem('frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

// Funzione per inserire a mano i prodotti
function aggiungiManuale() {
    const input = document.getElementById("manual-input");
    const nomeProdotto = input.value.trim();
    
    if (nomeProdotto !== "") {
        // All'inizio lo inseriamo nel frigo
        if (!inventarioFrigo.includes(nomeProdotto)) {
            inventarioFrigo.push(nomeProdotto);
            salvaEAgiorna();
        }
        input.value = ""; // Svuota il campo di testo
    }
}

// Funzione per aggiungere un prodotto alla lista della spesa (mancante)
function segnalaMancante(prodotto) {
    if (!listaSpesa.includes(prodotto)) {
        listaSpesa.push(prodotto);
        inventarioFrigo = inventarioFrigo.filter(item => item !== prodotto);
        salvaEAgiorna();
    }
}

// Funzione per rimettere il prodotto nel frigo (comprato)
function compraProdotto(prodotto) {
    if (!inventarioFrigo.includes(prodotto)) {
        inventarioFrigo.push(prodotto);
        listaSpesa = listaSpesa.filter(item => item !== prodotto);
        salvaEAgiorna();
    }
}

// Salva i dati nel browser e aggiorna la schermata
function salvaEAgiorna() {
    localStorage.setItem('frigo', JSON.stringify(inventarioFrigo));
    localStorage.setItem('spesa', JSON.stringify(listaSpesa));
    renderizzaListe();
}

function renderizzaListe() {
    const frigoUl = document.getElementById("frigo-list");
    const spesaUl = document.getElementById("spesa-list");
    
    frigoUl.innerHTML = "";
    spesaUl.innerHTML = "";

    inventarioFrigo.forEach(prod => {
        let li = document.createElement("li");
        li.innerHTML = `${prod} <button onclick="segnalaMancante('${prod}')">Finito ❌</button>`;
        frigoUl.appendChild(li);
    });

    listaSpesa.forEach(prod => {
        let li = document.createElement("li");
        li.innerHTML = `${prod} <button class="action-btn" onclick="compraProdotto('${prod}')">Comprato ✔️</button>`;
        spesaUl.appendChild(li);
    });
}

// Forza l'attivazione nativa della telecamera
async function avviaTelecamera() {
    const video = document.getElementById('webcam');
    const resultText = document.getElementById('scan-result');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        video.srcObject = stream;
        resultText.innerText = "Telecamera attiva! (Funzione scanner nativa)";
    } catch (err) {
        console.error("Errore accesso cam: ", err);
        resultText.innerText = "Impossibile avviare la telecamera. Usa l'inserimento manuale.";
        resultText.style.color = "red";
    }
}

// Avvia tutto all'apertura della pagina
renderizzaListe();
avviaTelecamera();