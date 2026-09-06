// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

// --- DATABASE PRODOTTI LOCALE ---
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits",
    "8002270015034": "The Freddo San Benedetto"
};

// --- ELABORAZIONE E ANALISI DELLO SCATTO VIA CANVAS ---
function elaboraScattoConCanvas(event) {
    const file = event.target.files[0];
    if (!file) return;

    const resultElement = document.getElementById("scan-result");
    const previewImg = document.getElementById("image-preview");

    resultElement.innerText = "🔍 Analisi della foto in corso...";

    // Creiamo un oggetto per leggere il file
    const reader = new FileReader();
    reader.onload = function(e) {
        // Assegniamo la foto all'elemento visibile
        previewImg.src = e.target.result;

        previewImg.onload = function() {
            // Controlliamo se il browser supporta il rilevatore nativo
            if (!('BarcodeDetector' in window)) {
                resultElement.innerText = "❌ Sistema non supportato.";
                alert("Il browser non supporta il lettore nativo. Assicurati di usare Google Chrome aggiornato.");
                return;
            }

            // CREAZIONE CANVAS INVISIBILE PER LA PULIZIA DEI PIXEL
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = previewImg.naturalWidth;
            canvas.height = previewImg.naturalHeight;
            
            // Disegnamo l'immagine sul canvas alla massima risoluzione
            ctx.drawImage(previewImg, 0, 0);

            // Inizializziamo il BarcodeDetector per tutti i formati commerciali (EAN)
            const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'qr_code'] });

            // Diamo in pasto il canvas al lettore, che è stabile al 100%
            detector.detect(canvas)
                .then(barcodes => {
                    if (barcodes.length > 0) {
                        const codiceLetto = barcodes[0].rawValue;
                        gestisciCodiceRilevato(codiceLetto);
                    } else {
                        resultElement.innerText = "❌ Codice non trovato nella foto.";
                        alert("Codice a barre non rilevato. Tieni la fotocamera ben ferma, centrata e riprova con più luce.");
                    }
                })
                .catch(err => {
                    console.error("Errore lettura Canvas:", err);
                    resultElement.innerText = "❌ Errore durante l'analisi.";
                });
        };
    };
    reader.readAsDataURL(file);
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
        alert(`🔍 Codice rilevato: ${decodedText}\nProdotto non registrato. Puoi aggiungerlo manuale.`);
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