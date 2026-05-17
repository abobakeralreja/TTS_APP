package de.thm.voiceapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;

@Service
public class HistoryService {

    private final ObjectMapper mapper = new ObjectMapper();

    // ⛔ RESOURCES wird NICHT MEHR benutzt!
    // ✅ Immer dieselbe Datei im Projekt-Hauptverzeichnis
    private final String HISTORY_PATH = "history.json";

    // 🔹 Eintrag hinzufügen
    public void addEntry(String text, String fileName) {
        try {
            File file = new File(HISTORY_PATH);

            // Falls Datei nicht existiert → neu erstellen
            if (!file.exists()) {
                ObjectNode root = mapper.createObjectNode();
                root.set("history", mapper.createArrayNode());
                mapper.writerWithDefaultPrettyPrinter().writeValue(file, root);
            }

            ObjectNode root = (ObjectNode) mapper.readTree(file);
            ArrayNode history = (ArrayNode) root.get("history");

            // Duplikate verhindern
            for (JsonNode item : history) {
                if (item.get("file").asText().equals(fileName)) {
                    return;
                }
            }

            ObjectNode entry = mapper.createObjectNode();
            entry.put("text", text);
            entry.put("file", fileName);
            entry.put("timestamp", LocalDateTime.now().toString());

            history.add(entry);

            mapper.writerWithDefaultPrettyPrinter().writeValue(file, root);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 🔹 Verlauf abrufen
    public JsonNode getHistory() {
        try {
            File file = new File(HISTORY_PATH);

            if (!file.exists()) {
                ObjectNode root = mapper.createObjectNode();
                root.set("history", mapper.createArrayNode());
                mapper.writerWithDefaultPrettyPrinter().writeValue(file, root);
            }

            return mapper.readTree(file).get("history");

        } catch (Exception e) {
            e.printStackTrace();
            return mapper.createArrayNode();
        }
    }

    // 🔹 Einzelnen Eintrag löschen
    public String deleteEntry(String fileName) {
        try {
            File file = new File(HISTORY_PATH);

            if (!file.exists()) return "File not found.";

            ObjectNode root = (ObjectNode) mapper.readTree(file);
            ArrayNode history = (ArrayNode) root.get("history");

            ArrayNode newHistory = mapper.createArrayNode();
            boolean removed = false;

            for (JsonNode item : history) {
                if (!item.get("file").asText().equals(fileName)) {
                    newHistory.add(item);
                } else {
                    removed = true;
                }
            }

            root.set("history", newHistory);
            mapper.writerWithDefaultPrettyPrinter().writeValue(file, root);

            return removed ? "Entry deleted." : "Entry NOT found.";

        } catch (Exception e) {
            e.printStackTrace();
            return "Error deleting.";
        }
    }

    // 🔹 Gesamte History löschen
    public void clearHistory() {
        try {
            File file = new File(HISTORY_PATH);

            ObjectNode root = mapper.createObjectNode();
            root.set("history", mapper.createArrayNode());

            mapper.writerWithDefaultPrettyPrinter().writeValue(file, root);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}