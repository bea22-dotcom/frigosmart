// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let codeReader = new ZXing.BrowserMultiFormatReader();
let modalitaCam = "environment"; 

// --- DATABASE PRODOTTI ---
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits"
};

// --- METODO 1: SCANSIONE DA FOTO SCATTATA (MESSA A FUOCO PERFETTA) ---
function scansionaDaFoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("scan-result").innerText = "Analisi della foto in corso...";

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            // ZXing analizza l'immagine statica ad alta risoluzione
            codeReader.decodeFromImageElement(img)
                .then((result) => {
                    gestisciCodiceRilevato(result.text);
                })
                .catch((err) => {
                    console.error(err);
                    alert("Impossibile rilevare il codice a barre da questa foto. Assicurati che l'immagine sia ben illuminata, vicina e non mossa.");
                    document.getElementById("scan-result").innerText = "Scansione fallita. Riprova.";
                });
        };
    };
    reader.readAsDataURL(file);
}

// --- METODO 2: STREAMING LIVE STANDARD ---
function avviaScanner() {
    document.getElementById("scan-result").innerText = "Inizializzazione streaming...";
    codeReader.reset();

    const vincoli = {
        video: { facingMode: modalitaCam, width: { ideal: 1280 }, height: { ideal: 720 } }
    };

    codeReader.decodeFromConstraints(vincoli, 'video-stream', (result, err) => {
        if (result) {
            gestisciCodiceRilevato(result.text);
        }
    });

    document.getElementById("scan-result").innerText = "Streaming attivo. Inquadra il codice.";
}

// --- GESTIONE DEL CODICE LETTO ---
function gestisciCodiceRilevato(decodedText) {
    document.getElementById("scan-result").innerText = "Codice letto: " + decodedText;

    if (DATABASE_PRODOTTI[decodedText]) {
        const prodottoNome = DATABASE_PRODOTTI[decodedText];
        
        if (!inventarioFrigo.includes(prodottoNome)) {
            inventarioFrigo.push(prodottoNome);
            localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
            renderizzaListe();
            alert(`Aggiunto al frigo: ${prodottoNome}`);
        } else {
            alert(`${prodottoNome} è già presente.`);
        }
    } else {
        alert(`Codice letto: ${decodedText}\nProdotto non a database. Puoi inserirlo a mano.`);
    }
}

// --- ALTRE FUNZIONI GESTIONE LISTE ---
function cambiaTelecamera() {
    modalitaCam = (modalitaCam === "environment") ? "user" : "environment";
    avviaScanner();
}

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