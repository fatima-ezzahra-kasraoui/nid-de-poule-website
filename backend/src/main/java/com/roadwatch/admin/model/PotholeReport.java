package com.roadwatch.admin.model;

import java.text.SimpleDateFormat;
import java.util.Date;


public class PotholeReport {

    private String id;
    private String userId;
    private String userEmail;
    private String photoUrl;
    private double latitude;
    private double longitude;
    private String address;
    private String status;        // pending | confirmed | fixed
    private boolean aiDetected;
    private float aiConfidence;
    private long timestamp;
    private String description;

    public PotholeReport() {}

    public String getFormattedDate() {
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");
        return sdf.format(new Date(timestamp));
    }

    public String getStatusLabel() {
        switch (status != null ? status : "") {
            case "pending":   return "En attente";
            case "confirmed": return "Confirmé";
            case "fixed":     return "Réparé";
            default:          return "Inconnu";
        }
    }

    public int getAiConfidencePercent() {
        return (int)(aiConfidence * 100);
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isAiDetected() { return aiDetected; }
    public void setAiDetected(boolean aiDetected) { this.aiDetected = aiDetected; }
    public float getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(float aiConfidence) { this.aiConfidence = aiConfidence; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
