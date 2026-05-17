package de.thm.voiceapp.controller;

import de.thm.voiceapp.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/history")
public class HistoryController {

    @Autowired
    private HistoryService historyService;

    // 🔹 Verlauf laden
    @GetMapping
    public Object getHistory() {
        return historyService.getHistory();
    }

    // 🔹 Einzelnen Eintrag löschen
    @DeleteMapping("/{fileName}")
    public Object deleteEntry(@PathVariable String fileName) {
        return historyService.deleteEntry(fileName);
    }

    // 🔹 Gesamte History löschen
    @DeleteMapping("/all")
    public String deleteAllHistory() {
        historyService.clearHistory();
        return "All history deleted.";
    }
}