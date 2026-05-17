package com.roadwatch.admin.controller;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

@Controller
@CrossOrigin(origins = {"http://localhost:5173", "http://192.168.11.106:30080", "http://localhost:30080", "https://fool-accent-uncrushed.ngrok-free.app"})
public class NotificationController {

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @GetMapping(value = "/api/notifications/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));

        System.out.println("✅ Nouvel admin connecté aux notifications. Total: " + emitters.size());

        return emitter;
    }

    private final Set<String> sentNotifications = new HashSet<>();

    public void sendNotification(String title, String message, String type, String reportId) {
        // Éviter les doublons pour le même reportId
        if (reportId != null && sentNotifications.contains(reportId)) {
            System.out.println("⚠️ Notification déjà envoyée pour reportId: " + reportId);
            return;
        }

        if (reportId != null) {
            sentNotifications.add(reportId);
        }

        Map<String, Object> notification = new HashMap<>();
        notification.put("title", title);
        notification.put("message", message);
        notification.put("type", type);
        notification.put("timestamp", System.currentTimeMillis());
        notification.put("reportId", reportId);

        System.out.println("🔔 Envoi notification pour reportId: " + reportId);

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(notification));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

    // Méthode sans ID (pour compatibilité)
    public void sendNotification(String title, String message, String type) {
        sendNotification(title, message, type, null);
    }
}