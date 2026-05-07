package com.roadwatch.admin.service;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    // Stockage temporaire des admins (à remplacer par Firebase plus tard)
    private final Map<String, String> adminAccounts = new HashMap<>();

    public UserDetailsServiceImpl() {
        // Comptes admin (email, mot de passe encodé)
        // Mot de passe: admin123
        adminAccounts.put("admin@roadwatch.com", "$2a$10$N.ZuD9sVQkqZ.QXgZVnRg.S5ZqyCJqYwXqXqXqXqXqXqXqXqXqXq");
        adminAccounts.put("fatima@roadwatch.com", "$2a$10$N.ZuD9sVQkqZ.QXgZVnRg.S5ZqyCJqYwXqXqXqXqXqXqXqXqXqXq");
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (!adminAccounts.containsKey(email)) {
            throw new UsernameNotFoundException("Utilisateur non trouvé: " + email);
        }

        return User.builder()
                .username(email)
                .password(adminAccounts.get(email))
                .roles("ADMIN")
                .build();
    }
}