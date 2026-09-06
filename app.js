// --- STATO DELL'INVENTARIO ---
let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let streamCorrente = null;
let modalitaCam = "environment"; // Parte usando la fotocamera posteriore

// --- FUNZIONE PER ACCENDERE LA FOTOCAMERA NATIVA ---
function avviaFotocamera() {
    // Se c'è già uno stream attivo, fermalo prima di ripartire
    if (streamCorrente) {
        streamCorrente.getTracks().forEach(track => track.stop());
    }

    const video = document.getElementById("video-stream");
    const placeholder = document.getElementById("placeholder-text");

    const vincoli = {
        video: { facingMode: modalitaCam },
        audio: false
    };

    // Richiesta nativa dei permessi al browser
    navigator.mediaDevices.getUserMedia(vincoli)
        .then((stream) => {
            streamCorrente = stream;
            video.srcObject = stream;
            video.style.display = "block";
            if (placeholder) placeholder.style.display = "none";
            document.getElementById("scan-result").innerText = "Fotocamera attiva con successo!";
        })
        .catch((err) => {
            console.error("Errore di accesso alla fotocamera:", err);
            alert("Impossibile avviare la fotocamera. Assicurati di aver concesso i permessi e che il sito usi HTTPS.");
        });
}

// --- FUNZIONE PER GIRARE LA FOTOCAMERA ---
function cambiaTelecamera() {
    modalitaCam = (modalitaCam === "environment") ? "user" : "environment";
    if (streamCorrente) {
        avviaFotocamera();
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