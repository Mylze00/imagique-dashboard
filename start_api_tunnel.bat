@echo off
echo ============================================
echo 🚀 Lancement du serveur API + LocalTunnel...
echo ============================================

REM Ouvrir le backend (server.js) dans une nouvelle fenêtre
start cmd /k "node server.js"

REM Attendre quelques secondes pour s'assurer que le serveur est démarré
timeout /t 3 /nobreak >nul

REM Lancer LocalTunnel
echo ✅ LocalTunnel en cours d'exécution...
lt --port 5000

pause
