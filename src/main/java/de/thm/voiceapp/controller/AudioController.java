package de.thm.voiceapp.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;

@RestController
@RequestMapping("/audio")
public class AudioController {

    @GetMapping("/{filename}")
    public ResponseEntity<FileSystemResource> getAudio(@PathVariable String filename) {

        File file = new File("src/main/resources/audio/" + filename);

        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/wav"))
                .body(new FileSystemResource(file));
    }
}