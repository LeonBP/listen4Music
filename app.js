// 1. Your Database
// Replace the 'id' values with your actual Google Drive file IDs.
const musicData = {
    "Opening Number": {
        "Verse 1": {
            "Soprano": { id: "1aBcDeFgHiJkLmNoPqRsTuVwXyZ", singers: ["Sarah", "Emily", "Jessica"] },
            "Alto": { id: "2aBcDeFgHiJkLmNoPqRsTuVwXyZ", singers: ["Amanda", "Rachel"] },
            "Tenor": { id: "3aBcDeFgHiJkLmNoPqRsTuVwXyZ", singers: ["Mike", "John"] }
        },
        "Chorus": {
            "Soprano": { id: "4aBcDeFgHiJkLmNoPqRsTuVwXyZ", singers: ["Sarah", "Emily", "Jessica"] },
            "Alto": { id: "5aBcDeFgHiJkLmNoPqRsTuVwXyZ", singers: ["Amanda", "Rachel"] },
            "Tenor": { id: "6aBcDeFgHiJkLmNoPqRsTuVwXyZ", singers: ["Mike", "John"] }
        }
    },
    "The Big Ballad": {
        "Full Song": {
            "Lead": { id: "7aBcDeFgHiJkLmNoPqRsTuVwXyZ", singers: ["Alex (Lead)"] },
            "Backing Choir": { id: "1LGs6Fv-lQfxxFC6pgnqfvEN4mlKMSfbR", singers: ["Everyone else"] }
        }
    }
};

// 2. DOM Elements
const songSelect = document.getElementById('song-select');
const sectionSelect = document.getElementById('section-select');
const voiceSelect = document.getElementById('voice-select');
const audioPlayer = document.getElementById('audio-player');
const singerInfo = document.getElementById('singer-info');

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

// 4. Update the Audio and Text
function updatePlayer() {
    const currentSong = songSelect.value;
    const currentSection = sectionSelect.value;
    const currentVoice = voiceSelect.value;
    
    // Safety check in case menus are empty during transitions
    if (!currentSong || !currentSection || !currentVoice) return;

    const trackData = musicData[currentSong][currentSection][currentVoice];
    
    // Format the Google Drive Direct Download Link
    const driveBaseUrl = "https://drive.google.com/file/d/";
    audioPlayer.src = driveBaseUrl + trackData.id + "/preview";
    
    // Update the singers text
    singerInfo.textContent = trackData.singers.join(", ");
}

// 5. Event Listeners (Cascade updates when a user changes a menu)
songSelect.addEventListener('change', populateSections);
sectionSelect.addEventListener('change', populateVoices);
voiceSelect.addEventListener('change', updatePlayer);

// 6. Initialize App on Load
populateSongs();
