import { Bus } from '../core/bus.js';
import { Pref } from '../core/pref.js';

export function initVitesse() {
  let lat = 50.362118, lon = 3.283912;
  let maxSpeed = 0, gpsAvailable = false, speedOn = false;
  let lastFix = null, distanceM = 0, startTime = null, avgSpeed = 0;

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    });
  }
    }
          
