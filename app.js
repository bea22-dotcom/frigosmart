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

// --- FUNZIONE PER AVVIARE LO SCANNER COMPATIBILE SAFARI ---
function avviaScanner() {
    if (codeReader) {
        codeReader.reset();
    }

    // Configura ZXing per leggere sia codici a barre (EAN) che QR
    codeReader = new ZXing.BrowserMultiFormatReader();

    codeReader.listVideoInputDevices()
        .then((videoInputDevices) => {
            tutteLeTelecamere = videoInputDevices;
            
            if (videoInputDevices.length === 0) {
                alert("Nessuna fotocamera rilevata.");
                return;
            }

            // Cerca la fotocamera posteriore (ideale per i codici a barre)
            if (!idTelecameraCorrente) {
                const camPosteriore = videoInputDevices.find(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('posteriore') || 
                    device.label.toLowerCase().includes('environment')
                );
                idTelecameraCorrente = camPosteriore ? camPosteriore.deviceId : videoInputDevices[0].deviceId;
            }

            // Avvia la scansione agganciandola al tag video 'video-stream'
            codeReader.decodeFromVideoDevice(idTelecameraCorrente, 'video-stream', (result, err) => {
                if (result) {
                    gestisciCodiceRilevato(result.text);
                }
            });

            // Trucco per Safari: forza la riproduzione video se dovesse congelarsi
            const video = document.getElementById("video-stream");
            if (video) {
                video.play().catch(e => console.log("Play forzato abilitato"));
            }

            document.getElementById("scan-result").innerText = "Scanner attivo! Inquadra un codice.";
        })
        .catch((err) => {
            console.error("Errore scanner:", err);
            alert("Errore nell'attivazione dello scanner.");
        });
}

// Elaborazione del codice letto
function gestisciCodiceRilevato(decodedText) {
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
    if (codeReader && tutteLeTelecamere.length > 1) {
        let indiceCorrente = tutteLeTelecamere.findIndex(d => d.deviceId === idTelecameraCorrente);
        let prossimoIndice = (indiceCorrente + 1) % tutteLeTelecamere.length;
        idTelecameraCorrente = tutteLeTelecamere[prossimoIndice].deviceId;
        avviaScanner();
    } else {
        alert("Nessun'altra fotocamera rilevata.");
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