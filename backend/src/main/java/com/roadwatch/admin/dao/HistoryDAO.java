package com.roadwatch.admin.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.roadwatch.admin.model.HistoryEntry;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Repository
public class HistoryDAO {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    public void addHistoryEntry(HistoryEntry entry) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getDb().collection("history").document();
        entry.setId(docRef.getId());
        docRef.set(entry).get();
    }

    public List<HistoryEntry> getHistoryByReportId(String reportId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getDb()
                .collection("history")
                .whereEqualTo("reportId", reportId)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();

        List<HistoryEntry> history = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            HistoryEntry entry = doc.toObject(HistoryEntry.class);
            entry.setId(doc.getId());
            history.add(entry);
        }
        return history;
    }
}