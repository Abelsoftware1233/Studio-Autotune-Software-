/**
 * Abelsoftware123 AI Studio - Core Logic
 * Integrated with Tone.js for real-time audio processing
 */

let mic, beat, recorder, chunks = [];
let pitchShift, reverb, compressor, equalizer, limiter, meter, masterBus;

// DOM Elements
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const btnSave = document.getElementById('btn-save');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift');
const meterBar = document.getElementById('meter-bar');
const pitchValDisplay = document.getElementById('pitch-val');

let activeFilters = { reverb: false, warmth: false, compress: false, smooth: false };

/**
 * Initializes the audio engine and nodes
 */
async function startEngine() {
    // Start Tone.js audio context
    await Tone.start();
    
    // Audio Nodes Setup
    mic = new Tone.UserMedia();
    meter = new Tone.Meter();
    pitchShift = new Tone.PitchShift(0);
    reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    compressor = new Tone.Compressor(-25, 4);
    equalizer = new Tone.EQ3(0, 0, 0);
    
    // Master Mix Bus Setup
    masterBus = new Tone.Gain(1);
    limiter = new Tone.Limiter(-1).toDestination();
    masterBus.connect(limiter);

    // Vocal Chain Routing
    mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

    // Recorder Setup (captures master output)
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
 * Visualizer Logic
 */
function updateMeter() {
    requestAnimationFrame(updateMeter);
    if (meter) {
        const level = meter.getValue();
        // Map decibels to percentage (approx -60dB to 0dB range)
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
        if (meterBar) meterBar.style.width = percentage + "%";
    }
}

/**
 * Filter Toggle Handlers
 */
document.getElementById('f-reverb').onclick = function() {
    if(!reverb) return;
    activeFilters.reverb = !activeFilters.reverb;
    reverb.wet.value = activeFilters.reverb ? 0.45 : 0;
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
    // Lower high frequencies for a smoother vocal tone
    equalizer.high.value = activeFilters.smooth ? -6 : 0;
    this.classList.toggle('active-filter');
};

/**
 * Recording Controls
 */
btnRecord.onclick = async () => {
    try {
        if (!mic) await startEngine();
        
        // Explicitly request microphone access
        await mic.open();
        
        chunks = [];
        
        // Play beat if loaded and sync with recorder
        if (beat && beat.loaded) {
            beat.connect(masterBus);
            beat.start();
        }
        
        recorder.start();
        
        // UI State Updates
        btnRecord.style.display = 'none';
        btnStop.style.display = 'block';
        btnStop.classList.add('record-active');
        btnSave.style.display = 'none';
        
    } catch (err) {
        console.error("Studio Error:", err);
        alert("Microphone Error: " + err.name + ". Please ensure site permissions are enabled.");
    }
};

btnStop.onclick = () => {
    if (recorder && recorder.state === "recording") recorder.stop();
    if (beat) beat.stop();
    if (mic) mic.close();
    
    // UI State Updates
    btnStop.style.display = 'none';
    btnStop.classList.remove('record-active');
    btnRecord.style.display = 'block';
    btnRecord.innerText = "New Session";
};

/**
 * Download Logic
 */
btnSave.onclick = () => {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'EchoAI_Master_Track.wav';
    a.click();
    
    // Clean up memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Input Event Listeners
 */
beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (beat) beat.dispose(); // Free memory from previous beat
        beat = new Tone.Player(URL.createObjectURL(file));
    }
};

pitchSlider.oninput = (e) => {
    const val = e.target.value;
    if (pitchValDisplay) pitchValDisplay.innerText = val;
    if (pitchShift) pitchShift.pitch = val;
};
