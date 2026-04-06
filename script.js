/**
 * ECHO AI - MASTER SCRIPT
 */

let mic, beat, recorder, chunks = [];
let pitchShift, reverb, compressor, equalizer, limiter, meter;

const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift');
const pitchValDisplay = document.getElementById('pitch-val');
const meterBar = document.getElementById('meter-bar');

let filters = { reverb: false, warmth: false, compress: false, bright: false };

async function initStudio() {
    await Tone.start();

    // 1. Inputs & Metering
    mic = new Tone.UserMedia();
    meter = new Tone.Meter(); // Meet het volume voor de visualizer

    // 2. Effecten
    pitchShift = new Tone.PitchShift(0);
    reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    compressor = new Tone.Compressor(-25, 5);
    equalizer = new Tone.EQ3(0, 0, 0);
    limiter = new Tone.Limiter(-1).toDestination();

    // 3. Connectie: Mic -> Pitch -> EQ -> Comp -> Reverb -> Meter -> Limiter
    mic.chain(pitchShift, equalizer, compressor, reverb, meter, limiter);

    // 4. Recorder Setup
    const dest = Tone.context.createMediaStreamDestination();
    limiter.connect(dest);
    recorder = new MediaRecorder(dest.stream);
    
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = saveRecording;

    // Start de visualizer loop
    updateVisualizer();
}

// De Visualizer Loop
function updateVisualizer() {
    requestAnimationFrame(updateVisualizer);
    if (meter) {
        // Krijg volume niveau in dB en zet om naar percentage (0-100)
        const level = meter.getValue(); 
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.5)); 
        meterBar.style.width = percentage + "%";
    }
}

// Filter Events
document.getElementById('filter-reverb').onclick = (e) => {
    filters.reverb = !filters.reverb;
    reverb.wet.value = filters.reverb ? 0.45 : 0;
    e.target.classList.toggle('active-filter');
};

document.getElementById('filter-warmth').onclick = (e) => {
    filters.warmth = !filters.warmth;
    equalizer.low.value = filters.warmth ? 7 : 0;
    e.target.classList.toggle('active-filter');
};

document.getElementById('filter-compress').onclick = (e) => {
    filters.compress = !filters.compress;
    compressor.threshold.value = filters.compress ? -45 : -25;
    e.target.classList.toggle('active-filter');
};

document.getElementById('filter-bright').onclick = (e) => {
    filters.bright = !filters.bright;
    equalizer.high.value = filters.bright ? 9 : 0;
    e.target.classList.toggle('active-filter');
};

// Recording Acties
btnRecord.onclick = async () => {
    if (!mic) await initStudio();
    chunks = [];
    try {
        await mic.open();
        if (beat) { beat.start(); beat.connect(limiter); }
        recorder.start();
        btnRecord.innerText = "OPNEMEN...";
        btnRecord.className = "main-btn record-on";
        btnRecord.disabled = true;
        btnStop.disabled = false;
    } catch (err) {
        alert("Microfoon niet gevonden.");
    }
};

btnStop.onclick = () => {
    recorder.stop();
    if (beat) beat.stop();
    mic.close();
    btnRecord.innerText = "Opname Starten";
    btnRecord.className = "main-btn record-off";
    btnRecord.disabled = false;
    btnStop.disabled = true;
};

pitchSlider.oninput = (e) => {
    const v = e.target.value;
    pitchValDisplay.innerText = v;
    if (pitchShift) pitchShift.pitch = v;
};

beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        beat = new Tone.Player(url);
    }
};

function saveRecording() {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'echo-ai-studio-sessie.webm';
    a.click();
}
