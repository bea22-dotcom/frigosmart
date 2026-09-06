// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let codeReader = null;
let idTelecameraCorrente = null;
let tutteLeTelecamere = [];

// --- DATABASE PRODOTTI ---
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits"
};

// --- FUNZIONE PER AVVIARE LO SCANNER (ZXING) ---
function avviaScanner() {
    // Se lo scanner è già attivo, fermalo prima di ripartire
    if (codeReader) {
        codeReader.reset();
    }

    // Inizializza il lettore di codici a barre multi-formato di Zxing
    codeReader = new ZXing.BrowserMultiFormatReader();

    // Rileva l'hardware video disponibile sul dispositivo (PC o Smartphone)
    codeReader.listVideoInputDevices()
        .then((videoInputDevices) => {
            tutteLeTelecamere = videoInputDevices;
            
            if (videoInputDevices.length === 0) {
                alert("Nessuna fotocamera rilevata sul dispositivo.");
                return;
            }

            // Selezione automatica della fotocamera posteriore ("back" o "environment")
            if (!idTelecameraCorrente) {
                const camPosteriore = videoInputDevices.find(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('posteriore') || 
                    device.label.toLowerCase().includes('environment')
                );
                // Se trova la posteriore usa quella, altrimenti prende la prima disponibile
                idTelecameraCorrente = camPosteriore ? camPosteriore.deviceId : videoInputDevices[0].deviceId;
            }

            // Avvia la scansione continua sul tag <video id="video">
            codeReader.decodeFromVideoDevice(idTelecameraCorrente, 'video', (result, err) => {
                if (result) {
                    const decodedText = result.text;
                    gestisciCodiceRilevato(decodedText);
                }
                // Gli errori continui di fotogramma non decodificato vengono ignorati automaticamente
            });
            console.log("Scanner Zxing avviato correttamente.");
        })
        .catch((err) => {
            console.error("Errore di inizializzazione Zxing:", err);
            alert("Errore nell'accesso ai video dispositivi.");
        });
}

// Funzione che elabora il codice a barre letto
function gestisciCodiceRilevato(decodedText) {
    const resultElement = document.getElementById("scan-result");
    if (resultElement) {
        resultElement.innerText = "Codice letto: " + decodedText;
    }

    // Controllo e associazione con il Database Prodotti
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
        alert(`Codice letto: ${decodedText}\n(Prodotto non registrato nel database)`);
    }
}

// --- FUNZIONE PER GIRARE LA FOTOCAMERA ---
function cambiaTelecamera() {
    if (codeReader && tutteLeTelecamere.length > 1) {
        // Trova l'indice della telecamera corrente e passa alla successiva nell'elenco
        let indiceCorrente = tutteLeTelecamere.findIndex(d => d.deviceId === idTelecameraCorrente);
        let prossimoIndice = (indiceCorrente + 1) % tutteLeTelecamere.length;
        idTelecameraCorrente = tutteLeTelecamere[prossimoIndice].deviceId;
        
        // Riavvia lo scanner con la nuova fotocamera scelta
        avviaScanner();
    } else {
        alert("Nessun'altra fotocamera disponibile su cui switchare.");
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
            input.value = "";
        } else {
            alert("Prodotto già presente nel frigorifero.");
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

// --- AVVIO INTERFACCIA ---
window.addEventListener("DOMContentLoaded", () => {
    renderizzaListe();
});