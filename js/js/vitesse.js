// Ajout pour compteur Hz
let speedUpdateCount = 0;
let lastHzTimestamp = Date.now();

export function incrementSpeedCounter() {
  speedUpdateCount++;
}

export function startHzDisplay() {
  function updateHzDisplay() {
    const now = Date.now();
    const elapsed = (now - lastHzTimestamp) / 1000;
    if (elapsed >= 1) {
      document.getElementById("hzCounter").textContent = speedUpdateCount;
      speedUpdateCount = 0;
      lastHzTimestamp = now;
    }
    requestAnimationFrame(updateHzDisplay);
  }
  updateHzDisplay();
}
