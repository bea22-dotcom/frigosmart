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

// --- FUNZIONE PER AVVIARE LA FOTOCAMERA OTTIMIZZATA PER CODICI A BARRE ---
function avviaScanner() {
    // Inizializza la libreria sul div con id="reader"
    html5Qrcode = new Html5Qrcode("reader");

    // Configurazione specifica per leggere i codici a barre dei prodotti (EAN)
    const config = {
        fps: 15, // Aumentiamo i fotogrammi per maggiore fluidità
        qrbox: { width: 300, height: 150 }, // Area rettangolare adatta ai codici a barre
        // ATTIVAZIONE FORMATI: Forziamo la lettura dei codici a barre commerciali
        formatsToSupport: [ 
            Html5QrcodeSupportedFormats.EAN_13, 
            Html5QrcodeSupportedFormats.EAN_8, 
            Html5QrcodeSupportedFormats.QR_CODE 
        ]
    };

    html5Qrcode.start(
        { facingMode: modalitaCam }, 
        config,
        (decodedText) => {
            // 1. Mostra il codice a barre rilevato nella pagina
            const resultElement = document.getElementById("scan-result");
            if (resultElement) {
                resultElement.innerText = "Codice letto: " + decodedText;
            }

            // 2. Cerca il prodotto nel database
            if (DATABASE_PRODOTTI[decodedText]) {
                const prodottoNome = DATABASE_PRODOTTI[decodedText];
                
                // Evita duplicati nel frigo
                if (!inventarioFrigo.includes(prodottoNome)) {
                    inventarioFrigo.push(prodottoNome);
                    localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
                    renderizzaListe();
                    alert(`Aggiunto al frigo: ${prodottoNome}`);
                } else {
                    alert(`${prodottoNome} è già presente nel frigorifero.`);
                }
            } else {
                alert(`Codice sconosciuto: ${decodedText}. Puoi aggiungerlo manualmente.`);
            }
        },
        (errorMessage) => {
            // Ignora gli errori di scansione continui
        }
    ).catch((err) => {
        console.error("Impossibile avviare la fotocamera:", err);
    });
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