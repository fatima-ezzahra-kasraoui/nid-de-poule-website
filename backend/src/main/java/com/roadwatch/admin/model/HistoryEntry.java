package com.roadwatch.admin.model;

import java.util.Date;

public class HistoryEntry {
    private String id;
    private String reportId;
    private String action; // "STATUS_CHANGE", "ASSIGNMENT", "COMMENT"
    private String oldValue;
    private String newValue;
    private String userEmail;
    private Date timestamp;

    // Constructeurs
    public HistoryEntry() {}

    public HistoryEntry(String reportId, String action, String oldValue, String newValue, String userEmail) {
        this.reportId = reportId;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.userEmail = userEmail;
        this.timestamp = new Date();
    }

    // Getters et Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReportId() { return reportId; }
    public void setReportId(String reportId) { this.reportId = reportId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Date getTimestamp() { return timestamp; }
    public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }
}