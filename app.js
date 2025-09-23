// cockpit.js — Orchestration cosmique

// Initialisation
let lat = 50.362118, lon = 3.283912;
let maxSpeed = 0, gpsAvailable = false, speedOn = false;
let lastFix = null, distanceM = 0, startTime = null, avgSpeed = 0;

// Haversine
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GPS
function initSpeed() {
  if (!('geolocation' in navigator)) return log('Pas de géolocalisation disponible');
  gpsAvailable = true;
  navigator.geolocation.watchPosition(pos => {
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
    const acc = pos.coords.accuracy ?? 999;
    const quality = acc <= 5 ? 100 : acc <= 10 ? 90 : acc <= 20 ? 80 : acc <= 50 ? 60 : acc <= 100 ? 40 : 20;
    document.getElementById('gpsQuality').textContent = `${quality}%`;

    if (!speedOn) return;
    const now = Date.now();
    const sp = pos.coords.speed ?? null;

    if (lastFix) {
      const dt = Math.max(0.5, (now - lastFix.t) / 1000);
      const d = haversine(lastFix.lat, lastFix.lon, lat, lon);
      if (d < 1000) distanceM += d;
      const v = sp ?? d / dt;
      const kh = v * 3.6;
      document.getElementById('speed').textContent = `${kh.toFixed(4)} km/h`;

      if (quality <= 60 || kh < 3) {
        Bus.emit('sensor:vitesseSouterraine', { v: kh, gpsQuality: quality });
      }

      if (kh > maxSpeed) {
        maxSpeed = kh;
        document.getElementById('maxSpeed').textContent = `${maxSpeed.toFixed(4)} km/h`;
      }
    }

    lastFix = { lat, lon, t: now };

    if (startTime) {
      const dur = Math.max(1, (now - startTime) / 1000);
      avgSpeed = (distanceM / dur) * 3.6;
      document.getElementById('avgSpeed').textContent = `${avgSpeed.toFixed(4)} km/h`;
      document.getElementById('distance').textContent = `${distanceM.toFixed(4)} m`;
      document.getElementById('duration').textContent = `${dur.toFixed(2)} s`;
    }
  }, err => {
    gpsAvailable = false;
    log('GPS indisponible');
  }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 });
}

// Invocation souterraine
Bus.on('sensor:vitesseSouterraine', ({ v, gpsQuality }) => {
  if (v > 0) {
    Bus.emit('ui:halo', { color: '#552200', gain: 0.35 });
    Bus.emit('audio:play', { id: 'souterrain', vol: 0.5 });
    logSouterrain('vitesse souterraine', { v, gpsQuality });
    Pref.set('lastInvocationTime', Date.now());
    document.getElementById('vSub').textContent = `${v.toFixed(4)} km/h`;
  } else {
    Bus.emit('ui:halo', { color: '#000000', gain: 0.1 });
    Bus.emit('audio:play', { id: 'silence', vol: 0.2 });
    logSouterrain('absence transformée', { gpsQuality });
  }
});

// Journal souterrain
function logSouterrain(event, data = {}) {
  const row = { event, data, at: new Date().toISOString() };
  const arr = JSON.parse(localStorage.getItem('journalSouterrain') || '[]');
  arr.push(row);
  localStorage.setItem('journalSouterrain', JSON.stringify(arr));
  const el = document.createElement('div');
  el.textContent = `${row.at} — ${event}`;
  document.getElementById('logSouterrain')?.prepend(el);
}

// Vitesse d’oubli
setInterval(() => {
  const tLast = Pref.get('lastInvocationTime', Date.now());
  const vMemoire = Math.min(100, (Date.now() - tLast) / 60000);
  document.getElementById('vMemoire').textContent = `${vMemoire.toFixed(1)}%`;
}, 10000);

// Propagation tellurique
setInterval(() => {
  const freq = 7.83 + Math.random() * 0.2;
  const speed = freq * 300;
  document.getElementById('vWave').textContent = `${speed.toFixed(2)} m/s`;
}, 10000);

// Boutons
document.getElementById('speedToggle').addEventListener('click', () => {
  speedOn = !speedOn;
  if (speedOn && !startTime) startTime = Date.now();
  log(speedOn ? 'Vitesse: ON' : 'Vitesse: OFF');
});

document.getElementById('resetMaxSpeed').addEventListener('click', () => {
  maxSpeed = 0;
  document.getElementById('maxSpeed').textContent = '0.0000 km/h';
  log('Vitesse max réinitialisée');
});

// Démarrage
initSpeed();
        
