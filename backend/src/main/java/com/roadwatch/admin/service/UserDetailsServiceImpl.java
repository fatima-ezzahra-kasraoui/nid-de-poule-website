package com.roadwatch.admin.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try {
            DocumentSnapshot doc = FirestoreClient.getFirestore()
                    .collection("admin")
                    .document(email)
                    .get().get();

            if (!doc.exists()) {
                throw new UsernameNotFoundException("Admin non trouvé : " + email);
            }

            String hashedPassword = doc.getString("password");

            return User.builder()
                    .username(email)
                    .password(hashedPassword)
                    .roles("ADMIN")
                    .build();

        } catch (UsernameNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new UsernameNotFoundException("Erreur Firestore : " + e.getMessage());
        }
    }
}