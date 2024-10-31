const songs = [
    {
        title: "Capri Sun", artist: "B10", src: "../canciones/B10.mp3", cover: "../media/B10.jfif" 
    },
    {
        title: "Me enamora", artist: "El Morrales", src: "../canciones/Morrales.mp3", cover: "../media/Morrales.jfif"
    },
    {
        title: "Deutschland", artist: "Rammstein", src: "../canciones/Ramm.mp3", cover: "../media/ramm.jpg"
    },
    {
        title: "El Vaquilla", artist: "Los Chichos", src: "../canciones/Vaquilla.mp3", cover: "../media/vaquilla.jpg"
    }
];

let currentSongIndex = 0;
let song;
let radioStream = null;
let radios = [];
let progressInterval;

function setupEqualizer() {
    // Crear un contexto de audio
    audioContext = Howler.ctx;
    
    // Crear un analizador
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // Tamaño del FFT, puedes experimentar con diferentes valores
    const bufferLength = analyser.frequencyBinCount; // Número de frecuencias
    dataArray = new Uint8Array(bufferLength); // Array para almacenar los datos del analizador

    // Conectar la canción al analizador
    song._audio.nodes[0].connect(analyser); // Conecta el nodo de audio al analizador
    analyser.connect(audioContext.destination); // Conectar el analizador al destino (salida de audio)

    drawEqualizer(); // Iniciar la función de dibujo del ecualizador
}

function drawEqualizer() {
    const canvas = document.getElementById('equalizer');
    const canvasCtx = canvas.getContext('2d');
    const barWidth = (canvas.width / dataArray.length) * 2; // Ancho de cada barra

    function renderFrame() {
        requestAnimationFrame(renderFrame); // Solicita la próxima animación

        // Obtener los datos del analizador
        analyser.getByteFrequencyData(dataArray);
        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Color de fondo
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height); // Limpia el canvas

        // Dibujar las barras
        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = dataArray[i]; // Altura de la barra en función de la frecuencia
            const barX = i * barWidth; // Posición X de la barra

            canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)'; // Color de la barra
            canvasCtx.fillRect(barX, canvas.height - barHeight / 2, barWidth, barHeight / 2); // Dibuja la barra
        }
    }

    renderFrame(); // Comienza a renderizar el ecualizador
}


function loadSong(index) {
    currentSongIndex = index;
    const { title, artist, src, cover } = songs[currentSongIndex];
    document.getElementById("songTitle").textContent = title;
    document.getElementById("artist").textContent = artist;
    document.getElementById("albumCover").src = cover;

    if (song) song.unload();
    song = new Howl({ src: [src], volume: 0.5, onplay: startProgressUpdate, onend: stopProgressUpdate });
    song.play();
}

// Iniciar el intervalo de actualización de progreso al reproducir una canción
function startProgressUpdate() {
    stopProgressUpdate(); // Detenemos cualquier intervalo previo para evitar duplicados
    progressInterval = setInterval(updateProgress, 1000); // Actualizar cada segundo
}

// Detener el intervalo de actualización cuando se pausa o termina la canción
function stopProgressUpdate() {
    clearInterval(progressInterval);
}

// Actualizar el progreso de la barra mientras se reproduce la canción
function updateProgress() {
    const progressBar = document.getElementById("songProgress");
    const currentTime = song.seek() || 0; // Obtiene el tiempo actual de la canción
    const duration = song.duration();

    if (duration > 0) {
        progressBar.value = (currentTime / duration) * 100; // Actualiza el valor de la barra de progreso
    }
}

function playPause() {
    if (song.playing()) {
        song.pause();
        stopProgressUpdate();
    } else {
        song.play();
        startProgressUpdate();
    }
}

function back() {
    if (currentSongIndex > 0) loadSong(currentSongIndex - 1);
}

function forward() {
    if (currentSongIndex < songs.length - 1) loadSong(currentSongIndex + 1);
}

function loadPlaylist() {
    const playlist = document.getElementById("playlist");

    songs.forEach((song, index) => {
        const li = document.createElement("li");
        li.textContent = song.title;
        li.onclick = () => loadSong(index);
        playlist.appendChild(li);
    });
}

function loadRadios() {
    const radioList = document.getElementById("radioStations");
    radios.forEach((radio) => {
        const li = document.createElement("li");
        li.textContent = `${radio.frequency} - ${radio.tittle}`;
        li.onclick = () => playRadio(radio.src);
        radioList.appendChild(li);
    });
}

function playRadio(url) {
    if (song) song.stop();
    if (radioStream) radioStream.unload();
    
    radioStream = new Howl({ src: [url], html5: true, volume: 0.5 });
    radioStream.play();
}

function adjustVolume(value) {
    if (song) song.volume(value / 100);
    if (radioStream) radioStream.volume(value / 100);
}

// Mover el progreso de la canción cuando el usuario ajusta la barra manualmente
function seek() {
    const progressBar = document.getElementById("songProgress");
    if (song) song.seek(song.duration() * (progressBar.value / 100));
}

async function loadRadiosFromJSON() {
    const response = await fetch('../json/radios.json');
    const data = await response.json();
    radios = data.radios;
    loadRadios();
}

window.onload = function() {
    loadPlaylist();
    loadRadiosFromJSON();
    loadSong(currentSongIndex);
};

