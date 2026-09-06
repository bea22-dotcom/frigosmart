// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

// --- DATABASE PRODOTTI ---
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits"
};

// --- SCANSIONE DA FOTO CON API NATIVA DEL BROWSER ---
async function scansionaDaFoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Controlla se il browser supporta il rilevatore nativo
    if (!('BarcodeDetector' in window)) {
        alert("Il browser dello smartphone non supporta l'analisi nativa. Assicurati di usare Google Chrome aggiornato.");
        return;
    }

    const resultElement = document.getElementById("scan-result");
    const previewImg = document.getElementById("image-preview");
    const placeholder = document.getElementById("placeholder-text");

    resultElement.innerText = "Analisi della foto in corso...";

    // Mostra l'anteprima dell'immagine scattata nel riquadro
    const urlImmagine = URL.createObjectURL(file);
    previewImg.src = urlImmagine;
    previewImg.style.display = "block";
    if (placeholder) placeholder.style.display = "none";

    try {
        // Inizializza il rilevatore del browser per codici a barre commerciali (EAN)
        const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'qr_code'] });
        
        // Aspetta che l'immagine sia caricata in memoria per analizzarla
        previewImg.onload = async () => {
            const barcodes = await detector.detect(previewImg);
            
            if (barcodes.length > 0) {
                const decodedText = barcodes[0].rawValue;
                gestisciCodiceRilevato(decodedText);
            } else {
                resultElement.innerText = "Scansione fallita.";
                alert("Nessun codice a barre rilevato. Metti a fuoco il codice, evita riflessi di luce e riprova.");
            }
        };
    } catch (err) {
        console.error("Errore durante la decodifica nativa:", err);
        resultElement.innerText = "Errore durante l'analisi.";
    }
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
            alert(`${prodottoNome} è già presente nel frigorifero.`);
        }
    } else {
        alert(`Codice letto: ${decodedText}\nProdotto non registrato. Puoi aggiungerlo a mano.`);
    }
}

// --- FUNZIONI DI GESTIONE INTERFACCIA ---
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