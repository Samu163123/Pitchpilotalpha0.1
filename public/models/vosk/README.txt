Place a Vosk model archive here to use with vosk-browser.

Recommended (English small):
- https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip (unzip, then create a tar.gz per vosk-browser README)
  or use a pre-made tar.gz matching the expected layout.

File name expected by the app (default):
- model.tar.gz

You can change the path in code at: app/train/call/page.tsx (VoskController("/models/vosk/model.tar.gz", ...))

Notes:
- The archive must contain the Vosk model directory structure (am, conf, graph, etc.) per vosk-browser docs.
- Model archives are large (50–160MB). Consider using a small model for faster load.
- Hosting large assets may affect deployment limits on some platforms.
