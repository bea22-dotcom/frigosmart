// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let modalitaCam = "environment"; // Usa la fotocamera posteriore

// --- DATABASE PRODOTTI ---
const DATABASE_PRODOTTI = {
    "8001234567890": "Latte Parzialmente Scremato",
    "8009876543210": "Yogurt alla Fragola",
    "8012345678901": "Uova BIO (x6)",
    "8000570005113": "Nutella Biscuits"
};

// --- FUNZIONE PER AVVIARE LA FOTOCAMERA (QUAGGAJS) ---
function avviaScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#reader"), // Il tuo div HTML
            constraints: {
                width: 640,
                height: 480,
                facingMode: modalitaCam // "environment" per posteriore
            },
        },
        decoder: {
            // Attiva solo i formati dei prodotti da supermercato per la massima velocità
            readers: ["ean_reader", "ean_8_reader"] 
        }
    }, function (err) {
        if (err) {
            console.error("Errore avvio fotocamera: ", err);
            alert("Impossibile accedere alla fotocamera. Controlla i permessi HTTPS.");
            return;
        }
        console.log("QuaggaJS avviato con successo");
        Quagga.start();
    });

    // RILEVAMENTO DEL CODICE A BARRE
    Quagga.onDetected(function (data) {
        const decodedText = data.codeResult.code;
        
        // Evita letture parziali o errate (i codici EAN validi hanno 8 o 13 cifre)
        if (decodedText.length !== 13 && decodedText.length !== 8) return;

        const resultElement = document.getElementById("scan-result");
        if (resultElement) {
            resultElement.innerText = "Codice rilevato: " + decodedText;
        }

        // Gestione del database prodotti
        if (DATABASE_PRODOTTI[decodedText]) {
            const prodottoNome = DATABASE_PRODOTTI[decodedText];
            
            if (!inventarioFrigo.includes(prodottoNome)) {
                inventarioFrigo.push(prodottoNome);
                localStorage.setItem('Frigo', JSON.stringify(inventarioFrigo));
                renderizzaListe();
                alert(`Aggiunto al frigo: ${prodottoNome}`);
            }
        } else {
            // Rilevato ma non nel database
            alert(`Codice letto: ${decodedText}\nProdotto non a sistema.`);
        }
    });
}

// --- FUNZIONE PER CAMBIARE TELECAMERA ---
function cambiaTelecamera() {
    Quagga.stop();
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

// --- RENDERIZZA LE LISTE ---
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

// --- AVVIO AUTOMATICO DELL'INTERFACCIA ---
window.addEventListener("DOMContentLoaded", () => {
    renderizzaListe();
});