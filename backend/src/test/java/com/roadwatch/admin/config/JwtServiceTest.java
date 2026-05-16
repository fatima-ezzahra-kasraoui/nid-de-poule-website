package com.roadwatch.admin.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests unitaires - JwtService")
class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
    }

    // ─────────────────────────────────────────────
    // generateToken
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("generateToken : doit retourner un token non nul")
    void generateToken_shouldReturnNonNullToken() {
        String token = jwtService.generateToken("admin@roadwatch.com", "ADMIN");
        assertNotNull(token, "Le token généré ne doit pas être null");
        assertFalse(token.isBlank(), "Le token généré ne doit pas être vide");
    }

    @Test
    @DisplayName("generateToken : le token doit avoir 3 segments (header.payload.signature)")
    void generateToken_shouldHaveThreeSegments() {
        String token = jwtService.generateToken("admin@roadwatch.com", "ADMIN");
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length, "Un JWT valide doit avoir exactement 3 segments");
    }

    // ─────────────────────────────────────────────
    // extractEmail
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("extractEmail : doit retourner l'email encodé dans le token")
    void extractEmail_shouldReturnCorrectEmail() {
        String email = "admin@roadwatch.com";
        String token = jwtService.generateToken(email, "ADMIN");
        String extracted = jwtService.extractEmail(token);
        assertEquals(email, extracted, "L'email extrait doit correspondre à celui encodé");
    }

    @Test
    @DisplayName("extractEmail : doit fonctionner avec différents emails")
    void extractEmail_shouldWorkWithDifferentEmails() {
        String email = "fatima@roadwatch.com";
        String token = jwtService.generateToken(email, "ADMIN");
        assertEquals(email, jwtService.extractEmail(token));
    }

    // ─────────────────────────────────────────────
    // isTokenValid
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("isTokenValid : doit retourner true pour un token valide avec le bon email")
    void isTokenValid_shouldReturnTrueForValidToken() {
        String email = "admin@roadwatch.com";
        String token = jwtService.generateToken(email, "ADMIN");
        assertTrue(jwtService.isTokenValid(token, email), "Un token fraîchement généré doit être valide");
    }

    @Test
    @DisplayName("isTokenValid : doit retourner false si l'email ne correspond pas")
    void isTokenValid_shouldReturnFalseForWrongEmail() {
        String token = jwtService.generateToken("admin@roadwatch.com", "ADMIN");
        assertFalse(jwtService.isTokenValid(token, "autre@roadwatch.com"),
                "La validation doit échouer si l'email ne correspond pas");
    }

    @Test
    @DisplayName("isTokenValid : doit retourner false pour un token falsifié")
    void isTokenValid_shouldThrowForTamperedToken() {
        String token = jwtService.generateToken("admin@roadwatch.com", "ADMIN");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertThrows(Exception.class, () -> jwtService.isTokenValid(tampered, "admin@roadwatch.com"),
                "Un token falsifié doit lever une exception");
    }

    // ─────────────────────────────────────────────
    // Tokens distincts pour emails différents
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("generateToken : deux emails différents produisent des tokens différents")
    void generateToken_shouldProduceDifferentTokensForDifferentEmails() {
        String token1 = jwtService.generateToken("admin@roadwatch.com", "ADMIN");
        String token2 = jwtService.generateToken("fatima@roadwatch.com", "ADMIN");
        assertNotEquals(token1, token2, "Deux emails différents doivent produire des tokens différents");
    }
}
