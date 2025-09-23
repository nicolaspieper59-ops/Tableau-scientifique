import { Bus } from '../core/bus.js';
import { Pref } from '../core/pref.js';

export function initSouterrain() {
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

  setInterval(() => {
    const tLast = Pref.get('lastInvocationTime', Date.now());
    const vMemoire = Math.min(100, (Date.now() - tLast) / 60000);
    document.getElementById('vMemoire').textContent = `${vMemoire.toFixed(1)}%`;
  }, 10000);

  setInterval(() => {
    const freq = 7.83 + Math.random() * 0.2;
    const speed = freq * 300;
    document.getElementById('vWave').textContent = `${speed.toFixed(2)} m/s`;
  }, 10000);
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
