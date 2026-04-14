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
 * 0. AUTO-REQUEST PERMISSIONS
 * Vraagt direct bij het laden van de pagina om microfoontoegang.
 * Dit helpt Android/WebView om de systeem-popup te triggeren.
 */
window.onload = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log("Systeem-toegang verleend.");
                stream.getTracks().forEach(track => track.stop()); // Stop de stream direct om batterij te sparen
            })
            .catch(err => {
                console.warn("Wacht op handmatige activatie: ", err);
            });
    }
};

/**
 * 1. INITIALISEER AUDIO ENGINE
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
        pitchShift = new Tone.PitchShift(0);
        pitchShift.windowSize = 0.1;

        reverb = new Tone.Reverb({ 
            decay: 2.5, 
            preDelay: 0.01,
            wet: 0 
        }).generate();

        compressor = new Tone.Compressor({
            threshold: -25,
            ratio: 4,
            attack: 0.003,
            release: 0.25
        });

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
        mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

        // --- RECORDING SETUP ---
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

        updateVisualizer();
        return true;

    } catch (err) {
        console.error("Studio Init Fout:", err);
        return false;
    }
}

/**
 * 2. VISUALIZER LOGICA
 */
function updateVisualizer() {
    requestAnimationFrame(updateVisualizer);
    if (meter && meterBar) {
        const level = meter.getValue();
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
        meterBar.style.width = percentage + "%";
        
        if (level > -3) {
            meterBar.style.backgroundColor = "#ff4d4d";
        } else {
            meterBar.style.backgroundColor = "#00d2ff";
        }
    }
}

/**
 * 3. AI FILTER LOGICA
 */
function toggleFilter(type, btn) {
    if (!mic) {
        initStudio();
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
            equalizer.high.rampTo(activeFilters.smooth ? -10 : 0, 0.5);
            pitchShift.windowSize = activeFilters.smooth ? 0.2 : 0.1;
            break;
    }
}

window.toggleFilter = toggleFilter;

/**
 * 4. RECORDING CONTROLS
 */
btnRecord.onclick = async () => {
    if (!mic) {
        const success = await initStudio();
        if (!success) {
            alert("Zorg dat je de app toestemming geeft voor de microfoon in de Android instellingen.");
            return;
        }
    }
    
    chunks = [];
    
    try {
        await mic.open();
        
        setTimeout(() => {
            if (beat && beat.loaded) {
                beat.start();
            }
            
            recorder.start();
            isRecording = true;
            
            btnRecord.style.display = 'none';
            btnStop.style.display = 'block';
            btnStop.classList.add('record-active');
            if (btnSave) btnSave.style.display = 'none';
            
            console.log("Opname gestart...");
        }, 150);
        
    } catch (err) {
        alert("Kan de microfoon niet activeren. Controleer de app-machtigingen op je telefoon.");
    }
};

btnStop.onclick = () => {
    if (recorder && recorder.state === "recording") {
        recorder.stop();
    }
    if (beat) beat.stop();
    if (mic) mic.close();
    
    isRecording = false;
    btnStop.style.display = 'none';
    btnRecord.style.display = 'block';
    btnRecord.innerText = "Nieuwe Sessie";
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
            if (beat) beat.dispose();
            
            beat = new Tone.Player(url, () => {
                beat.connect(masterBus);
                console.log("Beat geladen.");
                alert("Beat klaar!");
            });
        }
    };
}

/**
 * 7. DOWNLOAD / SAVE
 */
if (btnSave) {
    btnSave.onclick = () => {
        if (chunks.length === 0) return;
        
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toLocaleTimeString().replace(/:/g, '-');
        a.href = url;
        a.download = `EchoAI_Track_${timestamp}.wav`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}
