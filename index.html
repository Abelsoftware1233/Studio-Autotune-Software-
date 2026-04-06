<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abelsoftware123 AI Studio - Ultimate Master</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
    <style>
        :root {
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --accent-color: #38bdf8;
            --record-red: #ef4444;
            --text-color: #f8fafc;
            --success-green: #22c55e;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 15px;
        }

        .studio-container {
            background: var(--card-bg);
            padding: 2rem;
            border-radius: 28px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.6);
            width: 100%;
            max-width: 400px;
            border: 1px solid rgba(255,255,255,0.08);
        }

        header { text-align: center; margin-bottom: 20px; }
        .ai-badge { 
            font-size: 0.65rem; 
            background: rgba(74, 222, 128, 0.1); 
            color: #4ade80; 
            padding: 4px 10px; 
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            margin-bottom: 10px;
        }
        header h1 { margin: 0; font-size: 1.8rem; letter-spacing: -0.5px; }
        .ai-text { color: var(--accent-color); font-weight: 800; }
        header p { opacity: 0.5; font-size: 0.85rem; margin-top: 5px; }

        .visualizer-container {
            height: 12px;
            background: #0f172a;
            border-radius: 10px;
            margin-bottom: 25px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.05);
        }

        #meter-bar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, var(--accent-color), #818cf8);
            box-shadow: 0 0 15px var(--accent-color);
            transition: width 0.05s ease;
        }

        .control-group {
            background: rgba(0, 0, 0, 0.25);
            padding: 16px;
            border-radius: 18px;
            margin-bottom: 15px;
        }

        label { 
            display: block; 
            font-size: 0.75rem; 
            font-weight: 700; 
            margin-bottom: 10px; 
            color: var(--accent-color);
            letter-spacing: 0.5px;
        }

        input[type="file"] { width: 100%; color: #94a3b8; font-size: 0.75rem; }
        input[type="range"] { width: 100%; cursor: pointer; accent-color: var(--accent-color); }

        .filter-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        .filter-btn {
            background: #334155;
            border: none;
            color: white;
            padding: 12px;
            border-radius: 10px;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }

        .filter-btn.active-filter { 
            background: var(--accent-color); 
            color: #0f172a;
            font-weight: 700;
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
        }

        .action-buttons { display: flex; flex-direction: column; gap: 12px; margin-top: 25px; }

        .main-btn {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 14px;
            font-weight: 800;
            cursor: pointer;
            transition: 0.3s;
            text-transform: uppercase;
            font-size: 0.9rem;
        }

        .record-ready { background: var(--text-color); color: var(--bg-color); }
        .record-active { background: var(--record-red) !important; color: white; animation: pulse 1.5s infinite; }
        .save-btn { background: var(--success-green); color: white; display: none; }

        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { transform: scale(1.02); box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>

    <div class="studio-container">
        <header>
            <div class="ai-badge">● AI Engine Synced</div>
            <h1>Abelsoftware123 <span class="ai-text">AI</span> Studio</h1>
            <p>De toekomst van jouw stem.</p>
        </header>

        <div class="visualizer-container">
            <div id="meter-bar"></div>
        </div>

        <div class="control-group">
            <label>1. MUZIEK (BEAT SELECTEREN)</label>
            <input type="file" id="beat-upload" accept="audio/*">
        </div>

        <div class="control-group">
            <label>2. AUTOTUNE (PITCH: <span id="pitch-val">0</span>)</label>
            <input type="range" id="pitch-shift" min="-10" max="10" value="0" step="1">
        </div>

        <div class="control-group">
            <label>3. AI STUDIO FILTERS</label>
            <div class="filter-toggles">
                <button id="f-reverb" class="filter-btn">✨ REVERB</button>
                <button id="f-warmth" class="filter-btn">🔥 WARMTH</button>
                <button id="f-compress" class="filter-btn">🎙️ COMPRESS</button>
                <button id="f-smooth" class="filter-btn">🧬 SMOOTHING</button>
            </div>
        </div>

        <div class="action-buttons">
            <button id="btn-record" class="main-btn record-ready">Opname Starten</button>
            <button id="btn-stop" class="main-btn" style="background: #475569; color: white; display: none;">Stop & Mix Masteren</button>
            <button id="btn-save" class="main-btn save-btn">Download Jouw Track ⬇️</button>
        </div>
    </div>

    <script>
        let mic, beat, recorder, chunks = [];
        let pitchShift, reverb, compressor, equalizer, limiter, meter, masterBus;

        const btnRecord = document.getElementById('btn-record');
        const btnStop = document.getElementById('btn-stop');
        const btnSave = document.getElementById('btn-save');
        const beatUpload = document.getElementById('beat-upload');
        const pitchSlider = document.getElementById('pitch-shift');
        const meterBar = document.getElementById('meter-bar');

        let activeFilters = { reverb: false, warmth: false, compress: false, smooth: false };

        async function startEngine() {
            await Tone.start();
            
            // Audio Nodes
            mic = new Tone.UserMedia();
            meter = new Tone.Meter();
            pitchShift = new Tone.PitchShift(0);
            reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
            compressor = new Tone.Compressor(-25, 4);
            equalizer = new Tone.EQ3(0, 0, 0);
            
            // Master Mix Bus
            masterBus = new Tone.Gain(1);
            limiter = new Tone.Limiter(-1).toDestination();
            masterBus.connect(limiter);

            // Stem Keten
            mic.chain(pitchShift, equalizer, compressor, reverb, meter, masterBus);

            // Recorder Setup (neemt alles van de masterBus op)
            const dest = Tone.context.createMediaStreamDestination();
            masterBus.connect(dest);
            recorder = new MediaRecorder(dest.stream);
            
            recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => { btnSave.style.display = 'block'; };

            updateMeter();
        }

        function updateMeter() {
            requestAnimationFrame(updateMeter);
            if (meter) {
                const level = meter.getValue();
                const percentage = Math.max(0, Math.min(100, (level + 60) * 1.6));
                meterBar.style.width = percentage + "%";
            }
        }

        // Filter Click Handlers
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
            // Smoothing verlaagt scherpe tonen en maakt pitch vloeiender
            equalizer.high.value = activeFilters.smooth ? -6 : 0;
            this.classList.toggle('active-filter');
        };

        // Opname Logica
        btnRecord.onclick = async () => {
            if (!mic) await startEngine();
            chunks = [];
            try {
                await mic.open();
                
                // AUTO-SYNC: Beat en recorder exact tegelijk starten
                if (beat && beat.loaded) {
                    beat.connect(masterBus);
                    beat.start();
                }
                
                recorder.start();
                btnRecord.style.display = 'none';
                btnStop.style.display = 'block';
                btnStop.classList.add('record-active');
                btnSave.style.display = 'none';
            } catch (err) {
                alert("Geen microfoon gevonden. Controleer je instellingen.");
            }
        };

        btnStop.onclick = () => {
            recorder.stop();
            if (beat) beat.stop();
            mic.close();
            btnStop.style.display = 'none';
            btnRecord.style.display = 'block';
            btnRecord.innerText = "Nieuwe Sessie";
        };

        btnSave.onclick = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'EchoAI_Master_Track.wav';
            a.click();
        };

        // Inputs
        beatUpload.onchange = (e) => {
            const file = e.target.files[0];
            if (file) beat = new Tone.Player(URL.createObjectURL(file));
        };

        pitchSlider.oninput = (e) => {
            const val = e.target.value;
            document.getElementById('pitch-val').innerText = val;
            if (pitchShift) pitchShift.pitch = val;
        };
    </script>
</body>
</html>
