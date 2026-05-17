package de.thm.voiceapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@Service
public class TextToSpeechService {

    @Autowired
    private HistoryService historyService;

    public String generateSpeech(String text) throws Exception {

        // Ordner für Audio-Ausgaben
        String outputDir = "src/main/resources/audio/";
        String fileName = "tts_" + System.currentTimeMillis() + ".wav";
        String filePath = outputDir + fileName;

        // Verbindung zu MaryTTS aufbauen
        URL url = new URL("http://localhost:59125/process");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setDoOutput(true);

        // MaryTTS Parameter
        String params =
                "INPUT_TEXT=" + text +
                "&INPUT_TYPE=TEXT" +
                "&OUTPUT_TYPE=AUDIO" +
                "&AUDIO=WAVE_FILE" +
                "&LOCALE=en_US";

        conn.getOutputStream().write(params.getBytes());

        // Antwort ist ein .wav-Audiofile
        InputStream in = conn.getInputStream();
        FileOutputStream out = new FileOutputStream(filePath);

        byte[] buffer = new byte[1024];
        int len;

        while ((len = in.read(buffer)) != -1) {
            out.write(buffer, 0, len);
        }

        out.close();
        in.close();

        // ⬅️⬅️ NEU: Verlauf speichern
        historyService.addEntry(text, fileName);

        return fileName; // wird später an den Client zurückgegeben
    }
}