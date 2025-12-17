

// --- State Management ---
const state = {
    isOn: false,
    mode: 'OFF', // 'OFF', 'BLUE_SCREEN', 'VIDEO', 'IMAGE'
    currentImage: null,
    originalImage: null,
    videoSrc: null,
    isProcessing: false,
    statusMessage: ''
};

// --- DOM Elements ---
const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    video: document.getElementById('tv-video'),
    image: document.getElementById('tv-image'),
    blueScreen: document.getElementById('blue-screen'),
    osdLayer: document.getElementById('osd-layer'),
    osdStatus: document.getElementById('osd-status'),
    osdClock: document.getElementById('osd-clock'),
    statusMsg: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    powerLed: document.getElementById('power-led'),
    remoteLight: document.getElementById('remote-light'),
    
    // Inputs
    fileInput: document.getElementById('file-input'),
    
    // Buttons
    tvPowerBtn: document.getElementById('tv-power-btn'),
    remotePowerBtn: document.getElementById('remote-power-btn'),
    uploadBtn: document.getElementById('upload-btn'),
    resetBtn: document.getElementById('reset-btn'),
    
    // Vents (just to populate)
    ventContainer: document.querySelector('.vent-strip').parentElement,
    speakerGrids: document.querySelectorAll('.speaker-grid')
};

// --- Assets ---
const VIDEO_ASSET = "../assets/alt bump.mp4"; 

// --- Initialization ---
function init() {
    populateDecorations();
    startClock();
    setupEventListeners();
    updateUI();
}

function populateDecorations() {
    // Fill top vents
    els.ventContainer.innerHTML = '';
    for(let i=0; i<24; i++) {
        const div = document.createElement('div');
        div.className = 'w-1 h-full bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)] mx-[1px]';
        els.ventContainer.appendChild(div);
    }
    
    // Fill speakers
    els.speakerGrids.forEach(grid => {
        grid.innerHTML = '';
        for(let i=0; i<36; i++) {
            const div = document.createElement('div');
            div.className = 'w-full h-[2px] bg-[#050505]';
            grid.appendChild(div);
        }
    });
}

function startClock() {
    setInterval(() => {
        const now = new Date();
        els.osdClock.innerText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }, 1000);
}

// --- Logic ---

function togglePower() {
    state.isOn = !state.isOn;
    state.isProcessing = false;
    
    if (state.isOn) {
        setStatus("INITIALIZING...");
        state.mode = 'BLUE_SCREEN';
        setTimeout(() => setStatus("READY"), 1500);
        setTimeout(() => clearStatus(), 2500);
    } else {
        state.mode = 'OFF';
        clearStatus();
    }
    updateUI();
}

function handleUpload(e) {
    if (!state.isOn || state.isProcessing) return;
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            state.originalImage = evt.target.result;
            state.currentImage = evt.target.result;
            state.videoSrc = null;
            state.mode = 'IMAGE';
            setStatus("IMAGE LOADED");
            setTimeout(clearStatus, 2000);
            updateUI();
        };
        reader.readAsDataURL(file);
    }
}

function handleReset() {
    if (!state.isOn || state.isProcessing) return;
    
    if (state.mode === 'VIDEO') {
        state.mode = 'BLUE_SCREEN';
        state.videoSrc = null;
        setStatus("EJECT");
    } else if (state.mode === 'IMAGE' && state.originalImage) {
        state.currentImage = state.originalImage;
        setStatus("RESET OK");
    }
    setTimeout(clearStatus, 1500);
    updateUI();
}

// --- UI Updates ---

function setStatus(msg) {
    state.statusMessage = msg;
    els.statusText.innerText = msg;
    els.statusMsg.classList.remove('hidden');
}

function clearStatus() {
    state.statusMessage = '';
    els.statusMsg.classList.add('hidden');
}

function updateUI() {
    if (state.isOn) {
        els.powerLed.classList.add('bg-red-500', 'shadow-[0_0_8px_#ff0000]', 'saturate-200');
        els.powerLed.classList.remove('bg-red-900');
        
        els.screenOff.classList.add('hidden');
        els.screenOn.classList.remove('hidden');
        
        els.uploadBtn.disabled = false;
        els.resetBtn.disabled = false;
    } else {
        els.powerLed.classList.remove('bg-red-500', 'shadow-[0_0_8px_#ff0000]', 'saturate-200');
        els.powerLed.classList.add('bg-red-900');
        
        els.screenOff.classList.remove('hidden');
        els.screenOn.classList.add('hidden');
        
        els.uploadBtn.disabled = true;
        els.resetBtn.disabled = true;
    }

    els.osdStatus.innerText = "PLAY ►";
    els.osdStatus.classList.add('text-green-500/80');
    els.osdStatus.classList.remove('text-red-500/80');

    els.blueScreen.classList.add('hidden');
    els.video.classList.add('hidden');
    els.image.classList.add('hidden');
    els.video.pause();

    if (state.isOn) {
        if (state.mode === 'BLUE_SCREEN') {
            els.blueScreen.classList.remove('hidden');
        } else if (state.mode === 'VIDEO' && state.videoSrc) {
            els.video.src = state.videoSrc;
            els.video.classList.remove('hidden');
            els.video.play().catch(e => console.log("Autoplay blocked", e));
        } else if (state.mode === 'IMAGE' && state.currentImage) {
            els.image.src = state.currentImage;
            els.image.classList.remove('hidden');
        }
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    els.tvPowerBtn.addEventListener('click', togglePower);
    els.remotePowerBtn.addEventListener('click', togglePower);
    els.uploadBtn.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', handleUpload);
    els.resetBtn.addEventListener('click', handleReset);
}

init();
