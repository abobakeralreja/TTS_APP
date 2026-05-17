# VoiceApp – Premium Text-to-Speech Experience 🎙️

VoiceApp ist eine moderne, webbasierte Text-to-Speech (TTS) Anwendung. Sie bietet eine intuitive Benutzeroberfläche zur schnellen und einfachen Umwandlung von Text in Sprache. Das Projekt wurde mit Fokus auf Barrierefreiheit und eine ansprechende "Glassmorphism"-Ästhetik entwickelt.

## ✨ Features

- **Text-to-Speech Generierung**: Hochwertige Sprachausgabe mit anpassbarer Geschwindigkeit.
- **Benutzer-Authentifizierung**: Sicheres Login und Registrierung via Supabase.
- **Kategorien (📂)**: Vordefinierte Phrasen nach Themen geordnet, um schnelles Kommunizieren zu ermöglichen.
- **Favoriten (⭐)**: Eigene, häufig genutzte Phrasen speichern und mit einem Klick abrufen.
- **Verlauf (🕰️)**: Automatische Speicherung aller bisher generierten Texte.
- **Erweiterte Einstellungen (⚙️)**:
  - *Speaking Mode*: Wähle zwischen dem Vorlesen ganzer Sätze oder einzelner Wörter bereits beim Tippen.
  - *AI Autocorrect*: Optionale Autokorrektur vor der Sprachausgabe.
  - *Voice Speed*: Stufenlose Anpassung der Sprechgeschwindigkeit.
- **Feedback-System (💬)**: Integriertes 5-Sterne-Bewertungssystem für Nutzerfeedback.

## 🛠️ Technologien & Architektur

Das Projekt nutzt ein modernes Tech-Stack:
- **Frontend**: HTML5, CSS3 (Custom Design System, kein Framework), JavaScript (Vanilla)
- **Backend / API**: Node.js, Vercel Serverless Functions (`api/tts.js`)
- **Datenbank & Auth**: Supabase (PostgreSQL, Authentication)
- **APIs**: Google TTS API zur Sprachsynthese
- **Caching**: Vercel KV Store

## 📸 Screenshots

*(Tipp für GitHub: Damit diese Bilder auf GitHub sichtbar sind, kopiere deinen `foto`-Ordner bitte in dieses `voiceapp`-Verzeichnis und passe ggf. die Pfade von `../foto/...` zu `foto/...` an.)*

| Hauptansicht | Kategorien |
| :---: | :---: |
| <img src="../foto/all.png" width="400" /> | <img src="../foto/cat.png" width="400" /> |

| Favoriten | Verlauf |
| :---: | :---: |
| <img src="../foto/fev.png" width="400" /> | <img src="../foto/his.png" width="400" /> |

| Einstellungen | Feedback |
| :---: | :---: |
| <img src="../foto/sit.png" width="400" /> | <img src="../foto/feed.png" width="400" /> |

## 🚀 Lokale Ausführung (Development)

1. **Repository klonen**
   ```bash
   git clone <deine-repo-url>
   cd voiceapp
   ```

2. **Abhängigkeiten installieren**
   Stelle sicher, dass [Node.js](https://nodejs.org/) installiert ist.
   ```bash
   npm install
   ```

3. **Supabase & Vercel konfigurieren**
   - Trage im Frontend (`public/app.js` oder `.env`) deine `SUPABASE_URL` und den `ANON_KEY` ein.
   - Verbinde das Projekt mit Vercel, falls du die Serverless-Funktionen lokal testen möchtest.

4. **Lokalen Server starten**
   Da es Vercel Serverless Functions nutzt, startest du es am besten über die Vercel CLI:
   ```bash
   vercel dev
   ```
   Die App ist anschließend unter `http://localhost:3000` im Browser erreichbar.
