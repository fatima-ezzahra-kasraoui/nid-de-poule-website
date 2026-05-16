package com.roadwatch.admin.listener;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.roadwatch.admin.controller.NotificationController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import javax.annotation.PostConstruct;
import org.springframework.context.annotation.Profile;

@Component
public class ReportListener {

    @Autowired
    private NotificationController notificationController;

    private boolean firstSnapshot = true;

    @PostConstruct
    public void listenToNewReports() {
        Firestore db = FirestoreClient.getFirestore();

        db.collection("reports")
                .addSnapshotListener((snapshots, e) -> {
                    if (e != null || snapshots == null) return;

                    if (firstSnapshot) {
                        firstSnapshot = false;
                        return;
                    }

                    for (DocumentChange change : snapshots.getDocumentChanges()) {
                        if (change.getType() == DocumentChange.Type.ADDED) {
                            String address = change.getDocument().getString("address");
                            if (address == null) address = "emplacement inconnu";
                            String reportId = change.getDocument().getId();
                            notificationController.sendNotification(
                                    "Nouveau signalement",
                                    "Signalement ajouté à " + address,
                                    "info",
                                    reportId
                            );
                        }
                    }
                });
    }
}