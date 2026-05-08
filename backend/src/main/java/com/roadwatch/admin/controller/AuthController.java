package com.roadwatch.admin.controller;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.roadwatch.admin.config.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private JwtService jwtService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            DocumentSnapshot doc = FirestoreClient.getFirestore()
                    .collection("admin")
                    .document(email)
                    .get().get();

            if (!doc.exists()) {
                return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
            }

            String hashedPassword = doc.getString("password");

            if (!passwordEncoder.matches(password, hashedPassword)) {
                return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
            }

            String token = jwtService.generateToken(email, "ADMIN");
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("email", email);
            response.put("role", "ADMIN");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}