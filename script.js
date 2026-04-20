/**
 * Abelsoftware123 AI Studio - Complete Logic
 */

let mic, beat, recorder, chunks = [];
let pitchShift, reverb, compressor, equalizer, limiter, meter, masterBus, beatBus;

// 1. Koppel alle HTML elementen
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift');
const meterBar = document.getElementById('meter-bar');
const pitchValDisplay = document.getElementById('pitch-val');

let activeFilters = { reverb: false, warmth: false, compress: false, smooth: false };

/**
 * 2. DE AUDIO ENGINE OPBOUWEN
 */
async function startEngine() {
    await Tone.start();
    Tone.context.latencyHint = "fastest";
    
    // Nodes aanmaken
    mic = new Tone.UserMedia();
    meter = new Tone.Meter();
    pitchShift = new Tone.PitchShift(0); // Onze Autotune motor
    reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    compressor = new Tone.Compressor({ threshold: -25, ratio: 4 });
    equalizer = new Tone.EQ3(0, 0, 0);
    
    // Master routing
    masterBus = new Tone.Gain(1);
    limiter = new Tone.Limiter(-1).toDestination();
    masterBus.connect(limiter);

    beatBus = new Tone.Gain(0.8);
    beatBus.connect(masterBus);

    // Stem Ketting: Mic -> Pitch -> EQ -> Comp -> Reverb -> Meter -> Master
    mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

    // Recorder instellen
    const dest = Tone.context.createMediaStreamDestination();
    masterBus.connect(dest);
    recorder = new MediaRecorder(dest.stream);
    
    recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => { btnSave.style.display = 'block'; };

    updateMeter();
}

/**
 * 3. DE OPNAME LOGICA (DE FIX)
 */
btnRecord.onclick = async () => {
    try {
        // Stap A: Altijd eerst Tone.js activeren
        await Tone.start();
        
        // Stap B: Engine starten als dat nog niet gedaan is
        if (!mic) await startEngine();

        // Stap C: Microfoon openen en wachten op hardware
        await mic.open();
        
        // Stap D: Start alles na een korte pauze (voorkomt NotReadableError)
        setTimeout(() => {
            chunks = [];
            const now = Tone.now() + 0.1;

            if (beat && beat.loaded) {
                beat.connect(beatBus);
                beat.start(now);
            }
            
            if (recorder && recorder.state === "inactive") {
                recorder.start();
                
                // UI Bijwerken
                btnRecord.style.display = 'none';
                btnStop.style.display = 'block';
                btnStop.classList.add('record-active');
                btnSave.style.display = 'none';
            }
        }, 300); // 300ms is veilig voor de meeste Android toestellen
        
    } catch (err) {
        console.error("Studio Fout:", err);
        alert("Fout: Kon de microfoon niet starten. Controleer of de app rechten heeft.");
    }
};

/**
 * 4. STOPPEN EN OPSLAAN
 */
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

/**
 * 5. HULPFUNCTIES (Visualizer & Input)
 */
function updateMeter() {
    requestAnimationFrame(updateMeter);
    if (meter) {
        const level = meter.getValue();
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
        if (meterBar) meterBar.style.width = percentage + "%";
    }
}

// Handmatige Pitch Slider (Autotune effect)
pitchSlider.oninput = (e) => {
    const val = e.target.value;
    if (pitchValDisplay) pitchValDisplay.innerText = val;
    if (pitchShift) pitchShift.pitch = val;
};

// Beat uploaden
beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (beat) beat.dispose();
        beat = new Tone.Player(URL.createObjectURL(file), () => {
            console.log("Beat geladen!");
        });
    }
};

// Filter Logica
document.getElementById('f-reverb').onclick = function() {
    activeFilters.reverb = !activeFilters.reverb;
    reverb.wet.rampTo(activeFilters.reverb ? 0.45 : 0, 0.4);
    this.classList.toggle('active-filter');
};
// ... (voeg de andere filters op dezelfde manier toe)
