<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Cockpit Cosmique — Monde Souterrain</title>
  <link rel="manifest" href="manifest.json" />
  <link rel="icon" href="icons/icon-192.png" />
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: system-ui, sans-serif; background: #0a0a0f; color: #ddd; }
    header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #222; }
    header .actions { display:flex; gap:8px; }
    main { padding:16px; display:grid; gap:14px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .card { background:#121219; border:1px solid #1f1f2a; border-radius:12px; padding:12px; box-shadow: 0 0 20px rgba(0,0,0,.25); }
    h3 { margin:0 0 8px; font-weight:600; color:#aaf; }
    .row { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
    button { background:#1c1c29; color:#eaeaf6; border:1px solid #2a2a3a; border-radius:8px; padding:8px 12px; cursor:pointer; }
    button:hover { background:#25253a; }
    canvas { width:100%; height:220px; background:#0d0d14; border-radius:8px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    .hidden { display:none; }
    .metric { display:flex; justify-content:space-between; padding:4px 0; }
    .metric strong { color:#9cf; }
    footer { padding:16px; text-align:center; color:#888; }
  </style>
</head>
<body>
  <header>
    <div class="mono">Cockpit Cosmique • Monde souterrain</div>
    <div class="actions">
      <button id="btnAmbient">Ambiance</button>
      <button id="btnExport">Exporter journal</button>
      <button id="btnInstall" class="hidden">Installer</button>
    </div>
  </header>

  <main>
    <!-- Tableau vitesse / GPS -->
    <section class="card">
      <h3>🧭 Tableau cosmique étendu</h3>
      <div class="metric"><strong>Instantanée:</strong> <span id="speed">0.0000 km/h</span></div>
      <div class="metric"><strong>Moyenne:</strong> <span id="avgSpeed">0.0000 km/h</span></div>
      <div class="metric"><strong>Distance:</strong> <span id="distance">0.0000 m</span></div>
      <div class="metric"><strong>Temps:</strong> <span id="duration">0.00 s</span></div>
      <div class="metric"><strong>Vitesse max:</strong> <span id="maxSpeed">0.0000 km/h</span></div>
      <div class="metric"><strong>Précision GPS:</strong> <span id="gpsQuality">--%</span></div>
      <div class="row">
        <button id="speedToggle">Marche/Arrêt</button>
        <button id="resetMaxSpeed">Réinitialiser max</button>
      </div>
    </section>

    <!-- Monde souterrain: vitesse, résonance, flux -->
    <section class="card">
      <h3>🌋 Vitesse souterraine</h3>
      <div class="metric"><strong>Déplacement réel:</strong> <span id="vSub">-- km/h</span></div>
      <div class="metric"><strong>Propagation tellurique:</strong> <span id="vWave">-- m/s</span></div>
      <div class="metric"><strong>Flux enfoui:</strong> <span id="vFlux">-- m/h</span></div>
      <div class="metric"><strong>Vitesse d’oubli:</strong> <span id="vMemoire">--%</span></div>
    </section>

    <!-- Soleil & Lune (placeholders) -->
    <section class="card">
      <h3>☀️🌙 Soleil & Lune</h3>
      <div class="metric"><strong>Culmination soleil:</strong> <span id="culSol">--</span></div>
      <div class="metric"><strong>Heure solaire vraie:</strong> <span id="solVraie">--</span></div>
      <div class="metric"><strong>Heure solaire moyenne:</strong> <span id="solMoy">--</span></div>
      <div class="metric"><strong>Équation du temps:</strong> <span id="eqTemps">--</span></div>
      <div class="metric"><strong>Phase lune:</strong> <span id="lunePhase">--%</span></div>
      <div class="metric"><strong>Lever lune:</strong> <span id="luneLever">--</span></div>
      <div class="metric"><strong>Coucher lune:</strong> <span id="luneCoucher">--</span></div>
      <div class="metric"><strong>Culmination lune:</strong> <span id="luneCul">--</span></div>
    </section>

    <!-- Météo (placeholders) -->
    <section class="card">
      <h3>🌡️ Météo</h3>
      <div class="metric"><strong>Température:</strong> <span id="meteoTemp">-- °C</span></div>
      <div class="metric"><strong>Pression:</strong> <span id="meteoPress">-- hPa</span></div>
      <div class="metric"><strong>Humidité:</strong> <span id="meteoHum">--%</span></div>
      <div class="metric"><strong>Vent:</strong> <span id="meteoVent">-- km/h</span></div>
      <div class="metric"><strong>Nuages:</strong> <span id="meteoCloud">--%</span></div>
      <div class="metric"><strong>Pluie:</strong> <span id="meteoRain">-- mm</span></div>
      <div class="metric"><strong>Indice UV:</strong> <span id="meteoUV">--</span></div>
      <div class="metric"><strong>Qualité air:</strong> <span id="meteoAir">--</span></div>
      <div class="metric"><strong>Point d’ébullition:</strong> <span id="meteoBoil">-- °C</span></div>
    </section>

    <!-- Visualisation orbitale -->
    <section class="card">
      <h3>🌀 Visualisation orbitale</h3>
      <canvas id="canvasOrbit"></canvas>
    </section>

    <!-- Journal rituel global -->
    <section class="card">
      <h3>📜 Journal rituel</h3>
      <div id="log" class="mono"></div>
      <div class="row">
        <button id="btnExport">Exporter JSON</button>
      </div>
    </section>

    <!-- Journal souterrain -->
    <section class="card">
      <h3>📓 Journal souterrain</h3>
      <div id="logSouterrain" class="mono"></div>
      <div class="row">
        <button onclick="exportJournalSouterrain()">Exporter</button>
        <button onclick="rejouerJournalSouterrain()">Rejouer</button>
      </div>
    </section>

    <!-- Visualisation souterraine -->
    <section class="card">
      <h3>🪨 Visualisation souterraine</h3>
      <canvas id="canvasSouterrain"></canvas>
      <div class="row">
        <button onclick="dessinerJournalSouterrain()">Visualiser</button>
      </div>
    </section>

    <!-- Archéologie cosmique -->
    <section class="card">
      <h3>🪐 Archéologie cosmique</h3>
      <input type="file" id="importStrate" accept=".json" />
      <div class="row">
        <button onclick="fusionnerStrates()">Fusionner</button>
        <button onclick="visualiserStrates()">Visualiser</button>
      </div>
      <canvas id="canvasStrates"></canvas>
    </section>
  </main>

  <footer>© Ton univers — du noyau à la couronne</footer>

  <!-- Stubs Bus/Pref si tu n’as pas encore tes utilitaires -->
  <script>
    window.Bus = (function(){
      const map = {};
      return {
        on: (ev, fn) => (map[ev] = (map[ev]||[])).push(fn),
        emit: (ev, data) => (map[ev]||[]).forEach(fn => fn(data))
      };
    })();
    window.Pref = {
      get: (k, d) => { try { return JSON.parse(localStorage.getItem('pref:'+k)) ?? d; } catch { return d; } },
      set: (k, v) => localStorage.setItem('pref:'+k, JSON.stringify(v))
    };
    function log(msg) {
      const el = document.createElement('div');
      el.textContent = `${new Date().toISOString()} — ${msg}`;
      document.getElementById('log')?.prepend(el);
      // journal global
      const arr = JSON.parse(localStorage.getItem('journalRituel') || '[]');
      arr.push({ event: msg, at: new Date().toISOString() });
      localStorage.setItem('journalRituel', JSON.stringify(arr));
    }
  </script>

  <!-- Ton script vitesse + capteurs (comme dans ton message) -->
  <script type="module">
    // Ton code fourni (adapté ici pour lier les éléments du DOM)
    let lat = 50.362118, lon = 3.283912;
    let maxSpeed = 0;
    let gpsAvailable = false;
    let speedOn = false;
    let lastFix = null, distanceM = 0, startTime = null, avgSpeed = 0;

    document.getElementById('speedToggle').addEventListener('click', () => {
      speedOn = !speedOn;
      if (speedOn && !startTime) startTime = Date.now();
      log(speedOn ? 'Vitesse: ON' : 'Vitesse: OFF');
    });

    document.getElementById('btnExport').addEventListener('click', () => {
      const j = localStorage.getItem('journalRituel') || '[]';
      const blob = new Blob([j], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'journal-rituel-cosmique.json';
      a.click();
    });

    document.getElementById('resetMaxSpeed').addEventListener('click', () => {
      maxSpeed = 0;
      document.getElementById('maxSpeed').textContent = '0.0000 km/h';
      log('Vitesse max réinitialisée');
    });

    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371000;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function initSpeed() {
      if ('geolocation' in navigator) {
        gpsAvailable = true;
        navigator.geolocation.watchPosition(pos => {
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;

          // Précision GPS
          const acc = pos.coords.accuracy ?? 999;
          const quality = acc <= 5 ? 100 : acc <= 10 ? 90 : acc <= 20 ? 80 : acc <= 50 ? 60 : acc <= 100 ? 40 : 20;
          document.getElementById('gpsQuality').textContent = `${quality}%`;

          if (!speedOn) return;

          const now = Date.now();
          const sp = pos.coords.speed != null ? pos.coords.speed : null;

          if (lastFix) {
            const dt = Math.max(0.5, (now - lastFix.t) / 1000);
            const d = haversine(lastFix.lat, lastFix.lon, lat, lon);
            if (d < 1000) distanceM += d;
            const v = sp != null ? sp : d / dt;
            const kh = v * 3.6;

            document.getElementById('speed').textContent = `${kh.toFixed(4)} km/h`;

            // Détection monde souterrain
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
          log('GPS indisponible — aucune simulation');
          console.warn(err);
        }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 });
      } else {
        gpsAvailable = false;
        log('Pas de géolocalisation disponible');
      }
    }

    setInterval(() => {
      if (!gpsAvailable || !speedOn) return;
      // Surveillance passive — les données sont mises à jour via watchPosition
    }, 1000);

    initSpeed();

    // Liaison scène souterraine
    function logSouterrain(event, data = {}) {
      const row = { event, data, at: new Date().toISOString() };
      const arr = JSON.parse(localStorage.getItem('journalSouterrain') || '[]');
      arr.push(row);
      localStorage.setItem('journalSouterrain', JSON.stringify(arr));
      const el = document.createElement('div');
      el.textContent = `${row.at} — ${event}`;
      document.getElementById('logSouterrain')?.prepend(el);
    }

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

    // Propagation tellurique (placeholder jusqu’au capteur réel)
    setInterval(() => {
      const freq = 7.83 + Math.random() * 0.2;
      const speed = freq * 300; // m/s (poétique)
      document.getElementById('vWave').textContent = `${speed.toFixed(2)} m/s`;
    }, 10000);

    // Vitesse d’oubli
    setInterval(() => {
      const tLast = Pref.get('lastInvocationTime', Date.now());
      const vMemoire = Math.min(100, (Date.now() - tLast) / 60000); // % par minute
      document.getElementById('vMemoire').textContent = `${vMemoire.toFixed(1)}%`;
    }, 10000);

    // Imports de modules (si présents dans ton projet)
    import('./js/vitesse.js').then(mod => {
      mod.startHzDisplay?.();
      // mod.incrementSpeedCounter?.();
    }).catch(()=>{});
    import('./js/capteurs.js').then(mod => {
      // mod.updateSouterrain?.(/* lux, gpsQuality */);
    }).catch(()=>{});
  </script>

  <!-- Ambiance sonore, visualisation orbitale, PWA install prompt -->
  <script>
    // Ambiance sonore réactive (bouton id="btnAmbient")
    let ambientAudio;
    document.getElementById('btnAmbient').onclick = () => {
      if (ambientAudio) { ambientAudio.pause(); ambientAudio = null; return; }
      ambientAudio = new Audio('sons/ambiance.mp3');
      ambientAudio.loop = true; ambientAudio.volume = 0.3; ambientAudio.play();
      log('Ambiance sonore activée');
    };

    // Orbit visual
    const orbCanvas = document.getElementById('canvasOrbit');
    const orbCtx = orbCanvas.getContext('2d');
    function resizeOrbit(){ const r=orbCanvas.getBoundingClientRect(); orbCanvas.width=r.width; orbCanvas.height=r.height; }
    window.addEventListener('resize', resizeOrbit); resizeOrbit();
    let tOrbit = 0;
    function drawOrbit(){
      tOrbit += 0.01;
      orbCtx.clearRect(0,0,orbCanvas.width,orbCanvas.height);
      orbCtx.fillStyle='rgba(0,255,255,0.15)';
      orbCtx.beginPath(); orbCtx.arc(orbCanvas.width/2,orbCanvas.height/2,40+10*Math.sin(tOrbit*2),0,Math.PI*2); orbCtx.fill();
      orbCtx.strokeStyle='#0ff'; orbCtx.lineWidth=1; orbCtx.beginPath(); orbCtx.arc(orbCanvas.width/2,orbCanvas.height/2,90,0,Math.PI*2); orbCtx.stroke();
      const x = orbCanvas.width/2 + 90*Math.cos(tOrbit);
      const y = orbCanvas.height/2 + 60*Math.sin(tOrbit);
      orbCtx.fillStyle='#ff0'; orbCtx.beginPath(); orbCtx.arc(x,y,6,0,Math.PI*2); orbCtx.fill();
      requestAnimationFrame(drawOrbit);
    }
    drawOrbit();

    // Service Worker PWA
    if ('serviceWorker' in navigator) {
      const swCode = `
        const STATIC='static-v1';
        const ASSETS=['./','./index.html','./icons/icon-192.png'];
        self.addEventListener('install',e=>{ e.waitUntil(caches.open(STATIC).then(c=>c.addAll(ASSETS))); });
        self.addEventListener('fetch', e=>{ if(e.request.method!=='GET') return; e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request))); });
      `;
      const blob = new Blob([swCode], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      navigator.serviceWorker.register(url).then(() => log('PWA: Service Worker enregistré'));
    }

    // Install banner
    let deferredPrompt=null;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); deferredPrompt=e;
      document.getElementById('btnInstall').classList.remove('hidden');
    });
    document.getElementById('btnInstall').onclick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null;
    };

    // Visualisation souterraine
    const canvasS = document.getElementById('canvasSouterrain');
    const ctxS = canvasS.getContext('2d');
    function resizeSouterrain(){ const r=canvasS.getBoundingClientRect(); canvasS.width=r.width; canvasS.height=r.height; }
    window.addEventListener('resize', resizeSouterrain); resizeSouterrain();
    function dessinerJournalSouterrain() {
      const data = JSON.parse(localStorage.getItem('journalSouterrain') || '[]');
      ctxS.clearRect(0,0,canvasS.width,canvasS.height);
      const w=canvasS.width, h=canvasS.height, n=data.length, spacing=w/(n+1);
      data.forEach((row,i) => {
        const x=spacing*(i+1), t=new Date(row.at).getTime(), y=h/2 + Math.sin(t/1e6)*(h/3);
        ctxS.strokeStyle='#552200'; ctxS.lineWidth=2; ctxS.beginPath(); ctxS.moveTo(x,h/2); ctxS.lineTo(x,y); ctxS.stroke();
        ctxS.fillStyle = (row.event||'').includes('absence') ? '#000' : '#ff6600';
        ctxS.beginPath(); ctxS.arc(x,y,6,0,Math.PI*2); ctxS.fill();
      });
      log('Visualisation souterraine générée');
    }

    // Archéologie cosmique
    let strateExterne=[];
    document.getElementById('importStrate').onchange = e => {
      const file=e.target.files[0]; if(!file) return;
      const reader=new FileReader();
      reader.onload=()=>{ try{ strateExterne=JSON.parse(reader.result); log(`Strate externe chargée: ${strateExterne.length||0}`); } catch { alert('Fichier invalide'); } };
      reader.readAsText(file);
    };
    function fusionnerStrates() {
      const locale = JSON.parse(localStorage.getItem('journalSouterrain') || '[]');
      const fusion = [...locale, ...(Array.isArray(strateExterne)?strateExterne:(strateExterne?.strates||[]))];
      localStorage.setItem('journalSouterrain', JSON.stringify(fusion));
      log(`Fusion réalisée: ${fusion.length} événements`);
    }
    function visualiserStrates() {
      const canvas = document.getElementById('canvasStrates');
      const ctx = canvas.getContext('2d');
      const r = canvas.getBoundingClientRect(); canvas.width=r.width; canvas.height=r.height; ctx.clearRect(0,0,canvas.width,canvas.height);
      const locale = JSON.parse(localStorage.getItem('journalSouterrain') || '[]');
      const ext = Array.isArray(strateExterne)?strateExterne:(strateExterne?.strates||[]);
      const spacing = canvas.width / (Math.max(locale.length, ext.length) + 1);
      locale.forEach((row,i)=>{ const x=spacing*(i+1), y=canvas.height/2 - 40; ctx.fillStyle='#ff6600'; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill(); });
      ext.forEach((row,i)=>{ const x=spacing*(i+1), y=canvas.height/2 + 40; ctx.fillStyle='#552200'; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill(); });
      ctx.strokeStyle='#333'; ctx.beginPath(); ctx.moveTo(0,canvas.height/2); ctx.lineTo(canvas.width,canvas.height/2); ctx.stroke();
      log('Visualisation des strates réalisée');
    }

    // Journal souterrain helpers (export/replay)
    function exportJournalSouterrain() {
      const j = localStorage.getItem('journalSouterrain') || '[]';
      const blob = new Blob([j], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'journal-souterrain.json'; a.click();
    }
    function rejouerJournalSouterrain() {
      const arr = JSON.parse(localStorage.getItem('journalSouterrain') || '[]');
      arr.forEach((row,i)=> {
        setTimeout(()=>{
          Bus.emit('ui:halo', { color: '#331100', gain: 0.2 });
          Bus.emit('audio:play', { id: 'souterrain', vol: 0.3 });
          log(`Rejoué: ${row.event}`);
        }, i*800);
      });
    }

    // Audio bus stub
    Bus.on('audio:play', ({ id, vol=0.4, loop=false }) => {
      try {
        const a = new Audio(`sons/${id}.mp3`);
        a.loop = loop; a.volume = vol; a.play();
      } catch {}
    });
  </script>
</body>
</html>
  
