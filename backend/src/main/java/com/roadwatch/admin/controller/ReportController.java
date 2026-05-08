package com.roadwatch.admin.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.roadwatch.admin.dao.CommentDAO;
import com.roadwatch.admin.dao.HistoryDAO;
import com.roadwatch.admin.dao.ReportDAO;
import com.roadwatch.admin.model.Comment;
import com.roadwatch.admin.model.HistoryEntry;
import com.roadwatch.admin.model.PotholeReport;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ReportController {

    private final ReportDAO reportDAO;

    @Autowired
    private NotificationController notificationController;

    @Autowired
    private HistoryDAO historyDAO;

    @Autowired
    private CommentDAO commentDAO;

    public ReportController(ReportDAO reportDAO) {
        this.reportDAO = reportDAO;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        try {
            Map<String, Long> counts = reportDAO.countByStatus();
            double avgRepair = reportDAO.getAvgRepairTimeDays();

            List<PotholeReport> allReports = reportDAO.getAllReports();
            List<Map<String, Object>> recentReports = new ArrayList<>();
            for (int i = 0; i < Math.min(5, allReports.size()); i++) {
                PotholeReport r = allReports.get(i);
                Map<String, Object> recent = new HashMap<>();
                recent.put("id", r.getId());
                recent.put("address", r.getAddress());
                recent.put("timestamp", r.getTimestamp());
                recent.put("status", r.getStatus());
                recentReports.add(recent);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("total", counts.get("total"));
            response.put("pending", counts.get("pending"));
            response.put("confirmed", counts.get("confirmed"));
            response.put("fixed", counts.get("fixed"));
            response.put("avgRepair", avgRepair);
            response.put("recentReports", recentReports);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("byMonth", reportDAO.getReportsByMonth());
            stats.put("byStatus", reportDAO.countByStatus());
            stats.put("avgRepairDays", reportDAO.getAvgRepairTimeDays());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<List<PotholeReport>> getReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long dateFrom,
            @RequestParam(required = false) Long dateTo) {
        try {
            List<PotholeReport> reports = reportDAO.getReportsFiltered(status, dateFrom, dateTo);
            for (PotholeReport report : reports) {
                int commentCount = commentDAO.getCommentsCount(report.getId());
                report.setCommentCount(commentCount);
            }
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reports/{id}/history")
    public ResponseEntity<?> getReportHistory(@PathVariable String id) {
        try {
            List<HistoryEntry> history = historyDAO.getHistoryByReportId(id);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<?> getReportById(@PathVariable String id) {
        try {
            PotholeReport report = reportDAO.getReportById(id);
            if (report == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Signalement non trouvé"));
            }
            int commentCount = commentDAO.getCommentsCount(id);
            report.setCommentCount(commentCount);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reports/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");
            if (newStatus == null || !newStatus.matches("pending|confirmed|fixed")) {
                return ResponseEntity.badRequest().build();
            }

            PotholeReport report = reportDAO.getReportById(id);
            String oldStatus = report.getStatus();
            reportDAO.updateStatus(id, newStatus);

            historyDAO.addHistoryEntry(new HistoryEntry(id, "STATUS_CHANGE", oldStatus, newStatus, "admin@roadwatch.com"));

            if ("fixed".equals(newStatus)) {
                notificationController.sendNotification("Signalement résolu", "Un nid-de-poule a été marqué comme réparé", "success", id);
            }

            return ResponseEntity.ok(Map.of("success", true, "status", newStatus));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/reports")
    public ResponseEntity<Map<String, Object>> createReport(@RequestBody PotholeReport report) {
        try {
            String id = java.util.UUID.randomUUID().toString();
            report.setId(id);
            reportDAO.saveReport(report);

            String address = report.getAddress() != null ? report.getAddress() : "emplacement inconnu";
            notificationController.sendNotification("Nouveau signalement", "Nid-de-poule signalé à " + address, "info", id);

            return ResponseEntity.ok(Map.of("success", true, "id", id));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/reports/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable String id) {
        try {
            List<PotholeReport> all = reportDAO.getAllReports();
            boolean exists = all.stream().anyMatch(r -> r.getId().equals(id));
            if (!exists) {
                return ResponseEntity.status(404).body(Map.of("error", "Signalement non trouvé"));
            }
            reportDAO.deleteReport(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Signalement supprimé"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/export")
    public void export(
            @RequestParam(defaultValue = "excel") String format,
            @RequestParam(required = false) String status,
            HttpServletResponse response) throws IOException {
        try {
            List<PotholeReport> reports = (status != null && !status.equals("all"))
                    ? reportDAO.getReportsByStatus(status)
                    : reportDAO.getAllReports();

            if ("pdf".equals(format)) {
                exportPDF(response, reports);
            } else {
                exportExcel(response, reports);
            }
        } catch (Exception e) {
            response.sendError(500, "Erreur export : " + e.getMessage());
        }
    }

    private void exportExcel(HttpServletResponse resp, List<PotholeReport> reports) throws IOException {
        resp.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        resp.setHeader("Content-Disposition", "attachment; filename=signalements.xlsx");

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Signalements");
            Row header = sheet.createRow(0);
            CellStyle headerStyle = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            String[] cols = {"ID", "Email", "Adresse", "Latitude", "Longitude", "Statut", "IA Détecté", "Confiance IA", "Date"};
            for (int i = 0; i < cols.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowNum = 1;
            for (PotholeReport r : reports) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(r.getId());
                row.createCell(1).setCellValue(r.getUserEmail() != null ? r.getUserEmail() : "");
                row.createCell(2).setCellValue(r.getAddress() != null ? r.getAddress() : "");
                row.createCell(3).setCellValue(r.getLatitude());
                row.createCell(4).setCellValue(r.getLongitude());
                row.createCell(5).setCellValue(r.getStatusLabel());
                row.createCell(6).setCellValue(r.isAiDetected() ? "Oui" : "Non");
                row.createCell(7).setCellValue(r.getAiConfidencePercent() + "%");
                row.createCell(8).setCellValue(r.getFormattedDate());
            }
            wb.write(resp.getOutputStream());
        }
    }

    private void exportPDF(HttpServletResponse resp, List<PotholeReport> reports) throws IOException, DocumentException {
        resp.setContentType("application/pdf");
        resp.setHeader("Content-Disposition", "attachment; filename=signalements.pdf");

        Document doc = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(doc, resp.getOutputStream());
        doc.open();

        com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.DARK_GRAY);
        doc.add(new Paragraph("Rapport des signalements — RoadWatch", titleFont));
        doc.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3, 5, 8, 3, 3, 3, 4});

        com.itextpdf.text.Font hFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
        BaseColor headerBg = new BaseColor(25, 118, 210);

        for (String h : new String[]{"ID", "Email", "Adresse", "Statut", "IA", "Confiance", "Date"}) {
            PdfPCell cell = new PdfPCell(new Phrase(h, hFont));
            cell.setBackgroundColor(headerBg);
            cell.setPadding(6);
            table.addCell(cell);
        }

        com.itextpdf.text.Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
        for (PotholeReport r : reports) {
            String idShort = r.getId().length() > 8 ? r.getId().substring(0, 8) + "..." : r.getId();
            table.addCell(new PdfPCell(new Phrase(idShort, rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getUserEmail() != null ? r.getUserEmail() : "-", rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getAddress() != null ? r.getAddress() : "-", rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getStatusLabel(), rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.isAiDetected() ? "✓" : "✗", rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getAiConfidencePercent() + "%", rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getFormattedDate(), rowFont)));
        }

        doc.add(table);
        doc.close();
    }

    @GetMapping("/reports/{id}/comments")
    public ResponseEntity<?> getComments(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            int offset = page * limit;
            List<Comment> comments = commentDAO.getCommentsByReportId(id, limit, offset);
            int total = commentDAO.getCommentsCount(id);

            return ResponseEntity.ok(Map.of(
                    "comments", comments,
                    "total", total,
                    "page", page,
                    "limit", limit,
                    "totalPages", (int) Math.ceil((double) total / limit)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/reports/{reportId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable String reportId, @PathVariable String commentId) {
        try {
            commentDAO.deleteComment(reportId, commentId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports/{id}/likes")
    public ResponseEntity<?> getLikes(@PathVariable String id) {
        try {
            List<String> likedBy = reportDAO.getLikedByRaw(id);
            return ResponseEntity.ok(Map.of("likeCount", likedBy.size(), "likedBy", likedBy));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports/{id}/likes/paginated")
    public ResponseEntity<?> getLikesPaginated(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            List<String> allUserIds = reportDAO.getLikedByRaw(id);

            int total = allUserIds.size();
            int start = page * limit;
            int end = Math.min(start + limit, total);
            List<String> paginated = start < total ? allUserIds.subList(start, end) : new ArrayList<>();

            com.google.cloud.firestore.Firestore firestore =
                    com.google.firebase.cloud.FirestoreClient.getFirestore();

            List<Map<String, Object>> likesWithInfo = new ArrayList<>();
            for (String userId : paginated) {
                Map<String, Object> likeInfo = new HashMap<>();
                likeInfo.put("userId", userId);
                try {
                    UserRecord userRecord = FirebaseAuth.getInstance().getUser(userId);
                    String email = userRecord.getEmail() != null ? userRecord.getEmail() : "—";
                    String displayName = userRecord.getDisplayName() != null ? userRecord.getDisplayName() : "";

                    com.google.cloud.firestore.DocumentSnapshot doc =
                            firestore.collection("users").document(userId).get().get();
                    if (doc.exists()) {
                        String firestoreName = doc.getString("displayName");
                        if (firestoreName != null && !firestoreName.isEmpty()) {
                            displayName = firestoreName;
                        }
                    }

                    likeInfo.put("userEmail", email);
                    likeInfo.put("displayName", displayName);
                } catch (Exception e) {
                    likeInfo.put("userEmail", "Inconnu");
                    likeInfo.put("displayName", "");
                }
                likesWithInfo.add(likeInfo);
            }

            return ResponseEntity.ok(Map.of(
                    "likes", likesWithInfo,
                    "total", total,
                    "page", page,
                    "limit", limit,
                    "totalPages", (int) Math.ceil((double) total / limit)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}