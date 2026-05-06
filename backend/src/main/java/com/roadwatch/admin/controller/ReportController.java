package com.roadwatch.admin.controller;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfWriter;
import com.roadwatch.admin.dao.ReportDAO;
import com.roadwatch.admin.model.PotholeReport;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;


@RestController
@RequestMapping("/api")
public class ReportController {

    private final ReportDAO reportDAO;

    // Spring Boot injecte automatiquement le DAO (injection de dépendances)
    public ReportController(ReportDAO reportDAO) {
        this.reportDAO = reportDAO;
    }

    // ─── Dashboard : stats générales ──────────────────────────────────────────
    // Ancien : DashboardServlet.doGet() → met des attributs dans req → dashboard.jsp
    // Nouveau : retourne du JSON → React affiche les chiffres
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        try {
            Map<String, Long> counts = reportDAO.countByStatus();
            double avgRepair = reportDAO.getAvgRepairTimeDays();

            Map<String, Object> response = new HashMap<>();
            response.put("total",     counts.get("total"));
            response.put("pending",   counts.get("pending"));
            response.put("confirmed", counts.get("confirmed"));
            response.put("fixed",     counts.get("fixed"));
            response.put("avgRepair", avgRepair);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── Stats pour graphiques ────────────────────────────────────────────────
    // Ancien : StatsServlet.doGet() → Gson → JSON
    // Nouveau : Spring Boot sérialise automatiquement en JSON (plus de Gson manuel)
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("byMonth",      reportDAO.getReportsByMonth());
            stats.put("byStatus",     reportDAO.countByStatus());
            stats.put("avgRepairDays",reportDAO.getAvgRepairTimeDays());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── Liste des signalements (avec filtres) ────────────────────────────────
    // Ancien : ReportsServlet + MapServlet (deux servlets différents pour la même donnée !)
    // Nouveau : un seul endpoint avec paramètres optionnels
    @GetMapping("/reports")
    public ResponseEntity<List<PotholeReport>> getReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long dateFrom,
            @RequestParam(required = false) Long dateTo) {
        try {
            List<PotholeReport> reports = reportDAO.getReportsFiltered(status, dateFrom, dateTo);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── Mise à jour du statut ────────────────────────────────────────────────
    // Ancien : UpdateStatusServlet.doPost() avec req.getParameter()
    // Nouveau : @PathVariable pour l'ID dans l'URL, @RequestBody pour le JSON
    @PostMapping("/reports/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");

            if (newStatus == null || !newStatus.matches("pending|confirmed|fixed")) {
                return ResponseEntity.badRequest().build();
            }

            reportDAO.updateStatus(id, newStatus);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("status", newStatus);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── Export Excel ─────────────────────────────────────────────────────────
    // Logique identique à l'ancien ExportServlet.exportExcel()
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

    private void exportExcel(HttpServletResponse resp, List<PotholeReport> reports)
            throws IOException {
        resp.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        resp.setHeader("Content-Disposition", "attachment; filename=signalements.xlsx");

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Signalements");

            Row header = sheet.createRow(0);
            CellStyle headerStyle = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            String[] cols = {"ID", "Email", "Adresse", "Latitude", "Longitude",
                             "Statut", "IA Détecté", "Confiance IA", "Date"};
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
                row.createCell(1).setCellValue(r.getUserEmail());
                row.createCell(2).setCellValue(r.getAddress());
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

    private void exportPDF(HttpServletResponse resp, List<PotholeReport> reports)
            throws IOException, DocumentException {
        resp.setContentType("application/pdf");
        resp.setHeader("Content-Disposition", "attachment; filename=signalements.pdf");

        Document doc = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(doc, resp.getOutputStream());
        doc.open();

        com.itextpdf.text.Font titleFont = FontFactory.getFont(
            FontFactory.HELVETICA_BOLD, 16, BaseColor.DARK_GRAY);
        doc.add(new Paragraph("Rapport des signalements — RoadWatch", titleFont));
        doc.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3, 5, 8, 3, 3, 3, 4});

        com.itextpdf.text.Font hFont = FontFactory.getFont(
            FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
        BaseColor headerBg = new BaseColor(25, 118, 210);

        for (String h : new String[]{"ID", "Email", "Adresse", "Statut", "IA", "Confiance", "Date"}) {
            PdfPCell cell = new PdfPCell(new Phrase(h, hFont));
            cell.setBackgroundColor(headerBg);
            cell.setPadding(6);
            table.addCell(cell);
        }

        com.itextpdf.text.Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
        for (PotholeReport r : reports) {
            table.addCell(new PdfPCell(new Phrase(r.getId().substring(0, 8) + "...", rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getUserEmail(), rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getAddress(), rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getStatusLabel(), rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.isAiDetected() ? "✓" : "✗", rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getAiConfidencePercent() + "%", rowFont)));
            table.addCell(new PdfPCell(new Phrase(r.getFormattedDate(), rowFont)));
        }

        doc.add(table);
        doc.close();
    }
}
