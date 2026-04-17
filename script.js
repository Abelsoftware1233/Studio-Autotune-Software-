/**
 * ECHO AI - MASTER STUDIO SCRIPT v2.3
 * Functies: Autotune, AI Filters, Auto-Sync & Recording + Download Fix
 */

// --- 0. NATIVE PERMISSION TRIGGER ---
window.onload = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log("Microfoontoegang verleend.");
                stream.getTracks().forEach(track => track.stop()); 
            })
            .catch(err => {
                console.warn("Systeempermissie nodig:", err);
            });
    }
};

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

let activeFilters = { reverb: false, warmth: false, compress: false, smooth: false };

/**
 * 1. INITIALISEER AUDIO ENGINE
 */
async function initStudio() {
    try {
        await Tone.start();
        mic = new Tone.UserMedia();
        meter = new Tone.Meter();
        
        pitchShift = new Tone.PitchShift(0);
        pitchShift.windowSize = 0.1;

        reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.01, wet: 0 });
        await reverb.generate(); 

        compressor = new Tone.Compressor({ threshold: -25, ratio: 4, attack: 0.003, release: 0.25 });
        equalizer = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
        
        masterBus = new Tone.Gain(1);
        limiter = new Tone.Limiter(-1).toDestination();
        masterBus.connect(limiter);

        mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

        const dest = Tone.context.createMediaStreamDestination();
        masterBus.connect(dest);
        
        recorder = new MediaRecorder(dest.stream);
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = () => {
            if (btnSave) {
                btnSave.style.display = 'block';
                btnSave.classList.add('ready-to-save');
            }
            console.log("Opname klaar voor download.");
        };

        updateVisualizer();
        return true;
    } catch (err) {
        console.error("Init Fout:", err);
        return false;
    }
}

/**
 * 2. VISUALIZER
 */
function updateVisualizer() {
    requestAnimationFrame(updateVisualizer);
    if (meter && meterBar) {
        const level = meter.getValue();
        const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
        meterBar.style.width = percentage + "%";
        meterBar.style.backgroundColor = level > -3 ? "#ff4d4d" : "#00d2ff";
    }
}

/**
 * 3. AI FILTER LOGICA
 */
window.toggleFilter = function(type, btn) {
    if (!mic) initStudio();
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
            break;
    }
};

/**
 * 4. RECORDING CONTROLS
 */
btnRecord.onclick = async () => {
    const success = await initStudio();
    if (!success) {
        alert("Toegang geweigerd. Check Android instellingen.");
        return;
    }
    
    chunks = [];
    try {
        await mic.open();
        setTimeout(() => {
            if (beat && beat.loaded) beat.start();
            recorder.start();
            isRecording = true;
            btnRecord.style.display = 'none';
            btnStop.style.display = 'block';
            if (btnSave) btnSave.style.display = 'none';
        }, 200);
    } catch (err) {
        alert("Microfoon fout.");
    }
};

btnStop.onclick = () => {
    if (recorder && recorder.state === "recording") recorder.stop();
    if (beat) beat.stop();
    if (mic) mic.close();
    isRecording = false;
    btnStop.style.display = 'none';
    btnRecord.style.display = 'block';
    btnRecord.innerText = "Nieuwe Sessie";
};

/**
 * 5. AUTOTUNE / PITCH
 */
if (pitchSlider) {
    pitchSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        if (pitchValDisplay) pitchValDisplay.innerText = val;
        if (pitchShift) pitchShift.pitch = val;
    };
}

/**
 * 6. BEAT UPLOAD
 */
if (beatUpload) {
    beatUpload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (beat) beat.dispose();
            beat = new Tone.Player(url, () => {
                beat.connect(masterBus);
                alert("Beat geladen!");
            }).toDestination();
        }
    };
}

/**
 * 7. DOWNLOAD / SAVE FUNCTIE (COMPLEET)
 */
if (btnSave) {
    btnSave.onclick = () => {
        if (chunks.length === 0) {
            alert("Geen opname gevonden.");
            return;
        }
        
        // Maak van de stukjes data één audiobestand
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        // Maak een onzichtbare download-link aan
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        link.href = url;
        link.download = `EchoAI_Studio_Track_${timestamp}.wav`;
        
        // Voeg toe aan document, klik erop, en verwijder weer
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Geef geheugen weer vrij
        window.URL.revokeObjectURL(url);
        console.log("Bestand gedownload.");
    };
}
