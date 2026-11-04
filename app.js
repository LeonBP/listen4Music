const FALLBACK_DATA = {
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

const SHEET_ID = "YOUR_GOOGLE_SHEET_ID";
const SHEET_NAME = "Sheet1";

let musicData = {};

// 2. DOM Elements
const songSelect = document.getElementById('song-select');
const sectionSelect = document.getElementById('section-select');
const voiceSelect = document.getElementById('voice-select');
const audioPlayer = document.getElementById('audio-player');
const singerInfo = document.getElementById('singer-info');
const audioStatus = document.getElementById('audio-status');
const youtubePlayer = document.getElementById('youtube-player');
const videoSection = document.getElementById('video-section');

function normalizeText(value) {
    return String(value ?? '').trim();
}

function parseSingers(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);

    const text = String(value).trim();
    if (!text) return [];

    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
            return parsed.map(item => String(item).trim()).filter(Boolean);
        }
    } catch (_) {
        // Ignore invalid JSON and fall through to comma/semicolon splitting.
    }

    return text
        .split(/[;,]/)
        .map(item => item.trim())
        .filter(Boolean);
}

function rowsToMusicData(rows) {
    const data = {};

    rows.forEach((row) => {
        const song = normalizeText(
            row.song ?? row.Song ?? row['Canción'] ?? row['Song Name']
        );
        const section = normalizeText(
            row.section ?? row.Section ?? row['Sección'] ?? row['Section Name']
        );
        const voice = normalizeText(
            row.voice ?? row.Voice ?? row['Voz'] ?? row['Voice Name']
        );
        const id = normalizeText(
            row.id ?? row.ID ?? row['Grabación ID'] ?? row['Recording ID'] ?? row['drive_id']
        );
        const youtubeId = normalizeText(
            row.youtubeId ?? row['YouTube ID'] ?? row['youtube_id'] ?? row['youtubeid']
        );
        const singers = parseSingers(
            row.singers ?? row.Singer ?? row.Singers ?? row['Cantantes'] ?? row['Reparto']
        );

        if (!song || !section || !voice) return;

        if (!data[song]) data[song] = {};
        if (!data[song][section]) data[song][section] = {};

        data[song][section][voice] = { id, youtubeId, singers };
    });

    return data;
}

async function loadMusicData() {
    const sheetId = SHEET_ID.trim();
    const sheetName = SHEET_NAME.trim();

    if (!sheetId || sheetId === 'YOUR_GOOGLE_SHEET_ID') {
        musicData = FALLBACK_DATA;
        populateSongs();
        return;
    }

    try {
        audioStatus.textContent = 'Cargando música desde la hoja de Google...';
        audioStatus.hidden = false;

        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        const jsonText = text.slice(jsonStart, jsonEnd + 1);

        const parsed = JSON.parse(jsonText);
        const rows = (parsed.table?.rows ?? []).map((row) => {
            const result = {};
            (parsed.table?.cols ?? []).forEach((col, index) => {
                const value = row.c?.[index];
                result[col.label || col.id] = value && value.v !== undefined ? value.v : '';
            });
            return result;
        });

        const loadedData = rowsToMusicData(rows);

        if (Object.keys(loadedData).length > 0) {
            musicData = loadedData;
        } else {
            throw new Error('No data found in the Google Sheet.');
        }
    } catch (error) {
        console.warn('Falling back to local demo data:', error);
        musicData = FALLBACK_DATA;
    } finally {
        populateSongs();
        if (Object.keys(musicData).length) {
            audioStatus.hidden = true;
        }
    }
}

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

    if (!currentSong || !currentSection || !currentVoice) return;

    const trackData = musicData[currentSong]?.[currentSection]?.[currentVoice];

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

    singerInfo.textContent = (trackData.singers && trackData.singers.length)
        ? trackData.singers.join(', ')
        : 'Selecciona una pista para ver el reparto.';
}

// 5. Event Listeners (Cascade updates when a user changes a menu)
songSelect.addEventListener('change', populateSections);
sectionSelect.addEventListener('change', populateVoices);
voiceSelect.addEventListener('change', updatePlayer);

// 6. Initialize App on Load
loadMusicData();
