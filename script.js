/**
 * Abelsoftware123 AI Studio - Ultimate Master Logic
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
    await Tone.start();
    Tone.context.latencyHint = "fastest";
    
    mic = new Tone.UserMedia();
    meter = new Tone.Meter();
    pitchShift = new Tone.PitchShift(0);
    reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    compressor = new Tone.Compressor({ threshold: -25, ratio: 4 });
    equalizer = new Tone.EQ3(0, 0, 0);
    
    masterBus = new Tone.Gain(1);
    limiter = new Tone.Limiter(-1).toDestination();
    masterBus.connect(limiter);

    beatBus = new Tone.Gain(0.8);
    beatBus.connect(masterBus);

    // Stem Keten Routing
    mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

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
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = function() {
        const type = this.id.replace('f-', '');
        if (type === 'reverb' && reverb) {
            activeFilters.reverb = !activeFilters.reverb;
            reverb.wet.rampTo(activeFilters.reverb ? 0.45 : 0, 0.4);
        } else if (type === 'warmth' && equalizer) {
            activeFilters.warmth = !activeFilters.warmth;
            equalizer.low.value = activeFilters.warmth ? 9 : 0;
        } else if (type === 'compress' && compressor) {
            activeFilters.compress = !activeFilters.compress;
            compressor.threshold.value = activeFilters.compress ? -45 : -25;
        } else if (type === 'smooth' && equalizer) {
            activeFilters.smooth = !activeFilters.smooth;
            equalizer.high.value = activeFilters.smooth ? -6 : 0;
        }
        this.classList.toggle('active-filter');
    };
});

/**
 * 4. RECORDING & SYNC LOGICA
 */
btnRecord.onclick = async () => {
    try {
        await Tone.start();
        if (!mic) await startEngine();
        
        if (Tone.context.state !== 'running') {
            await Tone.context.resume();
        }

        // Stap 1: Open de microfoon en wacht op hardware bevestiging
        await mic.open();
        
        // Stap 2: Start de opname na een korte buffer voor stabiliteit
        setTimeout(() => {
            chunks = [];
            const now = Tone.now() + 0.1;

            if (beat && beat.loaded) {
                beat.connect(beatBus);
                beat.start(now);
            }
            
            if (recorder && recorder.state === "inactive") {
                recorder.start();
                
                btnRecord.style.display = 'none';
                btnStop.style.display = 'block';
                btnStop.classList.add('record-active');
                btnSave.style.display = 'none';
            }
        }, 200); // 200ms pauze voorkomt NotReadableError op Android
        
    } catch (err) {
        console.error("Studio Fout:", err);
        alert("Microfoon Fout: Controleer of andere apps de microfoon gebruiken.");
    }
};

btnStop.onclick = () => {
    if (recorder && recorder.state === "recording") recorder.stop();
    if (beat) beat.stop();
    if (mic) mic.close();
    
    btnStop.style.display = 'none';
    btnStop.classList.remove('record-active');
    btnRecord.style.display = 'block';
    btnRecord.innerText = "New Session";
};

/**
 * 5. DOWNLOAD & INPUT HANDLERS
 */
btnSave.onclick = () => {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AbelAI_Studio_${Date.now()}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (beat) beat.dispose();
        beat = new Tone.Player(URL.createObjectURL(file), () => {
            console.log("Beat geladen");
        });
    }
};

pitchSlider.oninput = (e) => {
    const val = e.target.value;
    if (pitchValDisplay) pitchValDisplay.innerText = val;
    if (pitchShift) pitchShift.pitch = val;
};
