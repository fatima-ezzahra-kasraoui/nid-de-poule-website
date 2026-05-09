package com.roadwatch.admin.dao;

import com.google.firebase.auth.*;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class FirebaseAuthDAO {

    // Récupérer tous les utilisateurs Firebase Auth
    public List<UserRecord> getAllUsers() throws FirebaseAuthException {
        List<UserRecord> users = new ArrayList<>();
        ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);

        while (page != null) {
            for (ExportedUserRecord user : page.getValues()) {
                users.add(user);
            }
            page = page.getNextPage();
        }
        return users;
    }

    // Récupérer un utilisateur par UID
    public UserRecord getUserByUid(String uid) throws FirebaseAuthException {
        return FirebaseAuth.getInstance().getUser(uid);
    }

    // Récupérer un utilisateur par email
    public UserRecord getUserByEmail(String email) throws FirebaseAuthException {
        return FirebaseAuth.getInstance().getUserByEmail(email);
    }

    // Désactiver un utilisateur (Corrigé)
    public void disableUser(String uid) throws FirebaseAuthException {
        UserRecord user = FirebaseAuth.getInstance().getUser(uid);
        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid);
        request.setDisabled(true);
        FirebaseAuth.getInstance().updateUser(request);
    }

    // Activer un utilisateur (Corrigé)
    public void enableUser(String uid) throws FirebaseAuthException {
        UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(uid);
        request.setDisabled(false);
        FirebaseAuth.getInstance().updateUser(request);
    }

    // Supprimer un utilisateur
    public void deleteUser(String uid) throws FirebaseAuthException {
        FirebaseAuth.getInstance().deleteUser(uid);
    }

    // Définir un claim personnalisé (ex: rôle bloqué)
    public void setUserClaim(String uid, String key, Object value) throws FirebaseAuthException {
        Map<String, Object> claims = new HashMap<>();
        claims.put(key, value);
        FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
    }
}