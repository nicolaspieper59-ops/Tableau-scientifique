let positionPrecedente = null;
let chronoDebut = null;
let distanceTotale = 0;
let vitesseMax = 0;
let intervalleMesure = null;

export function toggleMarche() {
  if (!intervalleMesure) {
    chronoDebut = Date.now();
    intervalleMesure = setInterval(mesurerVitesseGPS, 1000);
    console.log("🟢 Mesure GPS activée");
  } else {
    clearInterval(intervalleMesure);
    intervalleMesure = null;
    console.log("🔴 Mesure GPS arrêtée");
  }
}

export function reinitialiserVitesseMax() {
  vitesseMax = 0;
  const el = document.getElementById('vitesse-max');
  if (el) el.textContent = '0.0000';
}

function mesurerVitesseGPS() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(pos => {
      const now = Date.now();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const alt = typeof pos.coords.altitude === 'number' ? pos.coords.altitude : 0;

      updateText('latitude', lat.toFixed(6));
      updateText('longitude', lon.toFixed(6));
      updateText('altitude', alt.toFixed(2));

      if (positionPrecedente) {
        const dt = (now - positionPrecedente.timestamp) / 1000;
        const d = calculerDistance(positionPrecedente.lat, positionPrecedente.lon, lat, lon);
        const vitesse = d / dt * 3.6;

        distanceTotale += d;
        vitesseMax = Math.max(vitesseMax, vitesse);
        const tempsTotal = (now - chronoDebut) / 1000;
        const vitesseMoyenne = distanceTotale / tempsTotal * 3.6;

        updateText('vitesse-instantanee', vitesse.toFixed(4));
        updateText('vitesse-moyenne', vitesseMoyenne.toFixed(4));
        updateText('vitesse-max', vitesseMax.toFixed(4));
        updateText('distance', distanceTotale.toFixed(4));
        updateText('temps', tempsTotal.toFixed(2));

        updateText('vitesse-mm', (vitesse * 1000000 / 3600).toFixed(0));
        updateText('distance-km', (distanceTotale / 1000).toFixed(4));
        updateText('distance-sec-lumiere', (distanceTotale / 299792458).toFixed(6));
        updateText('distance-annee-lumiere', (distanceTotale / 9.461e+15).toFixed(12));
        updateText('pourcentage-lumiere', ((vitesse * 1000 / 3600) / 299792458 * 100).toFixed(6));
        updateText('pourcentage-son', ((vitesse * 1000 / 3600) / 343 * 100).toFixed(2));

        const x = Math.floor(distanceTotale);
        updateText('coords-minecraft', `X:${x} Y:64 Z:0`);
      }

      positionPrecedente = { lat, lon, timestamp: now };
    }, err => {
      console.error("Erreur GPS :", err.message);
    });
  }
}

function updateText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
