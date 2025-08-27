@echo off
echo {
  "origin": ["*"],
  "responseHeader": ["Content-Type", "x-goog-meta-*"],
  "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
  "maxAgeSeconds": 3600
} > cors.json

echo Applying CORS settings to Firebase Storage bucket...
gsutil cors set cors.json gs://imagique-holding.firebasestorage.app

echo Done.
pause