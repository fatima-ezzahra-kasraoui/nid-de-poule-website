package com.roadwatch.admin.controller;

import com.google.firebase.auth.UserRecord;
import com.roadwatch.admin.dao.FirebaseAuthDAO;
import com.roadwatch.admin.dao.ReportDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private FirebaseAuthDAO firebaseAuthDAO;

    @Autowired
    private ReportDAO reportDAO;

    // GET /api/users - Liste tous les utilisateurs Firebase Auth
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<Map<String, Object>> users = new ArrayList<>();
            List<UserRecord> firebaseUsers = firebaseAuthDAO.getAllUsers();

            for (UserRecord user : firebaseUsers) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("uid", user.getUid());
                userInfo.put("email", user.getEmail());
                userInfo.put("displayName", user.getDisplayName());
                userInfo.put("photoUrl", user.getPhotoUrl());
                userInfo.put("creationTimestamp", user.getUserMetadata().getCreationTimestamp());
                userInfo.put("lastSignInTimestamp", user.getUserMetadata().getLastSignInTimestamp());
                userInfo.put("disabled", user.isDisabled());
                userInfo.put("phoneNumber", user.getPhoneNumber());
                userInfo.put("emailVerified", user.isEmailVerified());

                // Compter les signalements de cet utilisateur
                int reportCount = reportDAO.getReportsCountByUserId(user.getUid());
                userInfo.put("reportCount", reportCount);

                users.add(userInfo);
            }

            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/users/stats - Statistiques des utilisateurs
    @GetMapping("/stats")
    public ResponseEntity<?> getUserStats() {
        try {
            List<UserRecord> users = firebaseAuthDAO.getAllUsers();

            long total = users.size();
            long desactives = users.stream().filter(UserRecord::isDisabled).count();
            long actives = total - desactives;
            long totalSignalements = 0;

            for (UserRecord user : users) {
                totalSignalements += reportDAO.getReportsCountByUserId(user.getUid());
            }

            Map<String, Object> stats = Map.of(
                    "total", total,
                    "actifs", actives,
                    "desactives", desactives,
                    "totalSignalements", totalSignalements
            );

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/users/{uid} - Détails d'un utilisateur avec ses signalements
    @GetMapping("/{uid}")
    public ResponseEntity<?> getUserDetails(@PathVariable String uid) {
        try {
            UserRecord user = firebaseAuthDAO.getUserByUid(uid);
            var reports = reportDAO.getReportsByUserId(uid);

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("uid", user.getUid());
            userInfo.put("email", user.getEmail());
            userInfo.put("displayName", user.getDisplayName());
            userInfo.put("creationTimestamp", user.getUserMetadata().getCreationTimestamp());
            userInfo.put("lastSignInTimestamp", user.getUserMetadata().getLastSignInTimestamp());
            userInfo.put("disabled", user.isDisabled());
            userInfo.put("reports", reports);
            userInfo.put("reportCount", reports.size());

            return ResponseEntity.ok(userInfo);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/users/{uid}/disable - Désactiver un utilisateur
    @PostMapping("/{uid}/disable")
    public ResponseEntity<?> disableUser(@PathVariable String uid) {
        try {
            firebaseAuthDAO.disableUser(uid);
            return ResponseEntity.ok(Map.of("success", true, "disabled", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/users/{uid}/enable - Activer un utilisateur
    @PostMapping("/{uid}/enable")
    public ResponseEntity<?> enableUser(@PathVariable String uid) {
        try {
            firebaseAuthDAO.enableUser(uid);
            return ResponseEntity.ok(Map.of("success", true, "disabled", false));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/users/{uid} - Supprimer un utilisateur
    @DeleteMapping("/{uid}")
    public ResponseEntity<?> deleteUser(@PathVariable String uid) {
        try {
            firebaseAuthDAO.deleteUser(uid);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}