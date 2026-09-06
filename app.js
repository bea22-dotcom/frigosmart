// 1. STATO DELL'INVENTARIO (Salvato nel browser)
let inventarioFrigo = JSON.parse(localStorage.getItem('frigo')) || [];
let listaSpesa = JSON.parse(localStorage.getItem('spesa')) || [];

// 2. FUNZIONE PER DISEGNARE LE LISTE SULLO SCHERMO
function renderizzaListe() {
    const frigoUl = document.getElementById("frigo-list");
    const spesaUl = document.getElementById("spesa-list");
    
    if (frigoUl) frigoUl.innerHTML = "";
    if (spesaUl) spesaUl.innerHTML = "";

    inventarioFrigo.forEach(prod => {
        let li = document.createElement("li");
        li.innerHTML = `<span>🍏 ${prod}</span> <button onclick="segnalaMancante('${prod}')">Finito ❌</button>`;
        if (frigoUl) frigoUl.appendChild(li);
    });

    listaSpesa.forEach(prod => {
        let li = document.createElement("li");
        li.innerHTML = `<span>🛒 ${prod}</span> <button class="action-btn" onclick="compraProdotto('${prod}')">Comprato ✔️</button>`;
        if (spesaUl) spesaUl.appendChild(li);
    });
}

// 3. SALVATAGGIO DEI DATI
function salvaEAgiorna() {
    localStorage.setItem('frigo', JSON.stringify(inventarioFrigo));
    localStorage.setItem('spesa', JSON.stringify(listaSpesa));
    renderizzaListe();
}

// 4. FUNZIONE PER AGGIUNGERE I PRODOTTI A MANO
function aggiungiManuale() {
    const input = document.getElementById("manual-input");
    if (!input) return;
    const nomeProdotto = input.value.trim();
    
    if (nomeProdotto !== "") {
        if (!inventarioFrigo.includes(nomeProdotto)) {
            inventarioFrigo.push(nomeProdotto);
            salvaEAgiorna();
        }
        input.value = ""; // Svuota il campo
    }
}

// 5. FUNZIONE PER SPOSTARE I PRODOTTI NEI MANCANTI (Finito)
function segnalaMancante(prodotto) {
    if (!listaSpesa.includes(prodotto)) {
        listaSpesa.push(prodotto);
        inventarioFrigo = inventarioFrigo.filter(item => item !== prodotto);
        salvaEAgiorna();
    }
}

// 6. FUNZIONE PER RIMETTERE I PRODOTTI NEL FRIGO (Comprato)
function compraProdotto(prodotto) {
    if (!inventarioFrigo.includes(prodotto)) {
        inventarioFrigo.push(prodotto);
        listaSpesa = listaSpesa.filter(item => item !== prodotto);
        salvaEAgiorna();
    }
}

// 7. AVVIO DELLA TELECAMERA
async function avviaTelecamera() {
    const video = document.getElementById('webcam');
    const resultText = document.getElementById('scan-result');
    
    if (!video || !resultText) return;
    
    try {
       // NUOVO CODICE CON ROTAZIONE SULLA TELECAMERA POSTERIORE
const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { 
        facingMode: "environment" 
    } 
});
        video.srcObject = stream;
        resultText.innerText = "Fotocamera attiva! Usa il pulsante sopra o inquadra i codici.";
        resultText.style.color = "green";
    } catch (err) {
        console.error("Errore cam:", err);
        resultText.innerText = "Impossibile avviare la telecamera. Controlla i permessi o usa l'inserimento manuale.";
        resultText.style.color = "red";
    }
}

// 8. ESECUZIONE ALL'APERTURA DELLA PAGINA
renderizzaListe();
avviaTelecamera();