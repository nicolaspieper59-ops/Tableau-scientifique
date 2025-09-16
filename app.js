// Localisation par défaut (Montpellier)
let lat = 43.6119, lon = 3.8777;

// Utilitaires
const rad = d => d * Math.PI / 180;
const deg = r => r * 180 / Math.PI;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad2 = n => String(n).padStart(2, '0');
const haversine = (la1, lo1, la2, lo2) => {
  const R = 6371000, dLa = rad(la2 - la1), dLo = rad(lo2 - lo1);
  const a = Math.sin(dLa/2)**2 + Math.cos(rad(la1))*Math.cos(rad(la2))*Math.sin(dLo/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
const bearingTo = (la1, lo1, la2, lo2) => {
  const y = Math.sin(rad(lo2-lo1)) * Math.cos(rad(la2));
  const x = Math.cos(rad(la1))*Math.sin(rad(la2)) - Math.sin(rad(la1))*Math.cos(rad(la2))*Math.cos(rad(lo2-lo1));
  return (deg(Math.atan2(y, x)) + 360) % 360;
};

// --- Soleil & Lune (SunCalc local) ---
function equationOfTime(date) {
  const N = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(),0,0)) / 86400000);
  const B = 2 * Math.PI * (N - 81) / 364;
  // minutes (approximation classique)
  return 9.87 * Math.sin(2*B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}
function updateSunMoon() {
  if (typeof SunCalc === 'undefined') return;

  const now = new Date();
  const sunTimes = SunCalc.getTimes(now, lat, lon);
  const moonTimes = SunCalc.getMoonTimes(now, lat, lon);
  const moonIllum = SunCalc.getMoonIllumination(now);

  const eotMin = equationOfTime(now);
  const tzOffsetMin = -now.getTimezoneOffset(); // minutes
  const LSTM = 15 * Math.round(tzOffsetMin / 60); // longitude standard approx.
  const TC = 4 * (lon - LSTM) + eotMin; // minutes
  const localSolarTime = new Date(now.getTime() + TC * 60000);

  const setText = (id, val) => document.getElementById(id).textContent = val;

  setText('sunNoon', sunTimes.solarNoon ? sunTimes.solarNoon.toLocaleTimeString() : '--');
  setText('solarTrue', localSolarTime.toLocaleTimeString());
  setText('solarMean', '12:00');
  setText('eqTime', `${eotMin >= 0 ? '+' : ''}${eotMin.toFixed(1)} min`);

  setText('moonPhase', (moonIllum.fraction * 100).toFixed(1));
  setText('moonMag', '--'); // pas d’échelle standard utilisable hors-ligne
  setText('moonrise', moonTimes.rise ? moonTimes.rise.toLocaleTimeString() : '--');
  setText('moonset', moonTimes.set ? moonTimes.set.toLocaleTimeString() : '--');
  setText('moonTransit', '--'); // SunCalc ne fournit pas le transit lunaire
}

// --- Horloge Minecraft ---
function drawMcClock(ctx, w, h, hours, minutes, seconds) {
  const cx = w/2, cy = h/2, r = Math.min(cx, cy) - 6;
  ctx.clearRect(0,0,w,h);
  // fond
  const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, r);
  grad.addColorStop(0, '#333'); grad.addColorStop(1, '#111');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI); ctx.fill();
  // ticks
  ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
  for (let i=0;i<60;i++){
    const a = i * Math.PI/30;
    const rr1 = i%5===0 ? r-10 : r-5, rr2 = r-2;
    ctx.beginPath();
    ctx.moveTo(cx + rr1*Math.sin(a), cy - rr1*Math.cos(a));
    ctx.lineTo(cx + rr2*Math.sin(a), cy - rr2*Math.cos(a));
    ctx.stroke();
  }
  // aiguilles
  const ah = ((hours%12) + minutes/60) * Math.PI/6;
  const am = (minutes + seconds/60) * Math.PI/30;
  const as = seconds * Math.PI/30;
  ctx.strokeStyle = '#81D4FA'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx + (r-28)*Math.sin(ah), cy - (r-28)*Math.cos(ah)); ctx.stroke();
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx + (r-18)*Math.sin(am), cy - (r-18)*Math.cos(am)); ctx.stroke();
  ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx + (r-12)*Math.sin(as), cy - (r-12)*Math.cos(as)); ctx.stroke();
}
function updateMcClock() {
  const now = new Date();
  const mcMillis = (now.getTime() % 86400000) * 72;
  const mc = new Date(mcMillis);
  const h = mc.getUTCHours(), m = mc.getUTCMinutes(), s = mc.getUTCSeconds();
  document.getElementById('mcHour').textContent = pad2(h);
  document.getElementById('mcMinute').textContent = pad2(m);
  document.getElementById('mcSecond').textContent = pad2(s);
  const canvas = document.getElementById('mcClock');
  const ctx = canvas.getContext('2d');
  drawMcClock(ctx, canvas.width, canvas.height, h, m, s);
}

// --- Météo (simulation offline) ---
function updateWeather() {
  // Variation douce diurne
  const t = Date.now()/1000;
  const temp = 20 + 7*Math.sin((t/3600) * Math.PI/12);
  const press = 1013 + 2*Math.sin((t/3600) * Math.PI/6);
  const hum = clamp(60 + 20*Math.cos((t/3600) * Math.PI/12), 20, 100);
  const wind = clamp(10 + 6*Math.sin((t/1800) * Math.PI/6), 0, 60);
  const clouds = Math.floor(clamp(50 + 40*Math.sin((t/2700) * Math.PI/8), 0, 100));
  const rain = Math.max(0, (Math.sin(t/900)+1)/2 - 0.7) * 10;
  const snow = Math.max(0, 2 - temp/10); // pseudo
  const uv = clamp(6*Math.max(0, Math.sin((t/3600 - 6) * Math.PI/12)), 0, 11);
  const aqi = Math.floor(clamp(50 + 30*Math.sin(t/4000), 0, 300));
  const boil = 100 - 0.03*(press-1013);

  const set = (id, v) => document.getElementById(id).textContent = (typeof v === 'number') ? v.toFixed(1) : v;
  set('temp', temp); set('pressure', press); set('humidity', hum);
  set('wind', wind); set('clouds', clouds); set('rain', rain);
  set('snow', snow); set('uv', uv); set('airQuality', aqi); set('boilPoint', boil);
}

// --- Boussole / destination ---
let currentHeading = null;
function deviceOrientationHandler(e) {
  // alpha (0-360) = rotation autour de l’axe Z (compas approximatif)
  const a = e.alpha;
  if (a != null) {
    currentHeading = (360 - a) % 360; // transformer en cap “vers le Nord = 0”
    document.getElementById('heading').textContent = currentHeading.toFixed(0);
  }
}
function initCompass() {
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS: besoin d’interaction utilisateur; proposer via “Aller”
    document.getElementById('goDest').addEventListener('click', async () => {
      try { await DeviceOrientationEvent.requestPermission(); } catch {}
    }, { once: true });
  }
  window.addEventListener('deviceorientation', deviceOrientationHandler, false);
}
function updateBearingUI() {
  const dLat = parseFloat(document.getElementById('destLat').value);
  const dLon = parseFloat(document.getElementById('destLon').value);
  if (isFinite(dLat) && isFinite(dLon)) {
    const b = bearingTo(lat, lon, dLat, dLon);
    document.getElementById('bearing').textContent = b.toFixed(0);
  }
}
document.getElementById('goDest').addEventListener('click', updateBearingUI);

// --- Capteurs : niveau à bulle, lumière, son (tous offline) ---
let tiltEMA = 0;
function deviceMotionHandler(e) {
  // Basé sur beta/gamma pour un “niveau” approximatif
  const beta = e.beta || 0;   // inclinaison avant/arrière
  const gamma = e.gamma || 0; // inclinaison gauche/droite
  const angle = Math.sqrt(beta*beta + gamma*gamma); // magnitude en °
  tiltEMA = 0.9*tiltEMA + 0.1*angle;
  document.getElementById('tilt').textContent = tiltEMA.toFixed(1);
}
function initTilt() {
  if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
    document.body.addEventListener('click', async () => {
      try { await DeviceMotionEvent.requestPermission(); } catch {}
    }, { once: true });
  }
  window.addEventListener('deviceorientation', deviceMotionHandler, false);
}

// Lumière: AmbientLightSensor si présent, sinon simulation par soleil
function initLight() {
  const setLux = v => {
    document.getElementById('lux').textContent = v.toFixed(0);
    const pct = clamp((Math.log10(v+1) / 4) * 100, 0, 100);
    document.getElementById('lightPct').textContent = pct.toFixed(0);
  };
  if ('AmbientLightSensor' in window) {
    try {
      const sensor = new AmbientLightSensor();
      sensor.addEventListener('reading', () => setLux(sensor.illuminance || 0));
      sensor.start();
      return;
    } catch {}
  }
  // fallback simulation via élévation solaire
  setInterval(() => {
    if (typeof SunCalc !== 'undefined') {
      const sunPos = SunCalc.getPosition(new Date(), lat, lon);
      const elevation = sunPos.altitude; // radians
      const lux = Math.max(0, 100000 * Math.max(0, Math.sin(elevation)));
      setLux(lux);
    } else {
      setLux(300); // constant fallback
    }
  }, 2000);
}

// Son: sans micro (offline sans permission), on simule une ambiance
function initSound() {
  // Si tu veux le micro: navigator.mediaDevices.getUserMedia({audio:true}) puis analyser.
  // Ici: simulation douce
  setInterval(() => {
    const t = Date.now()/1000;
    const db = 40 + 5*Math.sin(t/5) + 2*Math.sin(t/0.7);
    document.getElementById('db').textContent = db.toFixed(1);
    const pct = clamp((db - 30) / (90 - 30) * 100, 0, 100);
    document.getElementById('soundPct').textContent = pct.toFixed(0);
  }, 500);
}

// --- Vitesse / distance: GPS si dispo, sinon simulation ---
let speedOn = false;
let lastFix = null, distanceM = 0, startTime = null, avgSpeed = 0;
function toggleSpeed() { speedOn = !speedOn; if (speedOn && !startTime) startTime = Date.now(); }
document.getElementById('speedToggle').addEventListener('click', toggleSpeed);

function initSpeed() {
  if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(pos => {
      lat = pos.coords.latitude; lon = pos.coords.longitude;
      if (!speedOn) return;
      const now = Date.now();
      const sp = pos.coords.speed != null ? pos.coords.speed : null; // m/s
      if (lastFix) {
        const dt = (now - lastFix.t) / 1000;
        const d = haversine(lastFix.lat, lastFix.lon, lat, lon);
        if (d < 1000) distanceM += d; // filtre simple
        const v = sp != null ? sp : d / dt; // m/s
        const kh = v * 3.6;
        document.getElementById('speed').textContent = kh.toFixed(1);
      }
      lastFix = { lat, lon, t: now };
      if (startTime) {
        const dur = Math.max(1, (now - startTime)/1000);
        avgSpeed = (distanceM / dur) * 3.6;
        document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(1);
        document.getElementById('distance').textContent = distanceM.toFixed(0);
        document.getElementById('duration').textContent = Math.floor(dur);
      }
    }, () => {/* ignore erreurs offline */}, { enableHighAccuracy:true, maximumAge:2000, timeout:5000 });
  } else {
    // Simulation si pas de GPS
    setInterval(() => {
      if (!speedOn) return;
      const now = Date.now();
      if (!startTime) startTime = now;
      const t = (now - startTime)/1000;
      const v = Math.max(0, 5 + 3*Math.sin(t/10)); // m/s
      distanceM += v;
      const dur = t;
      avgSpeed = (distanceM / dur) * 3.6;
      document.getElementById('speed').textContent = (v*3.6).toFixed(1);
      document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(1);
      document.getElementById('distance').textContent = distanceM.toFixed(0);
      document.getElementById('duration').textContent = Math.floor(dur);
    }, 1000);
  }
}

// --- Boucle d’update régulière ---
function tick() {
  updateSunMoon();
  updateMcClock();
  updateWeather();
  // heading et cap vers destination sont mis à jour par événements + bouton
  requestAnimationFrame(tick);
}

// Init
initCompass();
initTilt();
initLight();
initSound();
initSpeed();
tick();
                                                                                                 
