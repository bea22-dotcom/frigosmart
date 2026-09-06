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

// --- SCANSIONE TRAMITE MOTORE DI DECODIFICA API CLOUD ---
function scansionaConCloud(event) {
    const file = event.target.files[0];
    if (!file) return;

    const resultElement = document.getElementById("scan-result");
    const previewImg = document.getElementById("image-preview");
    const placeholder = document.getElementById("placeholder-text");

    resultElement.innerText = "⚡ Invio al motore di lettura in corso...";

    // Mostra l'anteprima locale della foto
    previewImg.src = URL.createObjectURL(file);
    previewImg.style.display = "block";
    if (placeholder) placeholder.style.display = "none";

    // Prepariamo la foto per inviarla tramite chiamata HTTP POST
    const formData = new FormData();
    formData.append("file", file);

    // Inviamo la foto al server di decodifica gratuito e sicuro di GoQR
    fetch("https://qrserver.com", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Il server risponde con un array di risultati
        if (data && data[0] && data[0].symbol && data[0].symbol[0] && data[0].symbol[0].data) {
            const decodedText = data[0].symbol[0].data;
            gestisciCodiceRilevato(decodedText);
        } else {
            // Se il server non trova codici nell'immagine
            resultElement.innerText = "❌ Codice non trovato nella foto.";
            alert("Il motore non ha trovato codici a barre. Scatta la foto più da vicino, assicurati che non sia mossa e che ci sia buona luce.");
        }
    })
    .catch(err => {
        console.error("Errore di connessione API:", err);
        resultElement.innerText = "❌ Errore di connessione.";
        alert("Impossibile contattare il server di lettura. Controlla la tua connessione internet.");
    });
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
        alert(`🔍 Codice rilevato: ${decodedText}\nQuesto prodotto non è nel tuo database. Puoi aggiungerlo manualmente.`);
    }
}

// --- FUNZIONI DI GESTIONE DELLE LISTE INTERNE ---
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