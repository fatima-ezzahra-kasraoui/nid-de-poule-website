package com.roadwatch.admin.controller;

import com.roadwatch.admin.dao.CommentDAO;
import com.roadwatch.admin.dao.HistoryDAO;
import com.roadwatch.admin.dao.ReportDAO;
import com.roadwatch.admin.model.HistoryEntry;
import com.roadwatch.admin.model.PotholeReport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests supplémentaires - ReportController")
class ReportControllerExtraTest {

    @Mock private ReportDAO reportDAO;
    @Mock private CommentDAO commentDAO;
    @Mock private HistoryDAO historyDAO;
    @Mock private NotificationController notificationController;

    @InjectMocks
    private ReportController reportController;

    private PotholeReport sampleReport;

    @BeforeEach
    void setUp() {
        sampleReport = new PotholeReport();
        sampleReport.setId("report-001");
        sampleReport.setAddress("Avenue Mohammed V, Casablanca");
        sampleReport.setStatus("pending");
        sampleReport.setLatitude(33.59);
        sampleReport.setLongitude(-7.60);
        sampleReport.setAiConfidence(0.9f);
        sampleReport.setTimestamp(System.currentTimeMillis());
    }

    // ── getDashboard ──────────────────────────────

    @Test
    @DisplayName("getDashboard : succès → 200")
    void getDashboard_shouldReturn200() throws ExecutionException, InterruptedException {
        when(reportDAO.countByStatus()).thenReturn(Map.of("total", 10L, "pending", 3L, "confirmed", 4L, "fixed", 3L));
        when(reportDAO.getAvgRepairTimeDays()).thenReturn(2.5);
        when(reportDAO.getAllReports()).thenReturn(List.of(sampleReport));

        ResponseEntity<Map<String, Object>> response = reportController.getDashboard();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("total"));
        assertTrue(response.getBody().containsKey("recentReports"));
    }

    @Test
    @DisplayName("getDashboard : erreur DAO → 500")
    void getDashboard_whenDaoThrows_shouldReturn500() throws ExecutionException, InterruptedException {
        when(reportDAO.countByStatus()).thenThrow(new RuntimeException("Firebase error"));

        ResponseEntity<Map<String, Object>> response = reportController.getDashboard();

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ── getStats ──────────────────────────────────

    @Test
    @DisplayName("getStats : doit retourner byMonth, byStatus, avgRepairDays")
    void getStats_shouldReturnStats() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportsByMonth()).thenReturn(Map.of("01/2024", 5));
        when(reportDAO.countByStatus()).thenReturn(Map.of("total", 10L));
        when(reportDAO.getAvgRepairTimeDays()).thenReturn(3.5);

        ResponseEntity<Map<String, Object>> response = reportController.getStats();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("byMonth"));
        assertTrue(response.getBody().containsKey("byStatus"));
        assertTrue(response.getBody().containsKey("avgRepairDays"));
    }

    @Test
    @DisplayName("getStats : erreur DAO → 500")
    void getStats_whenDaoThrows_shouldReturn500() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportsByMonth()).thenThrow(new RuntimeException("Firebase error"));

        ResponseEntity<Map<String, Object>> response = reportController.getStats();

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ── getReports ────────────────────────────────

    @Test
    @DisplayName("getReports : sans filtre → retourne tous les signalements")
    void getReports_noFilter_shouldReturnAll() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportsFiltered(null, null, null)).thenReturn(List.of(sampleReport));
        when(commentDAO.getCommentsCount("report-001")).thenReturn(2);

        ResponseEntity<List<PotholeReport>> response = reportController.getReports(null, null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals(2, response.getBody().get(0).getCommentCount());
    }

    @Test
    @DisplayName("getReports : avec filtre status → retourne les signalements filtrés")
    void getReports_withStatusFilter_shouldReturnFiltered() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportsFiltered("pending", null, null)).thenReturn(List.of(sampleReport));
        when(commentDAO.getCommentsCount("report-001")).thenReturn(0);

        ResponseEntity<List<PotholeReport>> response = reportController.getReports("pending", null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        verify(reportDAO).getReportsFiltered("pending", null, null);
    }

    @Test
    @DisplayName("getReports : liste vide → 200 avec liste vide")
    void getReports_emptyList_shouldReturn200() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportsFiltered(any(), any(), any())).thenReturn(Collections.emptyList());

        ResponseEntity<List<PotholeReport>> response = reportController.getReports(null, null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    @DisplayName("getReports : erreur DAO → 500")
    void getReports_whenDaoThrows_shouldReturn500() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportsFiltered(any(), any(), any()))
                .thenThrow(new RuntimeException("Firebase error"));

        ResponseEntity<List<PotholeReport>> response = reportController.getReports(null, null, null);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ── getReportById ─────────────────────────────

    @Test
    @DisplayName("getReportById : ID valide → 200")
    void getReportById_validId_shouldReturn200() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportById("report-001")).thenReturn(sampleReport);
        when(commentDAO.getCommentsCount("report-001")).thenReturn(3);

        ResponseEntity<?> response = reportController.getReportById("report-001");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    @DisplayName("getReportById : non trouvé → 404")
    void getReportById_notFound_shouldReturn404() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportById("unknown")).thenReturn(null);

        ResponseEntity<?> response = reportController.getReportById("unknown");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("getReportById : erreur DAO → 500")
    void getReportById_whenDaoThrows_shouldReturn500() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportById(any())).thenThrow(new RuntimeException("Firebase error"));

        ResponseEntity<?> response = reportController.getReportById("report-001");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ── updateStatus ──────────────────────────────

    @Test
    @DisplayName("updateStatus : status valide → 200")
    void updateStatus_valid_shouldReturn200() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportById("report-001")).thenReturn(sampleReport);
        doNothing().when(reportDAO).updateStatus(any(), any());
        doNothing().when(historyDAO).addHistoryEntry(any());

        ResponseEntity<Map<String, Object>> response = reportController.updateStatus(
                "report-001", Map.of("status", "confirmed"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("confirmed", response.getBody().get("status"));
    }

    @Test
    @DisplayName("updateStatus : status invalide → 400")
    void updateStatus_invalid_shouldReturn400() throws ExecutionException, InterruptedException {
        ResponseEntity<Map<String, Object>> response = reportController.updateStatus(
                "report-001", Map.of("status", "invalid"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("updateStatus : fixed → envoie notification")
    void updateStatus_fixed_shouldSendNotification() throws ExecutionException, InterruptedException {
        when(reportDAO.getReportById("report-001")).thenReturn(sampleReport);
        doNothing().when(reportDAO).updateStatus(any(), any());
        doNothing().when(historyDAO).addHistoryEntry(any());

        reportController.updateStatus("report-001", Map.of("status", "fixed"));

        verify(notificationController).sendNotification(any(), any(), eq("success"), eq("report-001"));
    }

    // ── createReport ──────────────────────────────

    @Test
    @DisplayName("createReport : succès → 200 avec ID")
    void createReport_shouldReturn200() throws ExecutionException, InterruptedException {
        when(reportDAO.saveReport(any())).thenReturn(null);

        ResponseEntity<Map<String, Object>> response = reportController.createReport(sampleReport);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("id"));
        assertEquals(true, response.getBody().get("success"));
    }

    @Test
    @DisplayName("createReport : erreur DAO → 500")
    void createReport_whenDaoThrows_shouldReturn500() throws ExecutionException, InterruptedException {
        doThrow(new RuntimeException("Firebase error")).when(reportDAO).saveReport(any());

        ResponseEntity<Map<String, Object>> response = reportController.createReport(sampleReport);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ── deleteReport ──────────────────────────────

    @Test
    @DisplayName("deleteReport : ID valide → 200")
    void deleteReport_validId_shouldReturn200() throws ExecutionException, InterruptedException {
        when(reportDAO.getAllReports()).thenReturn(List.of(sampleReport));
        doNothing().when(reportDAO).deleteReport("report-001");

        ResponseEntity<?> response = reportController.deleteReport("report-001");

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("deleteReport : ID inexistant → 404")
    void deleteReport_notFound_shouldReturn404() throws ExecutionException, InterruptedException {
        when(reportDAO.getAllReports()).thenReturn(Collections.emptyList());

        ResponseEntity<?> response = reportController.deleteReport("unknown");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    // ── getComments ───────────────────────────────

    @Test
    @DisplayName("getComments : succès → 200")
    void getComments_shouldReturn200() throws ExecutionException, InterruptedException {
        when(commentDAO.getCommentsByReportId(any(), anyInt(), anyInt())).thenReturn(Collections.emptyList());
        when(commentDAO.getCommentsCount(any())).thenReturn(0);

        ResponseEntity<?> response = reportController.getComments("report-001", 0, 20);

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    // ── deleteComment ─────────────────────────────

    @Test
    @DisplayName("deleteComment : IDs valides → 200")
    void deleteComment_validIds_shouldReturn200() throws ExecutionException, InterruptedException {
        doNothing().when(commentDAO).deleteComment("report-001", "comment-001");

        ResponseEntity<?> response = reportController.deleteComment("report-001", "comment-001");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(true, body.get("success"));
        verify(commentDAO).deleteComment("report-001", "comment-001");
    }

    @Test
    @DisplayName("deleteComment : erreur DAO → 500")
    void deleteComment_whenDaoThrows_shouldReturn500() throws ExecutionException, InterruptedException {
        doThrow(new RuntimeException("Firebase error")).when(commentDAO).deleteComment(any(), any());

        ResponseEntity<?> response = reportController.deleteComment("report-001", "comment-001");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ── getLikes ──────────────────────────────────

    @Test
    @DisplayName("getLikes : succès → 200")
    void getLikes_shouldReturn200() throws ExecutionException, InterruptedException {
        when(reportDAO.getLikedByRaw("report-001")).thenReturn(List.of("user1", "user2"));

        ResponseEntity<?> response = reportController.getLikes("report-001");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(2, body.get("likeCount"));
    }

    @Test
    @DisplayName("getLikes : erreur DAO → 500")
    void getLikes_whenDaoThrows_shouldReturn500() throws ExecutionException, InterruptedException {
        when(reportDAO.getLikedByRaw(any())).thenThrow(new RuntimeException("Firebase error"));

        ResponseEntity<?> response = reportController.getLikes("report-001");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ── getReportHistory ──────────────────────────

    @Test
    @DisplayName("getReportHistory : ID valide → 200 avec historique")
    void getReportHistory_validId_shouldReturn200() throws ExecutionException, InterruptedException {
        HistoryEntry entry = new HistoryEntry("report-001", "STATUS_CHANGE", "pending", "confirmed", "admin@roadwatch.com");
        when(historyDAO.getHistoryByReportId("report-001")).thenReturn(List.of(entry));

        ResponseEntity<?> response = reportController.getReportHistory("report-001");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        List<?> body = (List<?>) response.getBody();
        assertEquals(1, body.size());
    }

    @Test
    @DisplayName("getReportHistory : liste vide → 200")
    void getReportHistory_emptyHistory_shouldReturn200() throws ExecutionException, InterruptedException {
        when(historyDAO.getHistoryByReportId("report-001")).thenReturn(Collections.emptyList());

        ResponseEntity<?> response = reportController.getReportHistory("report-001");

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("getReportHistory : erreur DAO → 500")
    void getReportHistory_whenDaoThrows_shouldReturn500() throws ExecutionException, InterruptedException {
        when(historyDAO.getHistoryByReportId(any())).thenThrow(new RuntimeException("Firebase error"));

        ResponseEntity<?> response = reportController.getReportHistory("report-001");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}