// Stato dell'inventario
let inventarioFrigo = JSON.parse(localStorage.getItem('frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let html5QrCode;
let modalitaCam = "environment"; // Parte provando quella posteriore

const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits"
};

function renderizzaListe() {
    const frigoUl = document.getElementById("frigo-list");
    const spesaUl = document.getElementById("spesa-list");
    
    if (frigoUl) frigoUl.innerHTML = "";
    if (spesaUl) spesaUl.innerHTML = "";

    inventarioFrigo.forEach(prod => {
        let li = document.createElement("li");
        li.innerHTML = `<span>🍏 ${prod}</span> <button onclick="segnalaMancante('${prod}')">Finito ❌</button>`;
        if (frigoUl) frigoUl.appendChild(li);
    });

    listaSpesa.forEach(prod => {
        let li = document.createElement("li");
        li.innerHTML = `<span>🛒 ${prod}</span> <button class="action-btn" onclick="compraProdotto('${prod}')">Comprato ✔️</button>`;
        if (spesaUl) spesaUl.appendChild(li);
    });
}

function salvaEAgiorna() {
    localStorage.setItem('frigo', JSON.stringify(inventarioFrigo));
    localStorage.setItem('spesa', JSON.stringify(listaSpesa));
    renderizzaListe();
}

function aggiungiManuale() {
    const input = document.getElementById("manual-input");
    if (!input) return;
    const nomeProdotto = input.value.trim();
    
    if (nomeProdotto !== "") {
        if (!inventarioFrigo.includes(nomeProdotto)) {
            inventarioFrigo.push(nomeProdotto);
            salvaEAgiorna();
        }
        input.value = "";
    }
}

function segnalaMancante(prodotto) {
    if (!listaSpesa.includes(prodotto)) {
        listaSpesa.push(prodotto);
        inventarioFrigo = inventarioFrigo.filter(item => item !== prodotto);
        salvaEAgiorna();
    }
}

function compraProdotto(prodotto) {
    if (!inventarioFrigo.includes(prodotto)) {
        inventarioFrigo.push(prodotto);
        listaSpesa = listaSpesa.filter(item => item !== prodotto);
        salvaEAgiorna();
    }
}

function onScanSuccess(decodedText, decodedResult) {
    const resultText = document.getElementById("scan-result");
    let nomeProdotto = DATABASE_PRODOTTI[decodedText] || `Prodotto Sconosciuto (${decodedText})`;
    
    resultText.innerText = `Scansionato: ${nomeProdotto}`;
    segnalaMancante(nomeProdotto);
    
    if (navigator.vibrate) navigator.vibrate(200);
}

// Avvia lo scanner con la modalità corrente
function avviaScanner() {
    const resultText = document.getElementById("scan-result");
    
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    html5QrCode.start(
        { facingMode: modalitaCam }, 
        { fps: 10, qrbox: { width: 250, height: 150 } },
        onScanSuccess
    ).then(() => {
        resultText.innerText = "Scanner attivo. Inquadra un codice a barre.";
        resultText.style.color = "green";
    }).catch(err => {
        console.error(err);
        resultText.innerText = "Errore di avvio. Prova a girare la fotocamera.";
        resultText.style.color = "orange";
    });
}

// Funzione legata al pulsante per forzare il cambio cam
function cambiaTelecamera() {
    const resultText = document.getElementById("scan-result");
    resultText.innerText = "Cambio telecamera in corso...";
    
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            // Inverte la modalità: se era posteriore diventa frontale e viceversa
            modalitaCam = (modalitaCam === "environment") ? "user" : "environment";
            avviaScanner();
        }).catch(err => {
            console.error("Errore stop cam:", err);
            // Forza comunque il riavvio se era già spenta
            modalitaCam = (modalitaCam === "environment") ? "user" : "environment";
            avviaScanner();
        });
    } else {
        avviaScanner();
    }
}

// Avvio iniziale
renderizzaListe();
setTimeout(avviaScanner, 1000);