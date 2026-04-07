/**
 * ECHO AI - MASTER STUDIO SCRIPT v2.0
 * Functies: Autotune, AI Filters, Auto-Sync & Recording
 * Ontwikkeld voor: abelsoftware123 AI Studio
 */

// --- GLOBALE VARIABELEN ---
let mic, beat, recorder, chunks = [];
let pitchShift, reverb, compressor, equalizer, limiter, meter, masterBus;
let isRecording = false;

// --- UI ELEMENTEN ---
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift');
const pitchValDisplay = document.getElementById('pitch-val');
const meterBar = document.getElementById('meter-bar');

// Filter Status
let activeFilters = { 
    reverb: false, 
    warmth: false, 
    compress: false, 
    smooth: false 
};

/**
 * 1. INITIALISEER AUDIO ENGINE
 * Wordt aangeroepen bij de eerste klik om browser-beperkingen te omzeilen.
 */
async function initStudio() {
    try {
        // Start de Tone.js Audio Context
        await Tone.start();
        console.log("AI Audio Engine Gekoppeld");

        // --- BRONNEN & ANALYSE ---
        mic = new Tone.UserMedia();
        meter = new Tone.Meter();
        
        // --- EFFECTEN CONFIGURATIE ---
        // PitchShift voor Autotune effect
        pitchShift = new Tone.PitchShift(0);
        pitchShift.windowSize = 0.1;

        // Reverb voor ruimte-effect
        reverb = new Tone.Reverb({ 
            decay: 2.5, 
            preDelay: 0.01,
            wet: 0 
        }).generate();

        // Compressor voor een krachtige stem
        compressor = new Tone.Compressor({
            threshold: -25,
            ratio: 4,
            attack: 0.003,
            release: 0.25
        });

        // EQ voor Warmth en Smoothing
        equalizer = new Tone.EQ3({
            low: 0,
            mid: 0,
            high: 0
        });
        
        // --- MASTER BUS & VEILIGHEID ---
        masterBus = new Tone.Gain(1);
        limiter = new Tone.Limiter(-1).toDestination();
        masterBus.connect(limiter);

        // --- DE AUDIO KETEN ---
        // Mic -> Pitch -> EQ -> Compressor -> Reverb -> Meter -> Master
        mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

        // --- RECORDING SETUP ---
        // We maken een stream van de Master Bus (Stem + Beat)
        const dest = Tone.context.createMediaStreamDestination();
        masterBus.connect(dest);
        
        recorder = new MediaRecorder(dest.stream);
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = () => {
            if (btnSave) btnSave.style.display = 'block';
            console.log("Opname opgeslagen in buffer.");
        };

        // Start visuele feedback
        updateVisualizer();
        return true;

    } catch (err) {
        console.error("Studio Init Fout:", err);
        alert("Kan de audio engine niet starten. Controleer je microfoonrechten.");
        return false;
    }
}

/**
 * 2. VISUALIZER LOGICA (Volume Meter)
 */
function updateVisualizer() {
    requestAnimationFrame(updateVisualizer);
    if (meter && meterBar) {
        const level = meter.getValue();
        // Zet decibels om naar een bruikbaar percentage voor de CSS bar
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
        meterBar.style.width = percentage + "%";
        
        // Kleurverandering bij clipping
        if (level > -3) {
            meterBar.style.backgroundColor = "#ff4d4d";
        } else {
            meterBar.style.backgroundColor = "#00d2ff";
        }
    }
}

/**
 * 3. AI FILTER LOGICA
 * Gebruikt via onclick in de HTML
 */
function toggleFilter(type, btn) {
    if (!mic) {
        console.warn("Start eerst de opname om filters te activeren.");
        return;
    }
    
    btn.classList.toggle('active-filter');
    
    switch(type) {
        case 'reverb':
            activeFilters.reverb = !activeFilters.reverb;
            reverb.wet.rampTo(activeFilters.reverb ? 0.5 : 0, 0.5);
            break;
        case 'warmth':
            activeFilters.warmth = !activeFilters.warmth;
            equalizer.low.rampTo(activeFilters.warmth ? 8 : 0, 0.5);
            break;
        case 'compress':
            activeFilters.compress = !activeFilters.compress;
            compressor.threshold.value = activeFilters.compress ? -45 : -25;
            break;
        case 'smooth':
            activeFilters.smooth = !activeFilters.smooth;
            // High-cut filter voor een zachte sound
            equalizer.high.rampTo(activeFilters.smooth ? -10 : 0, 0.5);
            pitchShift.windowSize = activeFilters.smooth ? 0.2 : 0.1;
            break;
    }
}

// Global scope maken voor HTML onclick
window.toggleFilter = toggleFilter;

/**
 * 4. RECORDING CONTROLS
 */
btnRecord.onclick = async () => {
    // Initialiseer als dat nog niet gedaan is
    if (!mic) {
        const success = await initStudio();
        if (!success) return;
    }
    
    chunks = [];
    
    try {
        // Open de microfoon stream
        await mic.open();
        
        // AUTO-SYNC START
        // We gebruiken een kleine delay om te zorgen dat de microfoon 'wakker' is
        setTimeout(() => {
            if (beat && beat.loaded) {
                beat.start();
            }
            
            recorder.start();
            isRecording = true;
            
            // UI Update
            btnRecord.style.display = 'none';
            btnStop.style.display = 'block';
            btnStop.classList.add('record-active');
            if (btnSave) btnSave.style.display = 'none';
            
            console.log("Opname gestart...");
        }, 150);
        
    } catch (err) {
        alert("Microfoon niet gevonden of toegang geweigerd. Check het slotje in de adresbalk.");
    }
};

btnStop.onclick = () => {
    if (recorder && recorder.state === "recording") {
        recorder.stop();
    }
    
    if (beat) {
        beat.stop();
    }
    
    if (mic) {
        mic.close();
    }
    
    isRecording = false;
    btnStop.style.display = 'none';
    btnRecord.style.display = 'block';
    btnRecord.innerText = "Nieuwe Sessie";
    console.log("Opname gestopt.");
};

/**
 * 5. AUTOTUNE / PITCH SLIDER
 */
if (pitchSlider) {
    pitchSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        if (pitchValDisplay) pitchValDisplay.innerText = val;
        if (pitchShift) {
            pitchShift.pitch = val;
        }
    };
}

/**
 * 6. BEAT UPLOADEN
 */
if (beatUpload) {
    beatUpload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            
            // Verwijder oude beat als die bestaat
            if (beat) beat.dispose();
            
            beat = new Tone.Player(url, () => {
                beat.connect(masterBus); // Koppel direct aan master
                console.log("Beat succesvol geladen.");
                alert("Beat klaar voor opname!");
            });
        }
    };
}

/**
 * 7. DOWNLOAD / SAVE
 */
if (btnSave) {
    btnSave.onclick = () => {
        if (chunks.length === 0) {
            alert("Geen opname gevonden.");
            return;
        }
        
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Bestandsnaam met tijdstempel
        const timestamp = new Date().toLocaleTimeString().replace(/:/g, '-');
        a.href = url;
        a.download = `EchoAI_Track_${timestamp}.wav`;
        a.click();
        
        // Geheugen opruimen
        window.URL.revokeObjectURL(url);
    };
}

// --- DEBUGGING HULP ---
console.log("Echo AI Script Geladen. Wacht op gebruiker interactie...");
