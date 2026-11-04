// 1. Your Database
// Replace the 'id' values with your actual Google Drive file IDs.
const musicData = {
    "Número de apertura": {
        "Verso 1": {
            "Soprano": { id: "1aBcDeFgHiJkLmNoPqRsTuVwXyZ", youtubeId: "dQw4w9WgXcQ", singers: ["Sarah", "Emily", "Jessica"] },
            "Alto": { id: "2aBcDeFgHiJkLmNoPqRsTuVwXyZ", youtubeId: "ysz5S6PUM-U", singers: ["Amanda", "Rachel"] },
            "Tenor": { id: "3aBcDeFgHiJkLmNoPqRsTuVwXyZ", youtubeId: "ScMzIvxBSi4", singers: ["Mike", "John"] }
        },
        "Estribillo": {
            "Soprano": { id: "4aBcDeFgHiJkLmNoPqRsTuVwXyZ", youtubeId: "dQw4w9WgXcQ", singers: ["Sarah", "Emily", "Jessica"] },
            "Alto": { id: "5aBcDeFgHiJkLmNoPqRsTuVwXyZ", youtubeId: "ysz5S6PUM-U", singers: ["Amanda", "Rachel"] },
            "Tenor": { id: "6aBcDeFgHiJkLmNoPqRsTuVwXyZ", youtubeId: "ScMzIvxBSi4", singers: ["Mike", "John"] }
        }
    },
    "La gran balada": {
        "Canción completa": {
            "Principal": { id: "7aBcDeFgHiJkLmNoPqRsTuVwXyZ", youtubeId: "JGwWNGJdvx8", singers: ["Alex (Principal)"] },
            "Coro de apoyo": { id: "1LGs6Fv-lQfxxFC6pgnqfvEN4mlKMSfbR", youtubeId: "JGwWNGJdvx8", singers: ["Todos los demás"] }
        }
    }
};

// 2. DOM Elements
const songSelect = document.getElementById('song-select');
const sectionSelect = document.getElementById('section-select');
const voiceSelect = document.getElementById('voice-select');
const audioPlayer = document.getElementById('audio-player');
const singerInfo = document.getElementById('singer-info');
const audioStatus = document.getElementById('audio-status');
const youtubePlayer = document.getElementById('youtube-player');
const videoSection = document.getElementById('video-section');

// 3. Populate Dropdowns
function populateSongs() {
    songSelect.innerHTML = '';
    for (let song in musicData) {
        let option = document.createElement('option');
        option.value = song;
        option.textContent = song;
        songSelect.appendChild(option);
    }
    populateSections();
}

function populateSections() {
    sectionSelect.innerHTML = '';
    const currentSong = songSelect.value;
    for (let section in musicData[currentSong]) {
        let option = document.createElement('option');
        option.value = section;
        option.textContent = section;
        sectionSelect.appendChild(option);
    }
    populateVoices();
}

function populateVoices() {
    voiceSelect.innerHTML = '';
    const currentSong = songSelect.value;
    const currentSection = sectionSelect.value;
    
    for (let voice in musicData[currentSong][currentSection]) {
        let option = document.createElement('option');
        option.value = voice;
        option.textContent = voice;
        voiceSelect.appendChild(option);
    }
    updatePlayer();
}

function setAudioUnavailable(message) {
    audioPlayer.src = '';
    audioPlayer.hidden = true;
    audioStatus.textContent = message;
    audioStatus.hidden = false;
}

function setAudioAvailable(src) {
    audioPlayer.src = src;
    audioPlayer.hidden = false;
    audioStatus.hidden = true;
}

function setVideoUnavailable() {
    youtubePlayer.src = '';
    videoSection.hidden = true;
}

function setVideoAvailable(videoId) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    youtubePlayer.src = embedUrl;
    videoSection.hidden = false;
}

// 4. Update the Audio and Text
function updatePlayer() {
    const currentSong = songSelect.value;
    const currentSection = sectionSelect.value;
    const currentVoice = voiceSelect.value;
    
    // Safety check in case menus are empty during transitions
    if (!currentSong || !currentSection || !currentVoice) return;

    const trackData = musicData[currentSong][currentSection][currentVoice];

    if (!trackData) {
        setAudioUnavailable('No hay audio disponible para esta selección.');
        setVideoUnavailable();
        return;
    }

    const driveBaseUrl = "https://drive.google.com/file/d/";

    if (trackData.id && typeof trackData.id === 'string' && trackData.id.trim() !== '') {
        setAudioAvailable(driveBaseUrl + trackData.id + "/preview");
    } else {
        setAudioUnavailable('No hay audio disponible para esta selección.');
    }

    if (trackData.youtubeId && typeof trackData.youtubeId === 'string' && trackData.youtubeId.trim() !== '') {
        setVideoAvailable(trackData.youtubeId);
    } else {
        setVideoUnavailable();
    }

    // Update the singers text
    singerInfo.textContent = trackData.singers.join(', ');
}

// 5. Event Listeners (Cascade updates when a user changes a menu)
songSelect.addEventListener('change', populateSections);
sectionSelect.addEventListener('change', populateVoices);
voiceSelect.addEventListener('change', updatePlayer);

// 6. Initialize App on Load
populateSongs();
