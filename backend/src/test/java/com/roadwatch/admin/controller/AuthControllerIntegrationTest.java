package com.roadwatch.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roadwatch.admin.config.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Tests d'intégration - AuthController")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ─────────────────────────────────────────────
    // POST /api/auth/login — Succès
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("Login réussi avec admin@roadwatch.com / admin123")
    void login_withValidCredentials_shouldReturn200AndToken()
            throws Exception, ExecutionException {
        Map<String, String> body = Map.of("email", "admin@roadwatch.com", "password", "admin123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("admin@roadwatch.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        Map<?, ?> response = objectMapper.readValue(responseBody, Map.class);
        String token = (String) response.get("token");

        assertNotNull(token);
        assertEquals("admin@roadwatch.com", jwtService.extractEmail(token));
    }

    @Test
    @DisplayName("Login réussi avec koka@roadwatch.com / admin123")
    void login_withSecondAdmin_shouldReturn200AndToken()
            throws Exception, ExecutionException {
        Map<String, String> body = Map.of("email", "koka@roadwatch.com", "password", "admin123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("koka@roadwatch.com"));
    }

    // ─────────────────────────────────────────────
    // POST /api/auth/login — Échec
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("Login échoué : email inconnu → 401")
    void login_withUnknownEmail_shouldReturn401()
            throws Exception, ExecutionException {
        Map<String, String> body = Map.of("email", "inconnu@roadwatch.com", "password", "admin123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Email ou mot de passe incorrect"));
    }

    @Test
    @DisplayName("Login échoué : mauvais mot de passe → 401")
    void login_withWrongPassword_shouldReturn401()
            throws Exception, ExecutionException {
        Map<String, String> body = Map.of("email", "admin@roadwatch.com", "password", "mauvais");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Email ou mot de passe incorrect"));
    }

    @Test
    @DisplayName("Login échoué : corps vide → pas de 200")
    void login_withEmptyBody_shouldNotReturn200()
            throws Exception, ExecutionException {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().is(not(200)));
    }

    // ─────────────────────────────────────────────
    // Sécurité : routes protégées sans token
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/reports sans token → 401")
    void protectedRoute_withoutToken_shouldReturn401()
            throws Exception, ExecutionException {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/reports"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/dashboard sans token → 401")
    void dashboard_withoutToken_shouldReturn401()
            throws Exception, ExecutionException {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/dashboard avec token valide → pas 401")
    void dashboard_withValidToken_shouldNotReturn401()
            throws Exception, ExecutionException {
        Map<String, String> body = Map.of("email", "admin@roadwatch.com", "password", "admin123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn();

        Map<?, ?> loginResponse = objectMapper.readValue(
                loginResult.getResponse().getContentAsString(), Map.class);
        String token = (String) loginResponse.get("token");

        mockMvc.perform(MockMvcRequestBuilders.get("/api/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().is(not(401)));
    }
}