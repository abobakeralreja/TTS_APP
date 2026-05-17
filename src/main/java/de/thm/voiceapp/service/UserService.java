package de.thm.voiceapp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.thm.voiceapp.model.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {

    private final ObjectMapper mapper = new ObjectMapper();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final File file = new File("src/main/resources/data/users.json");

    public List<User> getUsers() {
        try {
            var root = mapper.readTree(file);
            var usersNode = root.get("users");

            List<User> users = new ArrayList<>();
            if (usersNode != null && usersNode.isArray()) {
                for (var n : usersNode) {
                    User u = mapper.treeToValue(n, User.class);
                    users.add(u);
                }
            }
            return users;

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public boolean userExists(String username) {
        return getUsers().stream()
                .anyMatch(u -> u.getUsername().equalsIgnoreCase(username));
    }

    public void saveUser(String username, String password) {
        try {
            var root = mapper.readTree(file);
            var users = root.get("users");

            List<User> userList = new ArrayList<>();
            for (var u : users) {
                userList.add(mapper.treeToValue(u, User.class));
            }

            User newUser = new User();
            newUser.setUsername(username);
            newUser.setPassword(encoder.encode(password));

            userList.add(newUser);

            var newRoot = mapper.createObjectNode();
            newRoot.putPOJO("users", userList);

            mapper.writerWithDefaultPrettyPrinter().writeValue(file, newRoot);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public boolean checkLogin(String username, String password) {
        return getUsers().stream().anyMatch(u ->
                u.getUsername().equalsIgnoreCase(username) &&
                encoder.matches(password, u.getPassword())
        );
    }
}