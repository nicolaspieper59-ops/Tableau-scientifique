export function initCockpitCosmique() {
  const Bus = (() => {
    const map = {};
    return {
      on: (ev, fn) => (map[ev] = (map[ev] || []).concat(fn)),
      emit: (ev, data) => (map[ev] || []).forEach(fn => fn(data))
    };
  })();

  const Pref = {
    get: (k, d) => {
      try { return JSON.parse(localStorage.getItem('pref:' + k)) ?? d; } catch { return d; }
    },
    set: (k, v) => localStorage.setItem('pref:' + k, JSON.stringify(v))
  };

  let lat = 0, lon = 0, lastFix = null, distanceM = 0, startTime = null;
  let maxSpeed = 0, avgSpeed = 0, speedOn = false, gpsAvailable = false;

  // Vitesse corrigée
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function updateMetrics(kh, quality) {
    document.getElementById('speed').textContent = `${kh.toFixed(4)} km/h`;
    document.getElementById('gpsQuality').textContent = `${quality}%`;
    document.getElementById('vSub').textContent = `${kh.toFixed(4)} km/h`;
    if (kh > maxSpeed) {
      maxSpeed = kh;
      document.getElementById('maxSpeed').textContent = `${maxSpeed.toFixed(4)} km/h`;
    }
    const now = Date.now();
    if (startTime) {
      const dur = Math.max(1, (now - startTime) / 1000);
      avgSpeed = (distanceM / dur) * 3.6;
      document.getElementById('avgSpeed').textContent = `${avgSpeed.toFixed(4)} km/h`;
      document.getElementById('distance').textContent = `${distanceM.toFixed(4)} m`;
      document.getElementById('duration').textContent = `${dur.toFixed(2)} s`;
    }
  }

  function logSouterrain(event, data = {}) {
    const row = { event, data, at: new Date().toISOString() };
    const arr = JSON.parse(localStorage.getItem('journalSouterrain') || '[]');
    arr.push(row);
    localStorage.setItem('journalSouterrain', JSON.stringify(arr));
    const el = document.createElement('div');
    el.textContent = `${row.at} — ${event}`;
    document.getElementById('logSouterrain')?.prepend(el);
  }

  function invokeSouterrain(kh, quality) {
    if (kh > 0) {
      Bus.emit('ui:halo', { color: '#552200', gain: 0.35 });
      Bus.emit('audio:play', { id: 'souterrain', vol: 0.5 });
      Bus.emit('breath:start', { cycle: 12, color: '#331100' });
      logSouterrain('vitesse souterraine', { v: kh, gpsQuality: quality });
      Pref.set('lastInvocationTime', Date.now());
    } else {
      Bus.emit('ui:halo', { color: '#000000', gain: 0.1 });
      Bus.emit('audio:play', { id: 'silence', vol: 0.2 });
      logSouterrain('absence transformée', { gpsQuality: quality });
    }
  }

  document.getElementById('speedToggle').addEventListener('click', () => {
    speedOn = !speedOn;
    if (speedOn && !startTime) startTime = Date.now();
  });

  document.getElementById('resetMaxSpeed').addEventListener('click', () => {
    maxSpeed = 0;
    document.getElementById('maxSpeed').textContent = '0.0000 km/h';
  });

  if ('geolocation' in navigator) {
    gpsAvailable = true;
    navigator.geolocation.watchPosition(pos => {
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      const acc = pos.coords.accuracy ?? 999;
      const quality = acc <= 5 ? 100 : acc <= 10 ? 90 : acc <= 20 ? 80 : acc <= 50 ? 60 : acc <= 100 ? 40 : 20;

      if (!speedOn) return;
      const now = Date.now();
      const sp = pos.coords.speed ?? null;

      if (lastFix) {
        const dt = Math.max(0.5, (now - lastFix.t) / 1000);
        const d = haversine(lastFix.lat, lastFix.lon, lat, lon);
        if (d < 1000) distanceM += d;
        const v = sp ?? d / dt;
        const kh = v * 3.6;

        updateMetrics(kh, quality);
        invokeSouterrain(kh, quality);
      }

      lastFix = { lat, lon, t: now };
    }, err => {
      gpsAvailable = false;
      console.warn('GPS indisponible');
    }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 });
  }

  // Vitesse d’oubli
  setInterval(() => {
    const tLast = Pref.get('lastInvocationTime', Date.now());
    const vMemoire = Math.min(100, (Date.now() - tLast) / 60000);
    document.getElementById('vMemoire').textContent = `${vMemoire.toFixed(1)}%`;
  }, 10000);

  // Résonance tellurique
  setInterval(() => {
    const freq = 7.83 + Math.random() * 0.2;
    const speed = freq * 300;
    document.getElementById('vWave').textContent = `${speed.toFixed(2)} m/s`;
  }, 10000);

  // Flux enfoui (exemple avec capteur CO₂ simulé)
  let lastCO2 = null;
  Bus.on('sensor:co2', ({ ppm }) => {
    if (lastCO2 !== null) {
      const delta = Math.abs(ppm - lastCO2);
      const flux = delta * 60;
      document.getElementById('vFlux').textContent = `${flux.toFixed(2)} m/h`;
    }
    lastCO2 = ppm;
  });

  // Audio
  Bus.on('audio:play', ({ id, vol = 0.4, loop = false }) => {
    try {
      const a = new Audio(`sons/${id}.mp3`);
      a.loop = loop;
      a.volume = vol;
      a.play();
    } catch {}
  });

  // Halo
  Bus.on('ui:halo', ({ color = '#552200', gain = 0.3 }) => {
    const body = document.body;
    body.style.transition = 'background 2s ease-in-out';
    body.style.background = color;
    setTimeout(() => {
      body.style.background = '#0a0a0f';
    }, 2000);
  });

  // Respiration
  Bus.on('breath:start', ({ cycle = 12, color = '#331100' }) => {
    const body = document.body;
    body.style.transition = `background ${cycle}s ease-in-out`;
    let toggle = false;
    setInterval(() => {
      toggle = !toggle;
      body.style.background = toggle ? color : '#0a0a0f';
    }, cycle * 1000);
  });

  // Visualisation orbitale
  const canvas = document.getElementById('canvasOrbit');
  const ctx = canvas.getContext('2d');
  function resize() {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width;
    canvas.height = r.height;
  }
  window.addEventListener('resize', resize);
  resize();
  let t = 0;
  function draw() {
    t += 0.01;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(canvas.width /
