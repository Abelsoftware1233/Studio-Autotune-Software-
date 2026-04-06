/**
 * ECHO AI - STUDIO ENGINE
 * Inclusief Autotune, Beat Sync en AI Studio Filters
 */

let mic, beat, recorder, chunks = [];
let pitchShift, reverb, compressor, equalizer, limiter;

// UI Selectoren
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift');
const pitchValDisplay = document.getElementById('pitch-val');

// Filter Status Tracker
let filters = { reverb: false, warmth: false, compress: false, bright: false };

/**
 * Initialiseert de volledige audio engine en de AI-effectenketen
 */
async function setupAudioEngine() {
    // Start de Tone.js audio context
    await Tone.start();
    console.log("Audio Engine Gevirtualiseerd...");

    // 1. Bron: Microfoon input
    mic = new Tone.UserMedia();

    // 2. Effecten Keten Configuratie
    pitchShift = new Tone.PitchShift(0);             // De "Autotune" basis
    reverb = new Tone.Reverb({ decay: 2.5, wet: 0 }); // De studio-galm
    compressor = new Tone.Compressor(-24, 4);        // Voor een constant volume
    equalizer = new Tone.EQ3(0, 0, 0);               // Voor Warmte en Helderheid
    limiter = new Tone.Limiter(-1).toDestination();  // Voorkomt vervorming/clipping

    // 3. Verbind de keten: Mic -> Pitch -> EQ -> Comp -> Reverb -> Limiter
    mic.chain(pitchShift, equalizer, compressor, reverb, limiter);

    // 4. Opname Setup (MediaStream van de limiter opvangen)
    const dest = Tone.context.createMediaStreamDestination();
    limiter.connect(dest);
    
    recorder = new MediaRecorder(dest.stream);
    recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = saveFile;
}

/**
 * Filter Bediening Logica
 */
document.getElementById('filter-reverb').onclick = (e) => {
    filters.reverb = !filters.reverb;
    reverb.wet.value = filters.reverb ? 0.4 : 0;
    e.target.classList.toggle('active-filter');
};

document.getElementById('filter-warmth').onclick = (e) => {
    filters.warmth = !filters.warmth;
    equalizer.low.value = filters.warmth ? 6 : 0;   // Geeft body aan de stem
    equalizer.high.value = filters.warmth ? -3 : 0; // Maakt het minder schel
    e.target.classList.toggle('active-filter');
};

document.getElementById('filter-compress').onclick = (e) => {
    filters.compress = !filters.compress;
    compressor.threshold.value = filters.compress ? -40 : -24;
    e.target.classList.toggle('active-filter');
};

// Nieuwe 'Bright' filter voor extra AI-helderheid
if(document.getElementById('filter-bright')) {
    document.getElementById('filter-bright').onclick = (e) => {
        filters.bright = !filters.bright;
        equalizer.high.value = filters.bright ? 8 : 0;
        e.target.classList.toggle('active-filter');
    };
}

/**
 * Recording Functionaliteit
 */
btnRecord.onclick = async () => {
    if (!mic) await setupAudioEngine();
    
    chunks = [];
    try {
        await mic.open();
        
        // Start de beat als deze is ingeladen
        if (beat && beat.loaded) {
            beat.start();
            beat.connect(limiter); // Verbind beat direct met de limiter voor de opname
        }
        
        recorder.start();
        btnRecord.className = 'main-btn record-on';
        btnRecord.innerText = 'OPNEMEN...';
        btnStop.disabled = false;
        btnRecord.disabled = true;
    } catch (err) {
        console.error("Microfoon fout:", err);
        alert("Zorg dat je microfoon aanstaat!");
    }
};

btnStop.onclick = () => {
    recorder.stop();
    if (beat) beat.stop();
    mic.close();
    
    btnRecord.className = 'main-btn record-off';
    btnRecord.innerText = 'Start Opname';
    btnStop.disabled = true;
    btnRecord.disabled = false;
};

/**
 * Slider Logica voor Autotune
 */
pitchSlider.oninput = (e) => {
    const val = e.target.value;
    if (pitchValDisplay) pitchValDisplay.innerText = val;
    if (pitchShift) pitchShift.pitch = val;
};

/**
 * Beat Inladen
 */
beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        beat = new Tone.Player(url, () => {
            console.log("Beat succesvol geladen in Echo AI.");
        });
    }
};

/**
 * Export naar Bestand
 */
function saveFile() {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'echo-ai-masterpiece.wav';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}
