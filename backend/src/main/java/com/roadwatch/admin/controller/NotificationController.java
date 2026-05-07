package com.roadwatch.admin.controller;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

@Controller
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @GetMapping(value = "/api/notifications/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));


        return emitter;
    }

    public void sendNotification(String title, String message, String type) {
        Notification notification = new Notification(title, message, type, System.currentTimeMillis());
        System.out.println("🔔 Envoi notification: " + title + " à " + emitters.size() + " admins");

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

    public static class Notification {
        private String title;
        private String message;
        private String type;
        private long timestamp;

        public Notification(String title, String message, String type, long timestamp) {
            this.title = title;
            this.message = message;
            this.type = type;
            this.timestamp = timestamp;
        }

        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public String getType() { return type; }
        public long getTimestamp() { return timestamp; }
    }
}