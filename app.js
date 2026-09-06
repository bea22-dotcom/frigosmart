let inventarioFrigo = JSON.parse(localStorage.getItem('Frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

let streamCorrente = null;
let modalitaCam = "environment"; 

function avviaFotocamera() {
    if (streamCorrente) {
        streamCorrente.getTracks().forEach(track => track.stop());
    }

    const video = document.getElementById("video-stream");

    const vincoli = {
        video: { 
            facingMode: modalitaCam
        },
        audio: false
    };

    navigator.mediaDevices.getUserMedia(vincoli)
        .then((stream) => {
            streamCorrente = stream;
            video.srcObject = stream;
            
            // Forza iOS a fare il play del video dopo aver ricevuto lo stream
            video.play().catch(e => console.log("Play forzato protetto da Safari"));
            
            document.getElementById("scan-result").innerText = "Fotocamera attiva!";
        })
        .catch((err) => {
            console.error("Errore Safari Camera:", err);
            alert("Per attivare la fotocamera su Safari vai in Impostazioni -> Safari -> Fotocamera -> Consenti.");
        });
}

function cambiaTelecamera() {
    modalitaCam = (modalitaCam === "environment") ? "user" : "environment";
    if (streamCorrente) {
        avviaFotocamera();
    }
}

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