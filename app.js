// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

// --- DATABASE PRODOTTI LOCALE ---
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits",
    "8002270015034": "The Freddo San Benedetto" // Aggiunto per i test
};

// --- SCANSIONE DELLA FOTO UTILIZZANDO IL MOTORE INTERNO DEL TELEFONO ---
function scansionaFotoLocale(event) {
    const file = event.target.files[0];
    if (!file) return;

    const resultElement = document.getElementById("scan-result");
    const previewImg = document.getElementById("image-preview");
    const placeholder = document.getElementById("placeholder-text");

    resultElement.innerText = "🔍 Analisi della foto in corso...";

    // Mostra l'anteprima della foto appena scattata
    previewImg.src = URL.createObjectURL(file);
    previewImg.style.display = "block";
    if (placeholder) placeholder.style.display = "none";

    // Controlliamo se il browser supporta il rilevatore nativo dei codici
    if (!('BarcodeDetector' in window)) {
        resultElement.innerText = "❌ Errore sistema.";
        alert("Il browser di questo telefono non supporta l'analisi nativa delle immagini. Assicurati di usare Google Chrome o aggiorna il sistema del telefono.");
        return;
    }

    // Creiamo il lettore nativo configurato per i codici a barre dei negozi (EAN)
    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'qr_code'] });

    // Aspettiamo che l'immagine sia caricata nel tag <img> prima di analizzarla
    previewImg.onload = function() {
        detector.detect(previewImg)
            .then(barcodes => {
                if (barcodes.length > 0) {
                    // Prende il valore testuale del codice a barre trovato
                    const codiceLetto = barcodes[0].rawValue;
                    gestisciCodiceRilevato(codiceLetto);
                } else {
                    resultElement.innerText = "❌ Codice non trovato nella foto.";
                    alert("Non è stato rilevato alcun codice a barre. Scatta la foto tenendo il codice ben dritto, centrato e sotto una buona luce.");
                }
            })
            .catch(err => {
                console.error("Errore decodifica:", err);
                resultElement.innerText = "❌ Errore durante l'analisi.";
            });
    };
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
            alert(`🎉 Aggiunto al frigo: ${prodottoNome}`);
        } else {
            alert(`${prodottoNome} è già presente nel frigorifero.`);
        }
    } else {
        alert(`🔍 Codice rilevato: ${decodedText}\nQuesto prodotto non è registrato nel tuo database. Puoi aggiungerlo manualmente.`);
    }
}

// --- FUNZIONI DI GESTIONE DELLE LISTE ---
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