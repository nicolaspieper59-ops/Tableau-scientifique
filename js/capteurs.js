// Fonction utilitaire pour déterminer si on est "souterrain"
export function updateSouterrain(luxValue, gpsQuality) {
  const isDark = luxValue !== null && luxValue < 5;     // Seuil à ajuster
  const isBadGps = gpsQuality !== null && gpsQuality < 30; // Seuil à ajuster
  const sousTerrain = (isDark || isBadGps) ? "Oui" : "Non";
  document.getElementById("souterrain").textContent = sousTerrain;
}
