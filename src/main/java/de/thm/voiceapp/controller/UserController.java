package de.thm.voiceapp.controller;

import de.thm.voiceapp.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public String register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (userService.userExists(username)) {
            return "User exists already.";
        }

        userService.saveUser(username, password);
        return "User registered.";
    }

    @PostMapping("/login")
    public String login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (userService.checkLogin(username, password)) {
            return "Login successful.";
        }

        return "Invalid credentials.";
    }
}
