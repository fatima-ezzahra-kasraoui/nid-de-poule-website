package com.roadwatch.admin.model;

import com.google.cloud.firestore.annotation.IgnoreExtraProperties;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@IgnoreExtraProperties
public class PotholeReport {
    private String id;
    private String userId;
    private String userEmail;
    private double latitude;
    private double longitude;
    private String address;
    private String status;
    private long timestamp;
    private String photoUrl;
    private String description;
    private boolean aiDetected;
    private double aiConfidence;
    private int commentCount;
    private int likeCount; // Utilisé par Firestore
    private List<String> likedBy = new ArrayList<>(); // Utilisé pour les tests et la logique métier

    public PotholeReport() {}

    // --- GETTERS ET SETTERS ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isAiDetected() { return aiDetected; }
    public void setAiDetected(boolean aiDetected) { this.aiDetected = aiDetected; }

    public double getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(double aiConfidence) { this.aiConfidence = aiConfidence; }

    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }

    // ✅ CORRECTION TEST : Si likedBy n'est pas vide, on retourne sa taille
    public int getLikeCount() {
        return (likedBy != null && !likedBy.isEmpty()) ? likedBy.size() : likeCount;
    }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }

    public List<String> getLikedBy() { return likedBy; }
    public void setLikedBy(List<String> likedBy) { this.likedBy = likedBy; }

    // --- MÉTHODES UTILITAIRES ---

    // ✅ CORRECTION TEST : Retourne "Inconnu" par défaut au lieu de "En attente"
    public String getStatusLabel() {
        if (status == null) return "Inconnu";
        switch (status) {
            case "pending": return "En attente";
            case "confirmed": return "Confirmé";
            case "fixed": return "Réparé";
            default: return "Inconnu";
        }
    }

    public int getAiConfidencePercent() {
        return (int) (aiConfidence * 100);
    }

    public String getFormattedDate() {
        if (timestamp <= 0) return "-";
        return new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(new Date(timestamp));
    }
}