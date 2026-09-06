// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let codeReader = null;
let streamCorrente = null;
let modalitaCam = "environment"; 

// --- DATABASE PRODOTTI ---
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits"
};

// --- CONFIGURAZIONE AVANZATA SCANNER SAFARI/CHROME ---
function avviaScanner() {
    if (streamCorrente) {
        streamCorrente.getTracks().forEach(track => track.stop());
    }
    if (codeReader) {
        codeReader.reset();
    }

    const video = document.getElementById("video-stream");

    // Chiediamo una risoluzione maggiore e forziamo la messa a fuoco continua
    const vincoliHardware= {
        video: { 
            facingMode: modalitaCam,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            advanced: [{ focusMode: "continuous" }] // Forza l'autofocus continuo dello smartphone
        },
        audio: false
    };

    navigator.mediaDevices.getUserMedia(vincoliHardware)
        .then((stream) => {
            streamCorrente = stream;
            video.srcObject = stream;
            
            video.onplaying = () => {
                document.getElementById("scan-result").innerText = "Scanner attivo! Inquadra il codice a barre.";
                attivaMotoreDecodifica();
            };
        })
        .catch((err) => {
            console.error("Errore fotocamera:", err);
            alert("Impossibile accedere alla fotocamera. Controlla i permessi.");
        });
}

function attivaMotoreDecodifica() {
    // Configura ZXing dicendogli ESPLICITAMENTE di cercare solo codici a barre (EAN)
    const formatiScansione = new Map();
    const formatiSupportati = [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8];
    formatiScansione.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formatiSupportati);
    
    // Tentativo di lettura più aggressivo per immagini sfocate
    formatiScansione.set(ZXing.DecodeHintType.TRY_HARDER, true);

    codeReader = new ZXing.BrowserMultiFormatReader(formatiScansione);
    
    // Avvia la decodifica continua
    codeReader.decodeFromVideoElement('video-stream', (result, err) => {
        if (result) {
            // Se legge il codice, fermiamo un secondo il lettore per evitare alert infiniti
            codeReader.reset();
            gestisciCodiceRilevato(result.text);
            
            // Fai ripartire lo scanner dopo 2 secondi
            setTimeout(avviaScanner, 2000);
        }
    });
}

function gestisciCodiceRilevato(decodedText) {
    // Blocco per evitare letture duplicate ravvicinate
    const resultElement = document.getElementById("scan-result");
    if (resultElement) {
        resultElement.innerText = "Codice letto: " + decodedText;
    }

    if (DATABASE_PRODOTTI[decodedText]) {
        const prodottoNome = DATABASE_PRODOTTI[decodedText];
        
        if (!inventarioFrigo.includes(prodottoNome)) {
            inventarioFrigo.push(prodottoNome);
            localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
            renderizzaListe();
            alert(`Aggiunto al frigo: ${prodottoNome}`);
        }
    } else {
        alert(`Codice letto: ${decodedText}\nProdotto non a database.`);
    }
}

// --- FUNZIONE PER GIRARE LA TELECAMERA ---
function cambiaTelecamera() {
    modalitaCam = (modalitaCam === "environment") ? "user" : "environment";
    avviaScanner();
}

// --- AGGIUNTA MANUALE ---
function aggiungiManuale() {
    const input = document.getElementById("manual-input");
    const prodottoNome = input.value.trim();
    if (prodottoNome) {
        if (!inventarioFrigo.includes(prodottoNome)) {
            inventarioFrigo.push(prodottoNome);
            localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
            renderizzaListe();
            input.value = "";
        }
    }
}

// --- SEGNALA MANCANTE ---
function segnalaMancante(prodottoNome) {
    inventarioFrigo = inventarioFrigo.filter(p => p !== prodottoNome);
    localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
    if (!listaSpesa.includes(prodottoNome)) {
        listaSpesa.push(prodottoNome);
        localStorage.setItem('spesa', JSON.stringify(listaSpesa));
    }
    renderizzaListe();
}

// --- COMPRATO ---
function comprato(prodottoNome) {
    listaSpesa = listaSpesa.filter(p => p !== prodottoNome);
    localStorage.setItem('spesa', JSON.stringify(listaSpesa));
    if (!inventarioFrigo.includes(prodottoNome)) {
        inventarioFrigo.push(prodottoNome);
        localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
    }
    renderizzaListe();
}

// --- RENDERIZZA INTERFACCIA ---
function renderizzaListe() {
    const frigoUl = document.getElementById("frigo-list");
    const spesaUl = document.getElementById("spesa-list");
    if (frigoUl) frigoUl.innerHTML = "";
    if (spesaUl) spesaUl.innerHTML = "";

    inventarioFrigo.forEach(prod => {
        const li = document.createElement("li");
        li.innerHTML = `<span>🍏 ${prod}</span> <button class="action-btn" onclick="segnalaMancante('${prod}')">Mancante</button>`;
        if (frigoUl) frigoUl.appendChild(li);
    });

    listaSpesa.forEach(prod => {
        const li = document.createElement("li");
        li.innerHTML = `<span>🛒 ${prod}</span> <button class="action-btn" onclick="comprato('${prod}')">Comprato</button>`;
        if (spesaUl) spesaUl.appendChild(li);
    });
}

window.addEventListener("DOMContentLoaded", () => {
    renderizzaListe();
});