/**
 * ECHO AI - MASTER STUDIO SCRIPT
 * Functies: Autotune, AI Filters, Auto-Sync & Recording
 */

let mic, beat, recorder, chunks = [];
let pitchShift, reverb, compressor, equalizer, limiter, meter, masterBus;

// UI Elementen koppelen
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift');
const pitchValDisplay = document.getElementById('pitch-val');
const meterBar = document.getElementById('meter-bar');

let activeFilters = { reverb: false, warmth: false, compress: false, smooth: false };

/**
 * Initialiseert de AI Audio Engine
 */
async function initStudio() {
    // Start Tone.js context
    await Tone.start();
    console.log("AI Audio Engine Gekoppeld");

    // 1. Bronnen & Analyse
    mic = new Tone.UserMedia();
    meter = new Tone.Meter();
    
    // 2. Effecten configuratie
    pitchShift = new Tone.PitchShift(0);
    reverb = new Tone.Reverb({ decay: 2.8, wet: 0 });
    compressor = new Tone.Compressor(-25, 4);
    equalizer = new Tone.EQ3(0, 0, 0);
    
    // 3. Master Bus & Limiter (Zorgt dat beat en stem samenkomen zonder kraken)
    masterBus = new Tone.Gain(1);
    limiter = new Tone.Limiter(-1).toDestination();
    masterBus.connect(limiter);

    // 4. De Keten: Mic -> Pitch -> EQ -> Comp -> Reverb -> Meter -> Master
    mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

    // 5. Recording Setup (Neemt de masterBus af)
    const dest = Tone.context.createMediaStreamDestination();
    masterBus.connect(dest);
    recorder = new MediaRecorder(dest.stream);
    
    recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
        if (btnSave) btnSave.style.display = 'block';
    };

    // Start de visuele meter loop
    updateVisualizer();
}

/**
 * Visualizer logica
 */
function updateVisualizer() {
    requestAnimationFrame(updateVisualizer);
    if (meter) {
        const level = meter.getValue();
        // Zet dB om naar percentage voor de breedte van de bar
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
        if (meterBar) meterBar.style.width = percentage + "%";
    }
}

/**
 * AI Filter Logica
 * Gebruikt in index.html via onclick="toggleFilter(...)"
 */
function toggleFilter(type, btn) {
    if (!mic) return; // Studio moet eerst gestart zijn
    
    btn.classList.toggle('active-filter');
    
    switch(type) {
        case 'reverb':
            activeFilters.reverb = !activeFilters.reverb;
            reverb.wet.value = activeFilters.reverb ? 0.45 : 0;
            break;
        case 'warmth':
            activeFilters.warmth = !activeFilters.warmth;
            equalizer.low.value = activeFilters.warmth ? 10 : 0;
            break;
        case 'compress':
            activeFilters.compress = !activeFilters.compress;
            compressor.threshold.value = activeFilters.compress ? -45 : -25;
            break;
        case 'smooth':
            activeFilters.smooth = !activeFilters.smooth;
            // Haalt scherpe tonen weg en maakt de autotune "gladder"
            equalizer.high.value = activeFilters.smooth ? -7 : 0;
            pitchShift.windowSize = activeFilters.smooth ? 0.2 : 0.1;
            break;
    }
}

// Omdat we 'onclick' in de HTML gebruiken voor filters, maken we de functie globaal
window.toggleFilter = toggleFilter;

/**
 * Recording Controls
 */
btnRecord.onclick = async () => {
    if (!mic) await initStudio();
    
    chunks = [];
    try {
        await mic.open();
        
        // AUTO-SYNC: Start de beat en de recorder op exact hetzelfde moment
        if (beat && beat.loaded) {
            beat.connect(masterBus);
            beat.start();
        }
        
        recorder.start();
        
        btnRecord.style.display = 'none';
        btnStop.style.display = 'block';
        btnStop.classList.add('record-active');
        if (btnSave) btnSave.style.display = 'none';
        
    } catch (err) {
        alert("Microfoon niet toegankelijk. Controleer je rechten.");
    }
};

btnStop.onclick = () => {
    recorder.stop();
    if (beat) beat.stop();
    mic.close();
    
    btnStop.style.display = 'none';
    btnRecord.style.display = 'block';
    btnRecord.innerText = "Nieuwe Sessie";
};

/**
 * Autotune / Pitch Slider
 */
pitchSlider.oninput = (e) => {
    const val = e.target.value;
    if (pitchValDisplay) pitchValDisplay.innerText = val;
    if (pitchShift) pitchShift.pitch = val;
};

/**
 * Beat Uploaden
 */
beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        beat = new Tone.Player(url, () => {
            console.log("Beat ingeladen en klaar voor sync.");
        });
    }
};

/**
 * Save / Download Functie
 */
if (btnSave) {
    btnSave.onclick = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'EchoAI_Master_Track.wav';
        a.click();
        window.URL.revokeObjectURL(url);
    };
}
