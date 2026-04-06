let mic, beat, pitchShift, recorder, chunks = [];

const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const beatUpload = document.getElementById('beat-upload');
const pitchSlider = document.getElementById('pitch-shift');
const pitchVal = document.getElementById('pitch-val');

// Initialiseer audio nodes
async function setupAudio() {
    await Tone.start();
    
    mic = new Tone.UserMedia();
    pitchShift = new Tone.PitchShift(0).toDestination();
    
    // Verbind mic aan PitchShift (Autotune)
    mic.connect(pitchShift);

    // Recorder om alles op te vangen
    const dest = Tone.context.createMediaStreamDestination();
    pitchShift.connect(dest);
    
    recorder = new MediaRecorder(dest.stream);
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = saveFile;
}

btnRecord.onclick = async () => {
    if (!mic) await setupAudio();
    
    chunks = [];
    await mic.open();
    
    // Start de beat als deze geüpload is
    if (beat) {
        beat.start();
        beat.connect(pitchShift); // Mix beat ook in de opname
    }
    
    recorder.start();
    btnRecord.className = 'record-on';
    btnRecord.innerText = 'Opnemen...';
    btnStop.disabled = false;
    btnRecord.disabled = true;
};

btnStop.onclick = () => {
    recorder.stop();
    if (beat) beat.stop();
    mic.close();
    
    btnRecord.className = 'record-off';
    btnRecord.innerText = 'Start Opname';
    btnStop.disabled = true;
    btnRecord.disabled = false;
};

// Autotune slider logica
pitchSlider.oninput = (e) => {
    const val = e.target.value;
    pitchVal.innerText = val;
    if (pitchShift) pitchShift.pitch = val;
};

// Beat inladen
beatUpload.onchange = (e) => {
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    beat = new Tone.Player(url);
};

function saveFile() {
    const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'echo-ai-studio-sessie.ogg';
    a.click();
}
