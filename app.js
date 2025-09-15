let watchId = null;
let tracking = false;
let positions = [];
let lastPos = null;
let startTime = null;

// --- Activer/désactiver la vitesse ---
function toggleSpeed() {
  if (!tracking) {
    if (navigator.geolocation) {
      startTime = Date.now();
      positions = [];
      watchId = navigator.geolocation.watchPosition(updatePosition, geoError, {
        enableHighAccuracy: true,
        maximumAge: 1000
      });
      tracking = true;
    } else {
      alert("GPS non supporté");
    }
  } else {
    navigator.geolocation.clearWatch(watchId);
    tracking = false;
  }
}

// --- Mise à jour position ---
function updatePosition(pos) {
  lastPos = { lat: pos.coords.latitude, lon: pos.coords.longitude };

  const speedMS = pos.coords.speed || 0;
  const speedKMH = speedMS * 3.6;
  const acc = pos.coords.accuracy;

  // Ajout historique
  if (positions.length === 0) positions.push({ ...pos.coords, t: Date.now() });
  else {
    let last = positions[positions.length - 1];
    let d = distance(last.latitude, last.longitude, pos.coords.latitude, pos.coords.longitude);
    let dt = (Date.now() - last.t) / 1000;
    if (d > 0.5) {
      positions.push({ ...pos.coords, t: Date.now() });
    }
  }

  // Distance + durée
  let dist = 0;
  for (let i = 1; i < positions.length; i++) {
    dist += distance(
      positions[i - 1].latitude,
      positions[i - 1].longitude,
      positions[i].latitude,
      positions[i].longitude
    );
  }
  const dur = (Date.now() - startTime) / 1000;

  // Moyenne
  let avg = dist / dur * 3.6;

  // Lumière et son en %
  const pctLight = (speedKMH / 1079252848 * 100).toFixed(6); // % vitesse lumière
  const pctSound = (speedMS / 343 * 100).toFixed(3); // % vitesse son

  document.getElementById("speed").textContent = speedKMH.toFixed(3);
  document.getElementById("avgSpeed").textContent = avg.toFixed(3);
  document.getElementById("distance").textContent = dist.toFixed(1);
  document.getElementById("duration").textContent = dur.toFixed(0);
  document.getElementById("lightPct").textContent = pctLight;
  document.getElementById("soundPct").textContent = pctSound;

  updateSunMoon();
}

// --- Erreur GPS ---
function geoError(err) {
  console.error("Erreur GPS:", err.message);
}

// --- Distance haversine ---
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// --- Soleil & Lune ---
function updateSunMoon() {
  if (!lastPos) return;
  const times = SunCalc.getTimes(new Date(), lastPos.lat, lastPos.lon);

  document.getElementById("sunrise").textContent = times.sunrise.toLocaleTimeString();
  document.getElementById("sunset").textContent = times.sunset.toLocaleTimeString();
  document.getElementById("sunNoon").textContent = times.solarNoon.toLocaleTimeString();

  // Équation du temps simplifiée
  const JD = Date.now() / 86400000 + 2440587.5;
  const n = JD - 2451545.0;
  const L = 280.46 + 0.9856474 * n;
  const g = 357.528 + 0.9856003 * n;
  const eqTime = -1 * (1.914 * Math.sin(g * Math.PI / 180) - 0.02 * Math.sin(2 * g * Math.PI / 180)
    + 2.466 * Math.sin(2 * L * Math.PI / 180) - 0.053 * Math.sin(4 * L * Math.PI / 180));

  document.getElementById("eqTime").textContent = eqTime.toFixed(2);

  const solarTime = new Date();
  solarTime.setMinutes(solarTime.getMinutes() + eqTime);
  document.getElementById("solarTrue").textContent = solarTime.toLocaleTimeString();
  document.getElementById("solarMean").textContent = new Date().toLocaleTimeString();

  // Lune
  const moonPos = SunCalc.getMoonPosition(new Date(), lastPos.lat, lastPos.lon);
  const moonIllum = SunCalc.getMoonIllumination(new Date());
  document.getElementById("moonPhase").textContent = (moonIllum.phase * 100).toFixed(1);
  document.getElementById("moonMag").textContent = moonIllum.fraction.toFixed(2);
  const moonTimes = SunCalc.getMoonTimes(new Date(), lastPos.lat, lastPos.lon);
  document.getElementById("moonrise").textContent = moonTimes.rise ? moonTimes.rise.toLocaleTimeString() : "-";
  document.getElementById("moonset").textContent = moonTimes.set ? moonTimes.set.toLocaleTimeString() : "-";
  document.getElementById("moonTransit").textContent = moonPos.alt.toFixed(2) + " rad";
}

// --- Horloge Minecraft ---
function updateMCClock() {
  const now = new Date();
  const mcDayFraction = ((now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()) % 86400) / 86400;
  const hours = Math.floor(mcDayFraction * 24);
  const minutes = Math.floor((mcDayFraction * 24 - hours) * 60);
  const seconds = Math.floor(((mcDayFraction * 24 - hours) * 60 - minutes) * 60);

  document.getElementById("mcHour").textContent = hours.toString().padStart(2, "0");
  document.getElementById("mcMinute").textContent = minutes.toString().padStart(2, "0");
  document.getElementById("mcSecond").textContent = seconds.toString().padStart(2, "0");
}
setInterval(updateMCClock, 1000);

// --- Météo simulée ---
function updateWeather() {
  document.getElementById("temp").textContent = (20 + Math.random() * 5).toFixed(1);
  document.getElementById("pressure").textContent = (1010 + Math.random() * 10).toFixed(1);
  document.getElementById("humidity").textContent = (50 + Math.random() * 20).toFixed(0);
  document.getElementById("wind").textContent = (5 + Math.random() * 10).toFixed(1);
  document.getElementById("clouds").textContent = (10 + Math.random() * 90).toFixed(0);
  document.getElementById("rain").textContent = (0 + Math.random() * 5).toFixed(1);
  document.getElementById("snow").textContent = (0 + Math.random() * 3).toFixed(1);
  document.getElementById("uv").textContent = (1 + Math.random() * 10).toFixed(0);
  document.getElementById("airQuality").textContent = (50 + Math.random() * 50).toFixed(0);
  document.getElementById("boilPoint").textContent = 100;
}
setInterval(updateWeather, 15000);

// --- Inclinomètre ---
window.addEventListener("deviceorientation", e => {
  const tilt = e.gamma ? e.gamma.toFixed(1) : 0;
  document.getElementById("tilt").textContent = tilt;
});

// --- Lumière ---
if ("AmbientLightSensor" in window) {
  try {
    const sensor = new AmbientLightSensor();
    sensor.addEventListener("reading", () => {
      document.getElementById("lux").textContent = sensor.illuminance.toFixed(1);
    });
    sensor.start();
  } catch (err) { console.log("Capteur lumière non dispo", err); }
}

// --- Son ---
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const mic = audioCtx.createMediaStreamSource(stream);
    mic.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function updateSound() {
      analyser.getByteFrequencyData(dataArray);
      let values = 0;
      for (let i = 0; i < dataArray.length; i++) values += dataArray[i];
      let average = values / dataArray.length;
      let db = 20 * Math.log10(average / 255);
      document.getElementById("db").textContent = db.toFixed(1);
      requestAnimationFrame(updateSound);
    }
    updateSound();
  }).catch(err => console.log("Micro refusé", err));
}
