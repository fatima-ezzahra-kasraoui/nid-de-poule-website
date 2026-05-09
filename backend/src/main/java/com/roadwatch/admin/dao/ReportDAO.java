package com.roadwatch.admin.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.roadwatch.admin.model.PotholeReport;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;

import static com.google.firebase.cloud.FirestoreClient.getFirestore;

@Repository
public class ReportDAO {

    private Firestore getDb() {
        return getFirestore();
    }

    // Récupérer tous les signalements
    public List<PotholeReport> getAllReports() throws ExecutionException, InterruptedException {
        return queryToList(
                getDb().collection("reports")
                        .orderBy("timestamp", Query.Direction.DESCENDING)
                        .get().get()
        );
    }

    // Récupérer les signalements par statut
    public List<PotholeReport> getReportsByStatus(String status)
            throws ExecutionException, InterruptedException {
        return queryToList(
                getDb().collection("reports")
                        .whereEqualTo("status", status)
                        .orderBy("timestamp", Query.Direction.DESCENDING)
                        .get().get()
        );
    }

    // Récupérer les signalements avec filtres
    public List<PotholeReport> getReportsFiltered(String status, Long from, Long to)
            throws ExecutionException, InterruptedException {

        CollectionReference col = getDb().collection("reports");
        Query query = col.orderBy("timestamp", Query.Direction.DESCENDING);

        if (status != null && !status.isEmpty() && !status.equals("all")) {
            query = col.whereEqualTo("status", status)
                    .orderBy("timestamp", Query.Direction.DESCENDING);
        }
        if (from != null) query = query.whereGreaterThanOrEqualTo("timestamp", from);
        if (to   != null) query = query.whereLessThanOrEqualTo("timestamp", to);

        return queryToList(query.get().get());
    }

    // Mettre à jour le statut d'un signalement
    public void updateStatus(String reportId, String newStatus)
            throws ExecutionException, InterruptedException {
        getDb().collection("reports")
                .document(reportId)
                .update("status", newStatus)
                .get();
    }

    // Supprimer un signalement
    public void deleteReport(String reportId) throws ExecutionException, InterruptedException {
        getDb().collection("reports")
                .document(reportId)
                .delete()
                .get();
    }

    // Statistiques : signalements par mois
    public Map<String, Integer> getReportsByMonth() throws ExecutionException, InterruptedException {
        List<PotholeReport> all = getAllReports();
        Map<String, Integer> byMonth = new LinkedHashMap<>();

        Calendar cal = Calendar.getInstance();
        for (int i = 5; i >= 0; i--) {
            cal.setTime(new Date());
            cal.add(Calendar.MONTH, -i);
            String key = String.format("%02d/%d",
                    cal.get(Calendar.MONTH) + 1, cal.get(Calendar.YEAR));
            byMonth.put(key, 0);
        }

        for (PotholeReport r : all) {
            cal.setTimeInMillis(r.getTimestamp());
            String key = String.format("%02d/%d",
                    cal.get(Calendar.MONTH) + 1, cal.get(Calendar.YEAR));
            byMonth.merge(key, 1, Integer::sum);
        }
        return byMonth;
    }

    // Statistiques : comptage par statut
    public Map<String, Long> countByStatus() throws ExecutionException, InterruptedException {
        List<PotholeReport> all = getAllReports();
        Map<String, Long> counts = new HashMap<>();
        counts.put("pending",   all.stream().filter(r -> "pending".equals(r.getStatus())).count());
        counts.put("confirmed", all.stream().filter(r -> "confirmed".equals(r.getStatus())).count());
        counts.put("fixed",     all.stream().filter(r -> "fixed".equals(r.getStatus())).count());
        counts.put("total",     (long) all.size());
        return counts;
    }

    // Temps moyen de réparation
    public double getAvgRepairTimeDays() throws ExecutionException, InterruptedException {
        List<PotholeReport> fixed = getReportsByStatus("fixed");
        if (fixed.isEmpty()) return 0;
        long now = System.currentTimeMillis();
        long totalMs = fixed.stream().mapToLong(r -> now - r.getTimestamp()).sum();
        double avgMs = (double) totalMs / fixed.size();
        return Math.round(avgMs / (1000.0 * 60 * 60 * 24) * 10.0) / 10.0;
    }

    // ========== MÉTHODES POUR LES UTILISATEURS (CORRIGÉES) ==========

    // Compter les signalements par utilisateur (userId = uid du Firebase Auth)
    public int getReportsCountByUserId(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getFirestore()
                .collection("reports")
                .whereEqualTo("userId", userId)
                .get();
        return future.get().size();
    }

    // Récupérer les signalements par utilisateur
    public List<PotholeReport> getReportsByUserId(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getFirestore()
                .collection("reports")
                .whereEqualTo("userId", userId)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();

        List<PotholeReport> reports = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            PotholeReport report = doc.toObject(PotholeReport.class);
            if (report != null) {
                report.setId(doc.getId());
                reports.add(report);
            }
        }
        return reports;
    }

    // Récupérer les signalements par email utilisateur (si userId n'est pas stocké)
    public List<PotholeReport> getReportsByUserEmail(String email) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getFirestore()
                .collection("reports")
                .whereEqualTo("userEmail", email)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();

        List<PotholeReport> reports = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            PotholeReport report = doc.toObject(PotholeReport.class);
            if (report != null) {
                report.setId(doc.getId());
                reports.add(report);
            }
        }
        return reports;
    }

    // ========== MÉTHODE UTILITAIRE ==========

    private List<PotholeReport> queryToList(QuerySnapshot snapshot) {
        List<PotholeReport> list = new ArrayList<>();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            PotholeReport r = doc.toObject(PotholeReport.class);
            if (r != null) {
                r.setId(doc.getId());
                list.add(r);
            }
        }
        return list;
    }

    public String saveReport(PotholeReport report) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getDb().collection("reports").document();
        // Si l'ID est déjà défini, utilise-le, sinon génère-en un
        String id = report.getId();
        if (id == null || id.isEmpty()) {
            id = docRef.getId();
            report.setId(id);
        }
        docRef.set(report).get();
        System.out.println("📝 Sauvegarde avec ID: " + id);
        return id;
    }

    // Récupérer un signalement par ID
    public PotholeReport getReportById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getDb().collection("reports").document(id);
        DocumentSnapshot doc = docRef.get().get();
        if (doc.exists()) {
            PotholeReport report = doc.toObject(PotholeReport.class);
            report.setId(doc.getId());
            return report;
        }
        return null;
    }

    // Mettre à jour un signalement complet
    public void updateReport(PotholeReport report) throws ExecutionException, InterruptedException {
        getDb().collection("reports")
                .document(report.getId())
                .set(report)
                .get();
    }
    public List<String> getLikedByRaw(String reportId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = getDb().collection("reports").document(reportId).get().get();
        if (!doc.exists()) return new ArrayList<>();
        List<String> likedBy = (List<String>) doc.get("likedBy");
        return likedBy != null ? likedBy : new ArrayList<>();
    }
}