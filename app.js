// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let html5Qrcode; // Gestore dello scanner
let modalitaCam = "environment"; // Parte provando quella posteriore

// --- DATABASE PRODOTTI ---
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits"
};

// --- FUNZIONE PER AVVIARE LO SCANNER COMPLETO ---
function avviaScanner() {
    // Configurazione del lettore grafico completo
    const config = {
        fps: 15,                           // Maggiore frequenza per agganciare subito il codice
        qrbox: { width: 300, height: 150 }, // Area rettangolare perfetta per i codici a barre dei prodotti
        rememberLastUsedCamera: true,      // Ricorda la fotocamera scelta
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] // Usa lo streaming video live
    };

    // Crea l'interfaccia completa della libreria dentro il tuo div "reader"
    const html5QrcodeScanner = new Html5QrcodeScanner("reader", config, /* verbose= */ false);

    // Avvia il rendering passando le funzioni di successo e di errore
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// Funzione richiamata automaticamente quando viene letto un codice
function onScanSuccess(decodedText, decodedResult) {
    const resultElement = document.getElementById("scan-result");
    if (resultElement) {
        resultElement.innerText = "Codice rilevato: " + decodedText;
    }

    // Controlla se il codice appartiene al tuo database prodotti
    if (DATABASE_PRODOTTI[decodedText]) {
        const prodottoNome = DATABASE_PRODOTTI[decodedText];
        
        if (!inventarioFrigo.includes(prodottoNome)) {
            inventarioFrigo.push(prodottoNome);
            localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
            renderizzaListe();
            alert(`Aggiunto al frigo: ${prodottoNome}`);
        } else {
            alert(`${prodottoNome} è già presente nel frigorifero.`);
        }
    } else {
        alert(`Codice letto: ${decodedText}\nProdotto non trovato nel database.`);
    }
}

// Funzione vuota per gestire la ricerca continua dei fotogrammi senza intasare la console
function onScanFailure(error) {
    // Lasciare vuoto
}

// --- FUNZIONE PER GIRARE LA FOTOCAMERA ---
// Scritta tutta minuscola per corrispondere esattamente al tuo index.html: onclick="cambiatelecamera()"
function cambiaTelecamera() {
    if (html5Qrcode) {
        html5Qrcode.stop().then(() => {
            // Inverte la modalità tra "environment" (posteriore) e "user" (frontale)
            modalitaCam = (modalitaCam === "environment") ? "user" : "environment";
            // Riavvia lo scanner con la nuova configurazione
            avviaScanner();
        }).catch((err) => {
            console.error("Errore nel fermare la fotocamera:", err);
        });
    }
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
            input.value = ""; // Svuota l'input
        } else {
            alert("Prodotto già presente nel frigorifero.");
        }
    }
}

// --- SEGNALA MANCANTE (SPOSTA IN LISTA SPESA) ---
function segnalaMancante(prodottoNome) {
    // Rimuove dal frigo
    inventarioFrigo = inventarioFrigo.filter(p => p !== prodottoNome);
    localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));

    // Aggiunge alla spesa se non presente
    if (!listaSpesa.includes(prodottoNome)) {
        listaSpesa.push(prodottoNome);
        localStorage.setItem('spesa', JSON.stringify(listaSpesa));
    }

    renderizzaListe();
}

// --- COMPRATO (SPOSTA DA SPESA A FRIGO) ---
function comprato(prodottoNome) {
    // Rimuove dalla spesa
    listaSpesa = listaSpesa.filter(p => p !== prodottoNome);
    localStorage.setItem('spesa', JSON.stringify(listaSpesa));

    // Riaggiunge al frigo
    if (!inventarioFrigo.includes(prodottoNome)) {
        inventarioFrigo.push(prodottoNome);
        localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
    }

    renderizzaListe();
}

// --- RENDERIZZA LE LISTE NELL'INTERFACCIA ---
function renderizzaListe() {
    const frigoUl = document.getElementById("frigo-list");
    const spesaUl = document.getElementById("spesa-list");

    if (frigoUl) frigoUl.innerHTML = "";
    if (spesaUl) spesaUl.innerHTML = "";

    // Mostra elementi nel Frigo
    inventarioFrigo.forEach(prod => {
        const li = document.createElement("li");
        li.innerHTML = `<span>🍏 ${prod}</span> <button class="action-btn" onclick="segnalaMancante('${prod}')">Mancante</button>`;
        if (frigoUl) frigoUl.appendChild(li);
    });

    // Mostra elementi nella Lista Spesa
    listaSpesa.forEach(prod => {
        const li = document.createElement("li");
        li.innerHTML = `<span>🛒 ${prod}</span> <button class="action-btn" onclick="comprato('${prod}')">Comprato</button>`;
        if (spesaUl) spesaUl.appendChild(li);
    });
}

// --- AVVIO AUTOMATICO AL CARICAMENTO ---
// CANCELLA O COMMENTA QUESTA RIGA in fondo al file:
// window.addEventListener("DOMContentLoaded", avviaScanner);

// Sostituiscila semplicemente con l'inizializzazione delle liste:
window.addEventListener("DOMContentLoaded", () => {
    renderizzaListe();
});