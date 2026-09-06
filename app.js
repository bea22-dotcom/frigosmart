// Forza l'attivazione nativa della telecamera senza vincoli rigidi
async function avviaTelecamera() {
    const video = document.getElementById('webcam');
    const resultText = document.getElementById('scan-result');
    
    // Configurazione flessibile: prova il telefono, se fallisce prende la webcam del PC
    const opzioniVideo = [
        { video: { facingMode: "environment" } }, // Telecamera posteriore smartphone
        { video: true }                           // Qualsiasi webcam disponibile (PC)
    ];

    for (const configurazione of opzioniVideo) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(configurazione);
            video.srcObject = stream;
            resultText.innerText = "Fotocamera attiva! Usa il pulsante sopra o inquadra i codici.";
            resultText.style.color = "green";
            return; // Se ha successo, esce dal ciclo
        } catch (err) {
            // Se fallisce la prima opzione, prova la successiva nel ciclo
        }
    }

    // Se entrambe le opzioni falliscono
    resultText.innerText = "Impossibile attivare la telecamera. Controlla i permessi del browser.";
    resultText.style.color = "red";
}

// Avvia tutto all'apertura della pagina
renderizzaListe();
avviaTelecamera();