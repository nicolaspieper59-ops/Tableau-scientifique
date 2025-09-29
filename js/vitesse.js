let positionPrecedente = null;
let chronoDebut = null;
let distanceTotale = 0;
let vitesseMax = 0;
let intervaleMesure = null;

export function toggleMarche() {
  if (!intervaleMesure) {
    chronoDebut = Date.now();
    intervaleMesure = setInterval(mesurerVitesseGPS, 1000);
    console.log("🟢 Mesure GPS activée");
  } else {
    clearInterval(intervaleMesure);
    intervaleMesure = null;
    console.log("🔴 Mesure GPS arrêtée");
  }
}

export function reinitialiserVitesseMax() {
  vitesseMax = 0;
  document.getElementById('vitesse-max').textContent = '0.0000';
}

function mesurerVitesseGPS() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(pos => {
      const now = Date.now();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const alt = pos.coords.altitude !== null ? pos.coords.altitude : 0;

      document.getElementById('latitude').textContent = lat.toFixed(6);
      document.getElementById('longitude').textContent = lon.toFixed(6);
      document.getElementById('altitude').textContent = alt.toFixed(2);

      if (positionPrecedente) {
        const dt = (now - positionPrecedente.timestamp) / 1000;
        const d = calculerDistance(positionPrecedente.lat, positionPrecedente.lon, lat, lon);
        const vitesse = d / dt * 3.6; // m/s → km/h

        distanceTotale += d;
        vitesseMax = Math.max(vitesseMax, vitesse);
        const tempsTotal = (now - chronoDebut) / 1000;
        const vitesseMoyenne = distanceTotale / tempsTotal * 3.6;

        // Affichage
        document.getElementById('vitesse-instantanee').textContent = vitesse.toFixed(4);
        document.getElementById('vitesse-moyenne').textContent = vitesseMoyenne.toFixed(4);
        document.getElementById('vitesse-max').textContent = vitesseMax.toFixed(4);
        document.getElementById('distance').textContent = distanceTotale.toFixed(4);
        document.getElementById('temps').textContent = tempsTotal.toFixed(2);

        // Conversions
        document.getElementById('vitesse-mm').textContent = (vitesse * 1000000 / 3600).toFixed(0);
        document.getElementById('distance-km').textContent = (distanceTotale / 1000).toFixed(4);
        document.getElementById('distance-sec-lumiere').textContent = (distanceTotale / 299792458).toFixed(6);
        document.getElementById('distance-annee-lumiere').textContent = (distanceTotale / 9.461e+15).toFixed(12);
        document.getElementById('pourcentage-lumiere').textContent = ((vitesse * 1000 / 3600) / 299792458 * 100).toFixed(6);
        document.getElementById('pourcentage-son').textContent = ((vitesse * 1000 / 3600) / 343 * 100).toFixed(2);

        const x = Math.floor(distanceTotale);
        document.getElementById('coords-minecraft').textContent = `X:${x} Y:64 Z:0`;
      }

      positionPrecedente = {
        lat,
        lon,
        timestamp: now
      };
    });
  }
}

function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // rayon Terre en m
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance en mètres
}
