package com.roadwatch.admin.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.roadwatch.admin.model.Comment;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Repository
public class CommentDAO {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    // Récupérer les commentaires d'un signalement avec pagination
    public List<Comment> getCommentsByReportId(String reportId, int limit, int offset)
            throws ExecutionException, InterruptedException {

        ApiFuture<QuerySnapshot> future = getDb()
                .collection("reports")
                .document(reportId)
                .collection("comments")
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .limit(limit)
                .offset(offset)
                .get();

        List<Comment> comments = new ArrayList<>();
        for (QueryDocumentSnapshot doc : future.get().getDocuments()) {
            Comment comment = doc.toObject(Comment.class);
            comment.setId(doc.getId());
            comments.add(comment);
        }
        return comments;
    }

    // Compter le nombre total de commentaires
    public int getCommentsCount(String reportId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getDb()
                .collection("reports")
                .document(reportId)
                .collection("comments")
                .get();
        return future.get().size();
    }

    // Supprimer un commentaire
    public void deleteComment(String reportId, String commentId)
            throws ExecutionException, InterruptedException {
        getDb()
                .collection("reports")
                .document(reportId)
                .collection("comments")
                .document(commentId)
                .delete()
                .get();
    }
}