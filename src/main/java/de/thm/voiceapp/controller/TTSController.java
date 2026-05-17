package de.thm.voiceapp.controller;

import de.thm.voiceapp.model.TTSRequest;
import de.thm.voiceapp.service.HistoryService;
import de.thm.voiceapp.service.TextToSpeechService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tts")
public class TTSController {

    @Autowired
    private TextToSpeechService ttsService;

    @Autowired
    private HistoryService historyService;

    @PostMapping("/speak")
    public Object speak(@RequestBody TTSRequest request) {
        try {
            String text = request.getText();
            String audioFile = ttsService.generateSpeech(text);

            // In der History speichern
            historyService.addEntry(text, audioFile);

            // JSON zurückgeben
            return new Response(audioFile, text, "ok");

        } catch (Exception e) {
            return new Response(null, null, "error: " + e.getMessage());
        }
    }

    // Kleine interne Response-Klasse
    record Response(String file, String text, String status) {}
}