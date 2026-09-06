// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let codeReader = new ZXing.BrowserMultiFormatReader();
let modalitaCam = "environment"; // "environment" forza la telecamera posteriore

// --- DATABASE PRODOTTI ---
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits"
};

// --- AVVIA SCANNER AUTOMATICO (METODO GUIDATO ZXING) ---
function avviaScanner() {
    document.getElementById("scan-result").innerText = "Inizializzazione fotocamera...";

    // Resetta lo scanner se era già avviato
    codeReader.reset();

    // Definiamo i vincoli della fotocamera (posteriore e con risoluzione ideale)
    const vincoli = {
        video: { 
            facingMode: modalitaCam,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    // ZXing fa tutto da solo: apre il video, lo aggancia all'HTML e scansiona continuamente
    codeReader.decodeFromConstraints(vincoli, 'video-stream', (result, err) => {
        if (result) {
            // Codice rilevato con successo!
            gestisciCodiceRilevato(result.text);
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
            // Logga solo errori critici veri, ignorando i fotogrammi vuoti
            console.error(err);
        }
    });

    document.getElementById("scan-result").innerText = "Scanner attivo! Inquadra un codice a barre.";
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
        }
    } else {
        alert(`Codice letto: ${decodedText}\nProdotto non presente nel database.`);
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