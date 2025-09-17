// js/core.js — Initialisation générale (offline-ready)
document.addEventListener('DOMContentLoaded', function () {
  // Exécution de l'initialisation de tous les modules
  if (window.initVitesse) initVitesse();
  if (window.initSoleilLune) initSoleilLune();
  if (window.initOrbital) initOrbital();
  if (window.initSphere) initSphere();
  if (window.initCapteurs) initCapteurs();
  if (window.initInterface) initInterface();
  if (window.initMeteo) initMeteo();
});
