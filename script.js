/**
 * Abelsoftware123 AI Studio - Master Script
 * Full Version: Autotune, Filters, Recording & Android Fix
 */

// --- 1. GLOBALE VARIABELEN ---
let mic, beat, recorder, chunks = [];
let pitchShift, reverb, compressor, equalizer, limiter, meter, masterBus, beatBus;
let analyser, dataArray;

let activeFilters = {
    autotune: true,
    reverb: false,
    warmth: false,
    compress: false,
    smooth: false
};

// C-Majeur Toonladder Frequenties (Hz)
const targetScale = [
    130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94,
    261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88
];

// --- 2. HTML ELEMENTEN ---
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift');
const meterBar = document.getElementById('meter-bar');
const pitchValDisplay = document.getElementById('pitch-val');

// --- 3. AUDIO ENGINE ---
async function startEngine() {
    await Tone.start();
    Tone.context.latencyHint = "fastest";
    
    mic = new Tone.UserMedia();
    meter = new Tone.Meter();
    pitchShift = new Tone.PitchShift(0);
    reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    compressor = new Tone.Compressor({ threshold: -25, ratio: 4 });
    equalizer = new Tone.EQ3(0, 0, 0);
    
    analyser = Tone.context.createAnalyser();
    analyser.fftSize = 2048;
    dataArray = new Float32Array(analyser.fftSize);

    masterBus = new Tone.Gain(1);
    limiter = new Tone.Limiter(-1).toDestination();
    masterBus.connect(limiter);
    beatBus = new Tone.Gain(0.8).connect(masterBus);

    // KETTING: Mic -> Pitch -> EQ -> Comp -> Reverb -> Analyser -> Master
    mic.chain(pitchShift, equalizer, compressor, reverb, meter, analyser, masterBus);

    const dest = Tone.context.createMediaStreamDestination();
    masterBus.connect(dest);
    recorder = new MediaRecorder(dest.stream);
    
    recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => { btnSave.style.display = 'block'; };

    updateMeter();
    runAutotune(); // Start de automatische correctie
}

// --- 4. AUTOTUNE LOGICA (AUTOMATISCH) ---
function runAutotune() {
    if (!analyser || !activeFilters.autotune) {
        requestAnimationFrame(runAutotune);
        return;
    }

    analyser.getFloatTimeDomainData(dataArray);
    let freq = autoCorrelate(dataArray, Tone.context.sampleRate);

    if (freq !== -1 && freq > 80 && freq < 1000) {
        let closestNote = targetScale.reduce((prev, curr) => 
            Math.abs(curr - freq) < Math.abs(prev - freq) ? curr : prev
        );

        // Bereken verschil in halve tonen
        let diff = 12 * Math.log2(closestNote / freq);
        
        // Pas pitch aan (met een kleine smoothing factor)
        pitchShift.pitch = Tone.interpolate(pitchShift.pitch, diff, 0.5);
    }
    
    requestAnimationFrame(runAutotune);
}

// --- 5. WISKUNDE (PITCH DETECTION) ---
function autoCorrelate(buffer, sampleRate) {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    if (Math.sqrt(rms / SIZE) < 0.01) return -1;

    let c = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buffer[j] * buffer[j + i];
    }

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    return sampleRate / maxpos;
}

// --- 6. CONTROLS & EVENTS ---
btnRecord.onclick = async () => {
    try {
        await Tone.start();
        if (!mic) await startEngine();
        await mic.open();
        
        setTimeout(() => {
            chunks = [];
            if (beat && beat.loaded) beat.start(Tone.now() + 0.1);
            if (recorder && recorder.state === "inactive") {
                recorder.start();
                btnRecord.style.display = 'none';
                btnStop.style.display = 'block';
                btnStop.classList.add('record-active');
            }
        }, 300);
    } catch (err) { alert("Microfoon fout: " + err.message); }
};

btnStop.onclick = () => {
    if (recorder?.state === "recording") recorder.stop();
    if (beat) beat.stop();
    if (mic) mic.close();
    btnStop.style.display = 'none';
    btnRecord.style.display = 'block';
};

btnSave.onclick = () => {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `AbelAI_Studio_${Date.now()}.wav`;
    a.click();
};

function updateMeter() {
    requestAnimationFrame(updateMeter);
    if (meter) {
        const level = meter.getValue();
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
        if (meterBar) meterBar.style.width = percentage + "%";
    }
}

// Filter knoppen
document.getElementById('f-reverb').onclick = function() {
    activeFilters.reverb = !activeFilters.reverb;
    reverb.wet.rampTo(activeFilters.reverb ? 0.5 : 0, 0.4);
    this.classList.toggle('active-filter');
};

beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) beat = new Tone.Player(URL.createObjectURL(file)).toDestination();
};
function autoCorrelate(buffer, sampleRate) {
    // Verwijder stilte
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
        rms += buffer[i] * buffer[i];
    }
    if (Math.sqrt(rms / SIZE) < 0.01) return -1; // Te zacht

    // Zoek het herhalende patroon in de golf
    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

    let c = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
            c[i] = c[i] + buffer[j] * buffer[j + i];
        }
    }

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }

    return sampleRate / maxpos; // De gevonden frequentie in Hz
}
