package de.thm.voiceapp.model;

import lombok.Data;

@Data
public class User {
    private String username;
    private String password;  // wird gehasht gespeichert
}
