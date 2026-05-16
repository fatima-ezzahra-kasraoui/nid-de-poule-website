package com.roadwatch.admin.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests unitaires - PotholeReport")
class PotholeReportTest {

    private PotholeReport report;

    @BeforeEach
    void setUp() {
        report = new PotholeReport();
        report.setId("abc-123");
        report.setUserEmail("user@test.com");
        report.setAddress("12 Rue de la Paix, Casablanca");
        report.setLatitude(33.5892);
        report.setLongitude(-7.6031);
        report.setStatus("pending");
        report.setAiDetected(true);
        report.setAiConfidence(0.87f);
        report.setTimestamp(System.currentTimeMillis());
    }

    // ─────────────────────────────────────────────
    // getStatusLabel
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getStatusLabel : 'pending' → 'En attente'")
    void getStatusLabel_pending() {
        report.setStatus("pending");
        assertEquals("En attente", report.getStatusLabel());
    }

    @Test
    @DisplayName("getStatusLabel : 'confirmed' → 'Confirmé'")
    void getStatusLabel_confirmed() {
        report.setStatus("confirmed");
        assertEquals("Confirmé", report.getStatusLabel());
    }

    @Test
    @DisplayName("getStatusLabel : 'fixed' → 'Réparé'")
    void getStatusLabel_fixed() {
        report.setStatus("fixed");
        assertEquals("Réparé", report.getStatusLabel());
    }

    @Test
    @DisplayName("getStatusLabel : valeur inconnue → 'Inconnu'")
    void getStatusLabel_unknown() {
        report.setStatus("xyz");
        assertEquals("Inconnu", report.getStatusLabel());
    }

    @Test
    @DisplayName("getStatusLabel : null → 'Inconnu'")
    void getStatusLabel_null() {
        report.setStatus(null);
        assertEquals("Inconnu", report.getStatusLabel());
    }

    // ─────────────────────────────────────────────
    // getAiConfidencePercent
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getAiConfidencePercent : 0.87 → 87")
    void getAiConfidencePercent_normal() {
        report.setAiConfidence(0.87f);
        assertEquals(87, report.getAiConfidencePercent());
    }

    @Test
    @DisplayName("getAiConfidencePercent : 0.0 → 0")
    void getAiConfidencePercent_zero() {
        report.setAiConfidence(0.0f);
        assertEquals(0, report.getAiConfidencePercent());
    }

    @Test
    @DisplayName("getAiConfidencePercent : 1.0 → 100")
    void getAiConfidencePercent_full() {
        report.setAiConfidence(1.0f);
        assertEquals(100, report.getAiConfidencePercent());
    }

    // ─────────────────────────────────────────────
    // getLikeCount
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getLikeCount : likedBy null → 0")
    void getLikeCount_nullList() {
        report.setLikedBy(null);
        assertEquals(0, report.getLikeCount());
    }

    @Test
    @DisplayName("getLikeCount : liste vide → 0")
    void getLikeCount_emptyList() {
        report.setLikedBy(Collections.emptyList());
        assertEquals(0, report.getLikeCount());
    }

    @Test
    @DisplayName("getLikeCount : 3 éléments → 3")
    void getLikeCount_threeElements() {
        report.setLikedBy(Arrays.asList("uid1", "uid2", "uid3"));
        assertEquals(3, report.getLikeCount());
    }

    // ─────────────────────────────────────────────
    // getFormattedDate
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getFormattedDate : doit retourner une date au format dd/MM/yyyy HH:mm")
    void getFormattedDate_format() {
        report.setTimestamp(1700000000000L); // date fixe
        String formatted = report.getFormattedDate();
        assertNotNull(formatted);
        assertTrue(formatted.matches("\\d{2}/\\d{2}/\\d{4} \\d{2}:\\d{2}"),
                "La date doit être au format dd/MM/yyyy HH:mm, obtenu : " + formatted);
    }

    // ─────────────────────────────────────────────
    // commentCount
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("setCommentCount / getCommentCount : doit stocker et retourner la valeur")
    void commentCount_getterSetter() {
        report.setCommentCount(5);
        assertEquals(5, report.getCommentCount());
    }

    // ─────────────────────────────────────────────
    // Getters / Setters de base
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("Getters / Setters : vérification des champs principaux")
    void gettersSetters_basic() {
        assertEquals("abc-123", report.getId());
        assertEquals("user@test.com", report.getUserEmail());
        assertEquals("12 Rue de la Paix, Casablanca", report.getAddress());
        assertEquals(33.5892, report.getLatitude(), 0.0001);
        assertEquals(-7.6031, report.getLongitude(), 0.0001);
        assertTrue(report.isAiDetected());
    }
}
