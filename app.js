// Funzione per avviare la telecamera e analizzare i codici a barre
async function avviaTelecamera() {
    const video = document.getElementById('webcam');
    const resultText = document.getElementById('scan-result');
    
    // Controlla se il browser del telefono supporta lo scanner integrato
    if (!('BarcodeDetector' in window)) {
        resultText.innerText = "Scanner automatico non supportato su questo browser. Usa l'inserimento manuale o Chrome/Edge.";
        resultText.style.color = "orange";
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment", focusMode: "continuous" } 
        });
        video.srcObject = stream;
        resultText.innerText = "Fotocamera attiva. Inquadra un codice a barre...";

        // Inizializza il rilevatore di codici a barre (EAN-13 è lo standard dei supermercati)
        const barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'qr_code'] });
        
        // Avvia il ciclo continuo di scansione ogni 300 millisecondi
        setInterval(async () => {
            if (video.readyState === video.HAVE_CURRENT_DATA) {
                try {
                    const barcodes = await barcodeDetector.detect(video);
                    if (barcodes.length > 0) {
                        const codiceRilevato = barcodes[0].rawValue;
                        
                        // Piccolo Database locale per il test
                        const DATABASE_PRODOTTI = {
                            "8001234567890": "Latte Parzialmente Scremato",
                            "8009876543210": "Yogurt alla Fragola",
                            "8012345678901": "Uova BIO (x6)"
                        };

                        let nomeProdotto = DATABASE_PRODOTTI[codiceRilevato] || `Prodotto Sconosciuto (${codiceRilevato})`;
                        resultText.innerText = `Rilevato: ${nomeProdotto}`;
                        
                        // Sposta il prodotto nei mancanti (Finito)
                        segnalaMancante(nomeProdotto);
                        
                        // Vibrazione di conferma sul telefono (se supportata)
                        if (navigator.vibrate) navigator.vibrate(200);
                    }
                } catch (e) {
                    // Ignora gli errori di frame vuoti durante il movimento
                }
            }
        }, 300);

    } catch (err) {
        console.error("Errore accesso cam: ", err);
        resultText.innerText = "Impossibile accedere alla fotocamera. Controlla i permessi dello smartphone.";
        resultText.style.color = "red";
    }
}

// Avvia i componenti all'apertura della pagina
renderizzaListe();
avviaTelecamera();