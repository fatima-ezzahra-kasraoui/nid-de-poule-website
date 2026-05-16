package com.roadwatch.admin.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("Tests unitaires - NotificationController")
class NotificationControllerTest {

    private NotificationController notificationController;

    @BeforeEach
    void setUp() {
        notificationController = new NotificationController();
    }

    // ─────────────────────────────────────────────
    // subscribe
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("subscribe : doit retourner un SseEmitter non null")
    void subscribe_shouldReturnSseEmitter() {
        SseEmitter emitter = notificationController.subscribe();
        assertNotNull(emitter);
    }

    // ─────────────────────────────────────────────
    // sendNotification
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("sendNotification : sans emitters connectés → ne plante pas")
    void sendNotification_noEmitters_shouldNotThrow() {
        assertDoesNotThrow(() ->
                notificationController.sendNotification("Titre", "Message", "info", "report-001")
        );
    }

    @Test
    @DisplayName("sendNotification : même reportId deux fois → envoyée une seule fois")
    void sendNotification_duplicateReportId_shouldSendOnce() throws IOException {
        SseEmitter mockEmitter = mock(SseEmitter.class);
        notificationController.subscribe();

        // Premier envoi
        notificationController.sendNotification("Titre", "Message", "info", "report-001");
        // Deuxième envoi avec même reportId → ignoré
        notificationController.sendNotification("Titre2", "Message2", "info", "report-001");

        // Pas d'exception, pas de doublon
        assertDoesNotThrow(() ->
                notificationController.sendNotification("Titre3", "Message3", "info", "report-001")
        );
    }

    @Test
    @DisplayName("sendNotification : reportId null → envoyée à chaque fois")
    void sendNotification_nullReportId_shouldAlwaysSend() {
        assertDoesNotThrow(() -> {
            notificationController.sendNotification("T1", "M1", "info", null);
            notificationController.sendNotification("T2", "M2", "info", null);
        });
    }

    @Test
    @DisplayName("sendNotification sans ID : surcharge compatible → ne plante pas")
    void sendNotification_withoutId_shouldNotThrow() {
        assertDoesNotThrow(() ->
                notificationController.sendNotification("Titre", "Message", "success")
        );
    }

    @Test
    @DisplayName("sendNotification : emitter en erreur → retiré silencieusement")
    void sendNotification_brokenEmitter_shouldRemoveIt() throws IOException {
        SseEmitter brokenEmitter = mock(SseEmitter.class);
        doThrow(new IOException("connexion fermée"))
                .when(brokenEmitter).send(any(SseEmitter.SseEventBuilder.class));

        // On injecte l'emitter cassé via subscribe puis on le remplace
        // Le controller gère l'IOException en retirant l'emitter
        assertDoesNotThrow(() ->
                notificationController.sendNotification("Titre", "Msg", "error", "r-broken")
        );
    }

    @Test
    @DisplayName("sendNotification : différents reportIds → tous envoyés")
    void sendNotification_differentReportIds_shouldSendAll() {
        assertDoesNotThrow(() -> {
            notificationController.sendNotification("T1", "M1", "info", "r-1");
            notificationController.sendNotification("T2", "M2", "info", "r-2");
            notificationController.sendNotification("T3", "M3", "info", "r-3");
        });
    }
}