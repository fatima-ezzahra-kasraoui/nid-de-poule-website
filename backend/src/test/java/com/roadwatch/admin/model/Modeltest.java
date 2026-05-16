package com.roadwatch.admin.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests unitaires - Models")
class ModelTest {

    // ═══════════════════════════════════════════
    // PotholeReport
    // ═══════════════════════════════════════════

    @Test
    @DisplayName("PotholeReport : constructeur vide et getters/setters")
    void potholeReport_gettersSetters() {
        PotholeReport r = new PotholeReport();
        r.setId("r-1");
        r.setUserId("u-1");
        r.setUserEmail("test@test.com");
        r.setLatitude(33.59);
        r.setLongitude(-7.60);
        r.setAddress("Rue Hassan II");
        r.setStatus("pending");
        r.setTimestamp(1700000000000L);
        r.setPhotoUrl("http://photo.jpg");
        r.setDescription("Nid de poule");
        r.setAiDetected(true);
        r.setAiConfidence(0.87);
        r.setCommentCount(3);
        r.setLikeCount(5);

        assertEquals("r-1", r.getId());
        assertEquals("u-1", r.getUserId());
        assertEquals("test@test.com", r.getUserEmail());
        assertEquals(33.59, r.getLatitude());
        assertEquals(-7.60, r.getLongitude());
        assertEquals("Rue Hassan II", r.getAddress());
        assertEquals("pending", r.getStatus());
        assertEquals(1700000000000L, r.getTimestamp());
        assertEquals("http://photo.jpg", r.getPhotoUrl());
        assertEquals("Nid de poule", r.getDescription());
        assertTrue(r.isAiDetected());
        assertEquals(0.87, r.getAiConfidence());
        assertEquals(3, r.getCommentCount());
    }

    @Test
    @DisplayName("PotholeReport : getStatusLabel() pour chaque statut")
    void potholeReport_getStatusLabel() {
        PotholeReport r = new PotholeReport();

        r.setStatus("pending");
        assertEquals("En attente", r.getStatusLabel());

        r.setStatus("confirmed");
        assertEquals("Confirmé", r.getStatusLabel());

        r.setStatus("fixed");
        assertEquals("Réparé", r.getStatusLabel());

        r.setStatus("unknown");
        assertEquals("Inconnu", r.getStatusLabel());

        r.setStatus(null);
        assertEquals("Inconnu", r.getStatusLabel());
    }

    @Test
    @DisplayName("PotholeReport : getAiConfidencePercent()")
    void potholeReport_getAiConfidencePercent() {
        PotholeReport r = new PotholeReport();
        r.setAiConfidence(0.87);
        assertEquals(87, r.getAiConfidencePercent());

        r.setAiConfidence(0.0);
        assertEquals(0, r.getAiConfidencePercent());

        r.setAiConfidence(1.0);
        assertEquals(100, r.getAiConfidencePercent());
    }

    @Test
    @DisplayName("PotholeReport : getFormattedDate() avec timestamp valide")
    void potholeReport_getFormattedDate_validTimestamp() {
        PotholeReport r = new PotholeReport();
        r.setTimestamp(1700000000000L);
        String date = r.getFormattedDate();
        assertNotNull(date);
        assertTrue(date.contains("/"));
    }

    @Test
    @DisplayName("PotholeReport : getFormattedDate() avec timestamp <= 0 → '-'")
    void potholeReport_getFormattedDate_zeroTimestamp() {
        PotholeReport r = new PotholeReport();
        r.setTimestamp(0);
        assertEquals("-", r.getFormattedDate());
    }

    @Test
    @DisplayName("PotholeReport : getLikeCount() depuis likedBy si non vide")
    void potholeReport_getLikeCount_fromLikedBy() {
        PotholeReport r = new PotholeReport();
        r.setLikedBy(Arrays.asList("u1", "u2", "u3"));
        assertEquals(3, r.getLikeCount());
    }

    @Test
    @DisplayName("PotholeReport : getLikeCount() depuis likeCount si likedBy vide")
    void potholeReport_getLikeCount_fromLikeCount() {
        PotholeReport r = new PotholeReport();
        r.setLikedBy(List.of());
        r.setLikeCount(7);
        assertEquals(7, r.getLikeCount());
    }

    @Test
    @DisplayName("PotholeReport : setLikedBy et getLikedBy")
    void potholeReport_likedBy() {
        PotholeReport r = new PotholeReport();
        List<String> liked = Arrays.asList("u1", "u2");
        r.setLikedBy(liked);
        assertEquals(2, r.getLikedBy().size());
    }

    // ═══════════════════════════════════════════
    // HistoryEntry
    // ═══════════════════════════════════════════

    @Test
    @DisplayName("HistoryEntry : constructeur vide et getters/setters")
    void historyEntry_gettersSetters() {
        HistoryEntry e = new HistoryEntry();
        e.setId("h-1");
        e.setReportId("r-1");
        e.setAction("STATUS_CHANGE");
        e.setOldValue("pending");
        e.setNewValue("confirmed");
        e.setUserEmail("admin@roadwatch.com");
        Date now = new Date();
        e.setTimestamp(now);

        assertEquals("h-1", e.getId());
        assertEquals("r-1", e.getReportId());
        assertEquals("STATUS_CHANGE", e.getAction());
        assertEquals("pending", e.getOldValue());
        assertEquals("confirmed", e.getNewValue());
        assertEquals("admin@roadwatch.com", e.getUserEmail());
        assertEquals(now, e.getTimestamp());
    }

    @Test
    @DisplayName("HistoryEntry : constructeur avec paramètres")
    void historyEntry_constructorWithParams() {
        HistoryEntry e = new HistoryEntry("r-1", "STATUS_CHANGE", "pending", "fixed", "admin@roadwatch.com");

        assertEquals("r-1", e.getReportId());
        assertEquals("STATUS_CHANGE", e.getAction());
        assertEquals("pending", e.getOldValue());
        assertEquals("fixed", e.getNewValue());
        assertEquals("admin@roadwatch.com", e.getUserEmail());
        assertNotNull(e.getTimestamp());
    }

    // ═══════════════════════════════════════════
    // Comment
    // ═══════════════════════════════════════════

    @Test
    @DisplayName("Comment : constructeur vide et getters/setters")
    void comment_gettersSetters() {
        Comment c = new Comment();
        c.setId("c-1");
        c.setReportId("r-1");
        c.setUserId("u-1");
        c.setUserEmail("user@test.com");
        c.setText("Beau nid de poule");
        c.setTimestamp(1700000000000L);
        c.setModerated(true);

        assertEquals("c-1", c.getId());
        assertEquals("r-1", c.getReportId());
        assertEquals("u-1", c.getUserId());
        assertEquals("user@test.com", c.getUserEmail());
        assertEquals("Beau nid de poule", c.getText());
        assertEquals(1700000000000L, c.getTimestamp());
        assertTrue(c.isModerated());
    }

    @Test
    @DisplayName("Comment : constructeur avec paramètres")
    void comment_constructorWithParams() {
        Comment c = new Comment("r-1", "u-1", "user@test.com", "Super commentaire");

        assertEquals("r-1", c.getReportId());
        assertEquals("u-1", c.getUserId());
        assertEquals("user@test.com", c.getUserEmail());
        assertEquals("Super commentaire", c.getText());
        assertFalse(c.isModerated());
        assertTrue(c.getTimestamp() > 0);
    }

    @Test
    @DisplayName("Comment : moderated par défaut est false")
    void comment_defaultModerated() {
        Comment c = new Comment("r-1", "u-1", "user@test.com", "text");
        assertFalse(c.isModerated());
    }
}