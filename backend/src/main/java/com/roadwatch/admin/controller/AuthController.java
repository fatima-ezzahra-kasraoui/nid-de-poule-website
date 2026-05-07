package com.roadwatch.admin.controller;

import com.roadwatch.admin.config.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Compte admin par défaut
    private final Map<String, String> adminUsers = new HashMap<>();

    // Plus de constructeur ! On utilise @PostConstruct pour initialiser
    @javax.annotation.PostConstruct
    public void init() {
        // Mot de passe encodé : "admin123"
        adminUsers.put("admin@roadwatch.com", passwordEncoder.encode("admin123"));
        adminUsers.put("fatima@roadwatch.com", passwordEncoder.encode("admin123"));
        System.out.println("✅ Comptes admin créés");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (!adminUsers.containsKey(email)) {
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
        }

        String storedPassword = adminUsers.get(email);
        if (!passwordEncoder.matches(password, storedPassword)) {
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
        }

        String token = jwtService.generateToken(email, "ADMIN");

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("email", email);
        response.put("role", "ADMIN");

        return ResponseEntity.ok(response);
    }
}