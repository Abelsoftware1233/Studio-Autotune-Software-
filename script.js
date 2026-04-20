/**
 * Abelsoftware123 AI Studio - Volledige Master Logic
 */

let mic, beat, recorder, chunks = [];
let pitchShift, reverb, compressor, equalizer, limiter, meter, masterBus, beatBus;

// 1. DOM Elementen koppelen
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift'); // Voor Autotune effect
const meterBar = document.getElementById('meter-bar');
const pitchValDisplay = document.getElementById('pitch-val');

let activeFilters = { reverb: false, warmth: false, compress: false, smooth: false };

/**
 * 2. INITIALISEER AUDIO ENGINE
 */
async function startEngine() {
    await Tone.start();
    Tone.context.latencyHint = "fastest";
    
    // Nodes initialiseren
    mic = new Tone.UserMedia();
    meter = new Tone.Meter();
    
    // Autotune / PitchShift Node
    pitchShift = new Tone.PitchShift(0); 
    
    reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    compressor = new Tone.Compressor({ threshold: -25, ratio: 4 });
    equalizer = new Tone.EQ3(0, 0, 0);
    
    masterBus = new Tone.Gain(1);
    limiter = new Tone.Limiter(-1).toDestination();
    masterBus.connect(limiter);

    beatBus = new Tone.Gain(0.8);
    beatBus.connect(masterBus);

    // KETEN: Stem -> Autotune -> EQ -> Compressie -> Reverb -> Master
    mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

    // Recorder Setup
    const dest = Tone.context.createMediaStreamDestination();
    masterBus.connect(dest);
    recorder = new MediaRecorder(dest.stream);
    
    recorder.ondataavailable = e => { 
        if(e.data.size > 0) chunks.push(e.data); 
    };

    recorder.onstop = () => { 
        btnSave.style.display = 'block'; 
    };

    updateMeter();
}

/**
 * 3. RECORDING & SYNC LOGICA (Bugvrij voor Android)
 */
btnRecord.onclick = async () => {
    try {
        await Tone.start();
        if (!mic) await startEngine();
        
        // Microfoon openen
        await mic.open();
        
        // Kleine pauze voor hardware-stabiliteit
        setTimeout(() => {
            chunks = [];
            const now = Tone.now() + 0.1;

            if (beat && beat.loaded) {
                beat.connect(beatBus);
                beat.start(now);
            }
            
            if (recorder && recorder.state === "inactive") {
                recorder.start();
                
                // UI Wisselen
                btnRecord.style.display = 'none';
                btnStop.style.display = 'block';
                btnStop.classList.add('record-active');
                btnSave.style.display = 'none';
            }
        }, 200); 
        
    } catch (err) {
        console.error("Fout:", err);
    }
};

/**
 * 4. OVERIGE FUNCTIES (Visualizer, Filters, Stop, Save)
 */
function updateMeter() {
    requestAnimationFrame(updateMeter);
    if (meter) {
        const level = meter.getValue();
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
        if (meterBar) meterBar.style.width = percentage + "%";
    }
}

// Filter Toggles
const toggleFilter = (id, effect, prop, onVal, offVal) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.onclick = function() {
        activeFilters[prop] = !activeFilters[prop];
        effect.value = activeFilters[prop] ? onVal : offVal;
        this.classList.toggle('active-filter');
    };
};

// Handmatige Autotune (Pitch) Slider
pitchSlider.oninput = (e) => {
    const val = e.target.value;
    if (pitchValDisplay) pitchValDisplay.innerText = val;
    if (pitchShift) pitchShift.pitch = val;
};

btnStop.onclick = () => {
    if (recorder && recorder.state === "recording") recorder.stop();
    if (beat) beat.stop();
    if (mic) mic.close();
    
    btnStop.style.display = 'none';
    btnRecord.style.display = 'block';
    btnRecord.innerText = "New Session";
};

btnSave.onclick = () => {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AbelAI_Studio_${Date.now()}.wav`;
    a.click();
};

beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (beat) beat.dispose();
        beat = new Tone.Player(URL.createObjectURL(file));
    }
};
