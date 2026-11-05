const FALLBACK_DATA = {
    "Número de apertura": {
        "Verso 1": {
            "Soprano": { audioUrl: "https://drive.google.com/file/d/1LGs6Fv-lQfxxFC6pgnqfvEN4mlKMSfbR/view?usp=drive_link", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", singers: ["Sarah", "Emily", "Jessica"] },
            "Alto": { audioUrl: "https://drive.google.com/file/d/2aBcDeFgHiJkLmNoPqRsTuVwXyZ/view", videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U", singers: ["Amanda", "Rachel"] },
            "Tenor": { audioUrl: "https://drive.google.com/file/d/3aBcDeFgHiJkLmNoPqRsTuVwXyZ/view", videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4", singers: ["Mike", "John"] }
        },
        "Estribillo": {
            "Soprano": { audioUrl: "https://drive.google.com/file/d/4aBcDeFgHiJkLmNoPqRsTuVwXyZ/view", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", singers: ["Sarah", "Emily", "Jessica"] },
            "Alto": { audioUrl: "https://drive.google.com/file/d/5aBcDeFgHiJkLmNoPqRsTuVwXyZ/view", videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U", singers: ["Amanda", "Rachel"] },
            "Tenor": { audioUrl: "https://drive.google.com/file/d/6aBcDeFgHiJkLmNoPqRsTuVwXyZ/view", videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4", singers: ["Mike", "John"] }
        }
    },
    "La gran balada": {
        "Canción completa": {
            "Principal": { audioUrl: "https://drive.google.com/file/d/7aBcDeFgHiJkLmNoPqRsTuVwXyZ/view", videoUrl: "https://www.youtube.com/watch?v=4VGov1MFX_g", singers: ["Alex (Principal)"] },
            "Coro de apoyo": { audioUrl: "https://drive.google.com/file/d/1LGs6Fv-lQfxxFC6pgnqfvEN4mlKMSfbR/view", videoUrl: "https://www.youtube.com/watch?v=JGwWNGJdvx8", singers: ["Todos los demás"] }
        }
    },
    "Prueba: video sin sección ni voz": {
        "": {
            "": {
                audioUrl: "",
                videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
                singers: [" "]
            }
        }
    }
};

const DATA_PATH = './resources/Voces - Principal.csv';

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

const EMPTY_LABEL = ' ';

function normalizeHeader(value) {
    return normalizeText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function pickField(row, keys) {
    for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }
    }
    return '';
}

function textForOption(value) {
    return value && String(value).trim() ? String(value).trim() : EMPTY_LABEL;
}

function parseSingers(value) {
    if (!value) return [EMPTY_LABEL];
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean).length ? value.map(item => String(item).trim()).filter(Boolean) : [EMPTY_LABEL];

    const text = String(value).trim();
    if (!text) return [EMPTY_LABEL];

    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
            const clean = parsed.map(item => String(item).trim()).filter(Boolean);
            return clean.length ? clean : [EMPTY_LABEL];
        }
    } catch (_) {
        // Ignore invalid JSON and fall through to comma/semicolon splitting.
    }

    const values = text
        .split(/[;,]/)
        .map(item => item.trim())
        .filter(Boolean);

    return values.length ? values : [EMPTY_LABEL];
}

function extractYouTubeId(value) {
    const text = normalizeText(value);
    if (!text) return '';

    // ID directo
    if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;

    // URL de YouTube
    try {
        const url = new URL(text);
        const v = url.searchParams.get('v');
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

        const parts = url.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (last && /^[a-zA-Z0-9_-]{11}$/.test(last)) return last;
    } catch (_) {
        // no-op
    }

    return text;
}

function extractDriveFileId(value) {
    const text = normalizeText(value);
    if (!text) return '';

    if (/^[a-zA-Z0-9_-]{20,}$/.test(text)) return text;

    try {
        const url = new URL(text);

        const idFromQuery = url.searchParams.get('id');
        if (idFromQuery && /^[a-zA-Z0-9_-]{20,}$/.test(idFromQuery)) {
            return idFromQuery;
        }

        const parts = url.pathname.split('/').filter(Boolean);
        const fileDIndex = parts.indexOf('d');
        if (fileDIndex >= 0 && parts[fileDIndex + 1] && /^[a-zA-Z0-9_-]{20,}$/.test(parts[fileDIndex + 1])) {
            return parts[fileDIndex + 1];
        }
    } catch (_) {
        // no-op
    }

    return '';
}

function resolveAudioPreviewUrl(value) {
    const fileId = extractDriveFileId(value);
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : '';
}

function resolveYouTubeEmbedUrl(value) {
    const videoId = extractYouTubeId(value);
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : '';
}

function rowsToMusicData(rows) {
    const data = {};

    rows.forEach((row) => {
        const song = pickField(row, ['song', 'cancion', 'songname']);
        if (!song) return;

        const section = pickField(row, ['section', 'seccion', 'sectionname']);
        const voice = pickField(row, ['voice', 'voz', 'voicename']);
        const audioUrl = pickField(row, ['audiourl', 'audio', 'enlaceaudio', 'linkaudio', 'grabacion', 'id', 'grabacionid', 'recordingid', 'fileid', 'driveid']);
        const videoUrl = pickField(row, ['videourl', 'video', 'youtubeurl', 'enlaceyoutube', 'linkyoutube', 'youtubeid', 'youtubecode', 'youtube']);
        const singers = parseSingers(pickField(row, ['singers', 'singer', 'cantantes', 'reparto']));

        const sectionKey = section || '';
        const voiceKey = voice || '';

        if (!data[song]) data[song] = {};
        if (!data[song][sectionKey]) data[song][sectionKey] = {};
        data[song][sectionKey][voiceKey] = { audioUrl, videoUrl, singers };
    });

    return data;
}

function parseCsvLine(line) {
    const out = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            out.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    out.push(current);
    return out;
}

function csvToRows(csvText) {
    const lines = csvText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .filter(line => line.trim() !== '');

    if (!lines.length) return [];

    const headers = parseCsvLine(lines[0]).map(h => normalizeHeader(h));
    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row = {};
        headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
        return row;
    });
}

async function loadMusicData() {
    try {
        audioStatus.textContent = 'Cargando música desde el archivo local...';
        audioStatus.hidden = false;

        const res = await fetch(`${DATA_PATH}?v=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const csvText = await res.text();
        const rows = csvToRows(csvText);
        const loadedData = rowsToMusicData(rows);

        if (!Object.keys(loadedData).length) {
            throw new Error('El CSV no tiene filas válidas.');
        }

        musicData = loadedData;
        audioStatus.hidden = true;
    } catch (error) {
        console.warn('No se pudo leer el CSV local, usando fallback:', error);
        musicData = FALLBACK_DATA;
        audioStatus.textContent = 'No se pudo cargar la información del archivo local. Revisa la ruta de resources/Voces - Principal.csv.';
        audioStatus.hidden = false;
    } finally {
        populateSongs();
    }
}

// 3. Populate Dropdowns
function populateSongs() {
    songSelect.innerHTML = '';
    const songs = Object.keys(musicData || {});
    songs.forEach((song) => {
        const option = document.createElement('option');
        option.value = song;
        option.textContent = song;
        songSelect.appendChild(option);
    });
    populateSections();
}

function populateSections() {
    sectionSelect.innerHTML = '';
    const currentSong = songSelect.value;
    if (!currentSong || !musicData[currentSong]) {
        voiceSelect.innerHTML = '';
        resetSelectionUI();
        return;
    }

    const sections = Object.keys(musicData[currentSong]);
    if (!sections.length) {
        voiceSelect.innerHTML = '';
        resetSelectionUI();
        return;
    }

    sections.forEach((section) => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = textForOption(section);
        sectionSelect.appendChild(option);
    });

    populateVoices();
}

function populateVoices() {
    voiceSelect.innerHTML = '';
    const currentSong = songSelect.value;
    const currentSection = sectionSelect.value;
    if (!currentSong || !musicData[currentSong]) {
        resetSelectionUI();
        return;
    }

    const currentSectionData = musicData[currentSong][currentSection];
    if (currentSectionData === undefined) {
        resetSelectionUI();
        return;
    }

    const voices = Object.keys(currentSectionData);
    if (!voices.length) {
        resetSelectionUI();
        return;
    }

    voices.forEach((voice) => {
        const option = document.createElement('option');
        option.value = voice;
        option.textContent = textForOption(voice);
        voiceSelect.appendChild(option);
    });

    updatePlayer();
}

function resolveTrackData(song, section, voice) {
    if (!song || !musicData[song]) return null;

    const songData = musicData[song];

    if (songData?.[section]?.[voice] !== undefined) {
        return songData[section][voice];
    }

    if (songData?.['']?.[''] !== undefined) {
        return songData[''][''];
    }

    if (section !== undefined && songData?.[section]?.[''] !== undefined) {
        return songData[section][''];
    }

    if (voice !== undefined && songData?.['']?.[voice] !== undefined) {
        return songData[''][voice];
    }

    return null;
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

function setVideoAvailable(embedUrl) {
    youtubePlayer.src = embedUrl;
    videoSection.hidden = false;
}

function resetSelectionUI() {
    audioPlayer.src = '';
    audioPlayer.hidden = true;
    audioStatus.textContent = '';
    audioStatus.hidden = true;

    singerInfo.textContent = EMPTY_LABEL;

    youtubePlayer.src = '';
    videoSection.hidden = true;
}

// 4. Update the Audio and Text
function updatePlayer() {
    const currentSong = songSelect.value;
    const currentSection = sectionSelect.value;
    const currentVoice = voiceSelect.value;

    if (!currentSong || !musicData[currentSong]) {
        resetSelectionUI();
        return;
    }

    const trackData = resolveTrackData(currentSong, currentSection, currentVoice);
    if (!trackData) {
        resetSelectionUI();
        return;
    }

    const audioPreviewUrl = resolveAudioPreviewUrl(trackData.audioUrl || trackData.id);
    if (audioPreviewUrl) {
        setAudioAvailable(audioPreviewUrl);
    } else {
        setAudioUnavailable('No hay audio disponible para esta selección.');
    }

    const youtubeEmbedUrl = resolveYouTubeEmbedUrl(trackData.videoUrl || trackData.youtubeId);
    if (youtubeEmbedUrl) {
        setVideoAvailable(youtubeEmbedUrl);
    } else {
        setVideoUnavailable();
    }

    singerInfo.textContent = (trackData.singers && trackData.singers.length)
        ? trackData.singers.join(', ')
        : EMPTY_LABEL;

    if (Array.isArray(trackData.singers) && trackData.singers.length === 1 && trackData.singers[0] === EMPTY_LABEL) {
        singerInfo.textContent = EMPTY_LABEL;
    }
}

// 5. Event Listeners (Cascade updates when a user changes a menu)
songSelect.addEventListener('change', populateSections);
sectionSelect.addEventListener('change', populateVoices);
voiceSelect.addEventListener('change', updatePlayer);

// 6. Initialize App on Load
loadMusicData();
