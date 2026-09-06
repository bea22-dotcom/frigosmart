// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

// Database locale di backup (se il prodotto non è presente online)
const DATABASE_PRODOTTI_LOCALE = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits"
};

// --- SCANSIONE E RICERCA PRODOTTO TRAMITE OPEN FOOD FACTS ---
function scansionaProdottoAlimentare(event) {
    const file = event.target.files[0];
    if (!file) return;

    const resultElement = document.getElementById("scan-result");
    const previewImg = document.getElementById("image-preview");
    const placeholder = document.getElementById("placeholder-text");

    resultElement.innerText = "⚡ Lettura e ricerca del prodotto nel database...";

    // Mostra l'anteprima locale della foto scattata
    previewImg.src = URL.createObjectURL(file);
    previewImg.style.display = "block";
    if (placeholder) placeholder.style.display = "none";

    const formData = new FormData();
    formData.append("user_image", file);

    // Inviamo l'immagine direttamente al server di riconoscimento alimenti mondiale
    fetch("https://openfoodfacts.org", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Controlliamo se l'API ha riconosciuto il codice a barre
        if (data && data.code) {
            const codiceLetto = data.code;
            let nomeProdotto = "Prodotto Sconosciuto";

            // Se il prodotto esiste nel database mondiale Open Food Facts, prendiamo il nome vero
            if (data.product && data.product.product_name) {
                nomeProdotto = data.product.product_name;
            } 
            // Altrimenti controlliamo se lo hai registrato nel tuo database locale
            else if (DATABASE_PRODOTTI_LOCALE[codiceLetto]) {
                nomeProdotto = DATABASE_PRODOTTI_LOCALE[codiceLetto];
            }

            gestisciProdottoTrovato(codiceLetto, nomeProdotto);
        } else {
            resultElement.innerText = "❌ Codice a barre non rilevato.";
            alert("Il motore non è riuscito a leggere le linee del codice. Riprova tenendo il pacchetto dritto e ben illuminato.");
        }
    })
    .catch(err => {
        console.error("Errore di rete:", err);
        resultElement.innerText = "❌ Errore durante l'analisi.";
        alert("Si è verificato un problema di connessione. Controlla internet.");
    });
}

// --- INSERIMENTO DEL PRODOTTO NEL FRIGO ---
function gestisciProdottoTrovato(codice, nomeProdotto) {
    document.getElementById("scan-result").innerText = `Letto: ${nomeProdotto} (${codice})`;

    if (!inventarioFrigo.includes(nomeProdotto)) {
        inventarioFrigo.push(nomeProdotto);
        localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
        renderizzaListe();
        alert(`🎉 Inserito nel frigo: ${nomeProdotto}`);
    } else {
        alert(`${nomeProdotto} si trova già nel frigorifero.`);
    }
}

// --- GESTIONE DELLE LISTE ---
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