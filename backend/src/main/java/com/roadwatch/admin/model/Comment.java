package com.roadwatch.admin.model;

public class Comment {
    private String id;
    private String reportId;
    private String userId;
    private String userEmail;
    private String text;  // ← Renommé de "content" à "text"
    private long timestamp;
    private boolean moderated;

    public Comment() {}

    public Comment(String reportId, String userId, String userEmail, String text) {
        this.reportId = reportId;
        this.userId = userId;
        this.userEmail = userEmail;
        this.text = text;
        this.timestamp = System.currentTimeMillis();
        this.moderated = false;
    }

    // Getters et Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReportId() { return reportId; }
    public void setReportId(String reportId) { this.reportId = reportId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public boolean isModerated() { return moderated; }
    public void setModerated(boolean moderated) { this.moderated = moderated; }
}