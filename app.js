let lat = 50.362118, lon = 3.283912;
let maxSpeed = 0;
let gpsAvailable = false;
let speedOn = false;
let lastFix = null, distanceM = 0, startTime = null, avgSpeed = 0;

// Bouton Marche/Arrêt
document.getElementById('speedToggle').addEventListener('click', () => {
  speedOn = !speedOn;
  if (speedOn && !startTime) startTime = Date.now();
});

// Bouton Réinitialiser max
document.getElementById('resetMaxSpeed').addEventListener('click', () => {
  maxSpeed = 0;
  document.getElementById('maxSpeed').textContent = '0';
});

// Calcul de distance (Formule de Haversine)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Initialisation GPS
function initSpeed() {
  if ('geolocation' in navigator) {
    gpsAvailable = true;
    navigator.geolocation.watchPosition(pos => {
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;

      // Précision GPS
      const acc = pos.coords.accuracy;
      let quality = acc <= 5 ? 100 : acc <= 10 ? 90 : acc <= 20 ? 80 : acc <= 50 ? 60 : acc <= 100 ? 40 : 20;
      document.getElementById('gpsQuality').textContent = quality;

      if (!speedOn) return;

      const now = Date.now();
      const sp = pos.coords.speed != null ? pos.coords.speed : null;

      if (lastFix) {
        const dt = (now - lastFix.t) / 1000;
        const d = haversine(lastFix.lat, lastFix.lon, lat, lon);
        if (d < 1000) distanceM += d;
        const v = sp != null ? sp : d / dt;
        const kh = v * 3.6;

        document.getElementById('speed').textContent = kh.toFixed(4);

        if (kh > maxSpeed) {
          maxSpeed = kh;
          document.getElementById('maxSpeed').textContent = maxSpeed.toFixed(4);
        }
      }

      lastFix = { lat, lon, t: now };

      if (startTime) {
        const dur = Math.max(1, (now - startTime) / 1000);
        avgSpeed = (distanceM / dur) * 3.6;
        document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(4);
        document.getElementById('distance').textContent = distanceM.toFixed(4);
        document.getElementById('duration').textContent = dur.toFixed(2);
      }
    }, err => {
      gpsAvailable = false;
      console.warn("GPS indisponible : pas de simulation");
    }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 });
  } else {
    gpsAvailable = false;
    console.warn("Pas de géolocalisation disponible");
  }
}

// Surveillance passive
setInterval(() => {
  if (!gpsAvailable || !speedOn) return;
  // Les données sont mises à jour uniquement via GPS
}, 1000);

// Démarrage
initSpeed();
import { startHzDisplay, incrementSpeedCounter } from './js/vitesse.js';
import { updateSouterrain } from './js/capteurs.js';

document.addEventListener("DOMContentLoaded", () => {
  startHzDisplay();

  // Exemple, à placer là où tu reçois des données de vitesse
  // incrementSpeedCounter();

  // Exemple, à placer là où tu reçois des données capteur/lumière/GPS
  // updateSouterrain(lux, gpsQuality);
});
// Ajout dans ton watchPosition
if (speedOn) {
  const now = Date.now();
  const sp = pos.coords.speed != null ? pos.coords.speed : null;

  if (lastFix) {
    const dt = (now - lastFix.t) / 1000;
    const d = haversine(lastFix.lat, lastFix.lon, lat, lon);
    if (d < 1000) distanceM += d;
    const v = sp != null ? sp : d / dt;
    const kh = v * 3.6;

    document.getElementById('speed').textContent = kh.toFixed(4);

    // --- Détection mode souterrain ---
    if (quality <= 60 || kh < 3) {
      Bus.emit('sensor:vitesseSouterraine', { v: kh, gpsQuality: quality });
    }

    if (kh > maxSpeed) {
      maxSpeed = kh;
      document.getElementById('maxSpeed').textContent = maxSpeed.toFixed(4);
    }
  }

  lastFix = { lat, lon, t: now };

  if (startTime) {
    const dur = Math.max(1, (now - startTime) / 1000);
    avgSpeed = (distanceM / dur) * 3.6;
    document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(4);
    document.getElementById('distance').textContent = distanceM.toFixed(4);
    document.getElementById('duration').textContent = dur.toFixed(2);
  }
}

// --- Invocation poétique ---
Bus.on('sensor:vitesseSouterraine', ({ v, gpsQuality }) => {
  if (v > 0) {
    Bus.emit('ui:halo', { color: '#552200', gain: 0.35 });
    Bus.emit('audio:play', { id: 'souterrain', vol: 0.5 });
    logSouterrain('vitesse souterraine', { v, gpsQuality });
  } else {
    Bus.emit('ui:halo', { color: '#000000', gain: 0.1 });
    Bus.emit('audio:play', { id: 'silence', vol: 0.2 });
    logSouterrain('absence transformée', { gpsQuality });
  }
});
                            
