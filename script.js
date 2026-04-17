/**
 * Abelsoftware123 AI Studio - Ultimate Master Logic
 * Geoptimaliseerd voor: 
 * 1. Synchronisatie van beat & stem
 * 2. NotReadableError Fix (Microfoon stabiliteit)
 * 3. Lage latentie voor mobiel
 */

let mic, beat, recorder, chunks = [];
let pitchShift, reverb, compressor, equalizer, limiter, meter, masterBus, beatBus;

// DOM Elementen
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift');
const meterBar = document.getElementById('meter-bar');
const pitchValDisplay = document.getElementById('pitch-val');

let activeFilters = { reverb: false, warmth: false, compress: false, smooth: false };

/**
 * 1. INITIALISEER AUDIO ENGINE
 */
async function startEngine() {
    // Stel Tone in op de laagst mogelijke vertraging voor strakke sync
    await Tone.start();
    Tone.context.latencyHint = "fastest";
    
    // Audio Nodes Setup
    mic = new Tone.UserMedia();
    meter = new Tone.Meter();
    pitchShift = new Tone.PitchShift(0);
    reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    compressor = new Tone.Compressor({ threshold: -25, ratio: 4 });
    equalizer = new Tone.EQ3(0, 0, 0);
    
    // Master Bus & Limiter (Voorkomt kraken/clipping)
    masterBus = new Tone.Gain(1);
    limiter = new Tone.Limiter(-1).toDestination();
    masterBus.connect(limiter);

    // Beat Bus (Aparte ingang voor de beat om volume/sync te regelen)
    beatBus = new Tone.Gain(0.8); // Beat staat standaard op 80% voor betere stem-balans
    beatBus.connect(masterBus);

    // Stem Keten Routing
    mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

    // Recorder Setup (neemt ALLES op wat naar de masterBus gaat)
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
    return true;
}

/**
 * 2. VISUALIZER LOGICA
 */
function updateMeter() {
    requestAnimationFrame(updateMeter);
    if (meter) {
        const level = meter.getValue();
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
        if (meterBar) meterBar.style.width = percentage + "%";
    }
}

/**
 * 3. AI FILTER TOGGLES
 */
document.getElementById('f-reverb').onclick = function() {
    if(!reverb) return;
    activeFilters.reverb = !activeFilters.reverb;
    reverb.wet.rampTo(activeFilters.reverb ? 0.45 : 0, 0.4);
    this.classList.toggle('active-filter');
};

document.getElementById('f-warmth').onclick = function() {
    if(!equalizer) return;
    activeFilters.warmth = !activeFilters.warmth;
    equalizer.low.value = activeFilters.warmth ? 9 : 0;
    this.classList.toggle('active-filter');
};

document.getElementById('f-compress').onclick = function() {
    if(!compressor) return;
    activeFilters.compress = !activeFilters.compress;
    compressor.threshold.value = activeFilters.compress ? -45 : -25;
    this.classList.toggle('active-filter');
};

document.getElementById('f-smooth').onclick = function() {
    if(!equalizer) return;
    activeFilters.smooth = !activeFilters.smooth;
    equalizer.high.value = activeFilters.smooth ? -6 : 0;
    this.classList.toggle('active-filter');
};

/**
 * 4. RECORDING & SYNC LOGICA
 */
btnRecord.onclick = async () => {
    try {
        if (!mic) await startEngine();
        
        // Forceer audio context naar 'running' voor Android Chrome
        if (Tone.context.state !== 'running') {
            await Tone.context.resume();
        }

        // Vraag toegang tot microfoon
        await mic.open();
        
        // SYNC FIX: Geef hardware 300ms de tijd om 'NotReadableError' te voorkomen
        setTimeout(() => {
            chunks = [];
            
            // Start beat en recorder exact tegelijk via Tone.now()
            const now = Tone.now() + 0.1;

            if (beat && beat.loaded) {
                beat.connect(beatBus);
                beat.start(now);
            }
            
            if (recorder && recorder.state === "inactive") {
                recorder.start();
                
                // UI Updates
                btnRecord.style.display = 'none';
                btnStop.style.display = 'block';
                btnStop.classList.add('record-active');
                btnSave.style.display = 'none';
            }
        }, 300);
        
    } catch (err) {
        console.error("Studio Error:", err);
        if (err.name === 'NotReadableError') {
            alert("Microfoon Fout: Waarschijnlijk is de microfoon in gebruik door een andere app (WhatsApp/Camera). Sluit deze en probeer het opnieuw.");
        } else {
            alert("Microfoon Error: " + err.name);
        }
    }
};

btnStop.onclick = () => {
    if (recorder && recorder.state === "recording") recorder.stop();
    if (beat) beat.stop();
    if (mic) mic.close();
    
    // UI Updates
    btnStop.style.display = 'none';
    btnStop.classList.remove('record-active');
    btnRecord.style.display = 'block';
    btnRecord.innerText = "New Session";
};

/**
 * 5. DOWNLOAD LOGICA
 */
btnSave.onclick = () => {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AbelAI_Studio_Master_${Date.now()}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * 6. INPUT HANDLERS
 */
beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (beat) beat.dispose();
        beat = new Tone.Player(URL.createObjectURL(file), () => {
            console.log("Beat succesvol geladen");
        });
    }
};

pitchSlider.oninput = (e) => {
    const val = e.target.value;
    if (pitchValDisplay) pitchValDisplay.innerText = val;
    if (pitchShift) pitchShift.pitch = val;
};
