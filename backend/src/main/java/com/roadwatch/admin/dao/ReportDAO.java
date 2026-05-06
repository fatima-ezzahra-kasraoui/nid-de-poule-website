package com.roadwatch.admin.dao;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.roadwatch.admin.model.PotholeReport;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;


@Repository
public class ReportDAO {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    public List<PotholeReport> getAllReports() throws ExecutionException, InterruptedException {
        return queryToList(
            getDb().collection("reports")
                   .orderBy("timestamp", Query.Direction.DESCENDING)
                   .get().get()
        );
    }

    public List<PotholeReport> getReportsByStatus(String status)
            throws ExecutionException, InterruptedException {
        return queryToList(
            getDb().collection("reports")
                   .whereEqualTo("status", status)
                   .orderBy("timestamp", Query.Direction.DESCENDING)
                   .get().get()
        );
    }

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

    public void updateStatus(String reportId, String newStatus)
            throws ExecutionException, InterruptedException {
        getDb().collection("reports")
               .document(reportId)
               .update("status", newStatus)
               .get();
    }

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

    public Map<String, Long> countByStatus() throws ExecutionException, InterruptedException {
        List<PotholeReport> all = getAllReports();
        Map<String, Long> counts = new HashMap<>();
        counts.put("pending",   all.stream().filter(r -> "pending".equals(r.getStatus())).count());
        counts.put("confirmed", all.stream().filter(r -> "confirmed".equals(r.getStatus())).count());
        counts.put("fixed",     all.stream().filter(r -> "fixed".equals(r.getStatus())).count());
        counts.put("total",     (long) all.size());
        return counts;
    }

    public double getAvgRepairTimeDays() throws ExecutionException, InterruptedException {
        List<PotholeReport> fixed = getReportsByStatus("fixed");
        if (fixed.isEmpty()) return 0;
        long now = System.currentTimeMillis();
        long totalMs = fixed.stream().mapToLong(r -> now - r.getTimestamp()).sum();
        double avgMs = (double) totalMs / fixed.size();
        return Math.round(avgMs / (1000.0 * 60 * 60 * 24) * 10.0) / 10.0;
    }

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
}
