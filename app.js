// Stato dell'inventario preso dal LocalStorage
let inventarioFrigo = JSON.parse(localStorage.getItem('frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let html5QrCode;
let currentCameraId;

// Database temporaneo per i test dei codici a barre
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits" // Esempio codice reale
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

// Inizializzazione e gestione delle telecamere
function onScanSuccess(decodedText, decodedResult) {
    const resultText = document.getElementById("scan-result");
    let nomeProdotto = DATABASE_PRODOTTI[decodedText] || `Prodotto Sconosciuto (${decodedText})`;
    
    resultText.innerText = `Scansionato: ${nomeProdotto}`;
    segnalaMancante(nomeProdotto);
    
    if (navigator.vibrate) navigator.vibrate(200); // Vibrazione di conferma
}

async function avviaScanner() {
    const resultText = document.getElementById("scan-result");
    const cameraSelect = document.getElementById("camera-select");
    
    html5QrCode = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
            cameraSelect.innerHTML = "";
            
            // Popola il menu a tendina con le telecamere trovate
            devices.forEach((device, index) => {
                let option = document.createElement("option");
                option.value = device.id;
                option.text = device.label || `Telecamera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            // Seleziona preferibilmente la cam posteriore (back/environment)
            let backCamera = devices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('posteriore'));
            currentCameraId = backCamera ? backCamera.id : devices[0].id;
            cameraSelect.value = currentCameraId;

            startCamera(currentCameraId);

            // Cambia telecamera quando l'utente la seleziona dal menu
            cameraSelect.addEventListener('change', (e) => {
                html5QrCode.stop().then(() => {
                    startCamera(e.target.value);
                }).catch(err => console.error(err));
            });

        } else {
            resultText.innerText = "Nessuna telecamera rilevata.";
        }
    }).catch(err => {
        console.error(err);
        resultText.innerText = "Errore permessi fotocamera.";
    });
}

function startCamera(cameraId) {
    const resultText = document.getElementById("scan-result");
    html5QrCode.start(
        cameraId, 
        { fps: 10, qrbox: { width: 250, height: 150 } }, // Ottimizzato rettangolare per codici a barre
        onScanSuccess
    ).then(() => {
        resultText.innerText = "Scanner attivo. Inquadra un codice a barre.";
    }).catch(err => {
        resultText.innerText = "Impossibile avviare questa telecamera.";
    });
}

// Avvia l'app
renderizzaListe();
// Ritardo controllato per evitare conflitti di caricamento su GitHub Pages
setTimeout(avviaScanner, 500);