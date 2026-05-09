package com.roadwatch.admin.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.roadwatch.admin.dao.FirebaseAuthDAO;
import com.roadwatch.admin.dao.ReportDAO;
import com.roadwatch.admin.model.PotholeReport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
@DisplayName("Tests unitaires - UserController")
class UserControllerTest {

    @Mock
    private FirebaseAuthDAO firebaseAuthDAO;

    @Mock
    private ReportDAO reportDAO;

    @InjectMocks
    private UserController userController;

    private UserRecord mockUser;

    @BeforeEach
    void setUp() throws Exception {
        mockUser = mock(UserRecord.class, RETURNS_DEEP_STUBS);

        when(mockUser.getUid()).thenReturn("uid-123");
        when(mockUser.getEmail()).thenReturn("user@test.com");
        when(mockUser.getDisplayName()).thenReturn("Test User");
        when(mockUser.getPhotoUrl()).thenReturn(null);
        when(mockUser.getPhoneNumber()).thenReturn(null);
        when(mockUser.isDisabled()).thenReturn(false);
        when(mockUser.isEmailVerified()).thenReturn(true);
        when(mockUser.getUserMetadata().getCreationTimestamp()).thenReturn(1700000000000L);
        when(mockUser.getUserMetadata().getLastSignInTimestamp()).thenReturn(1710000000000L);
    }

    // ─────────────────────────────────────────────
    // getUserStats
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getUserStats : doit retourner total, actifs, desactives, totalSignalements")
    void getUserStats_shouldReturnCorrectStats()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        UserRecord disabledUser = mock(UserRecord.class, RETURNS_DEEP_STUBS);
        when(disabledUser.getUid()).thenReturn("uid-456");
        when(disabledUser.isDisabled()).thenReturn(true);

        when(firebaseAuthDAO.getAllUsers()).thenReturn(List.of(mockUser, disabledUser));
        when(reportDAO.getReportsCountByUserId("uid-123")).thenReturn(3);
        when(reportDAO.getReportsCountByUserId("uid-456")).thenReturn(1);

        ResponseEntity<?> response = userController.getUserStats();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(2L, body.get("total"));
        assertEquals(1L, body.get("actifs"));
        assertEquals(1L, body.get("desactives"));
        assertEquals(4L, body.get("totalSignalements"));
    }

    @Test
    @DisplayName("getUserStats : liste vide → tout à zéro")
    void getUserStats_emptyList_shouldReturnZeros()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        when(firebaseAuthDAO.getAllUsers()).thenReturn(Collections.emptyList());

        ResponseEntity<?> response = userController.getUserStats();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(0L, body.get("total"));
        assertEquals(0L, body.get("actifs"));
        assertEquals(0L, body.get("desactives"));
    }

    @Test
    @DisplayName("getUserStats : erreur DAO → 500")
    void getUserStats_whenDaoThrows_shouldReturn500()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        when(firebaseAuthDAO.getAllUsers()).thenThrow(new RuntimeException("Firebase down"));

        ResponseEntity<?> response = userController.getUserStats();

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.containsKey("error"));
    }

    // ─────────────────────────────────────────────
    // getUserDetails
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getUserDetails : UID valide → 200 avec infos et signalements")
    void getUserDetails_validUid_shouldReturn200()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        PotholeReport report = new PotholeReport();
        report.setId("r-1");

        when(firebaseAuthDAO.getUserByUid("uid-123")).thenReturn(mockUser);
        when(reportDAO.getReportsByUserId("uid-123")).thenReturn(List.of(report));

        ResponseEntity<?> response = userController.getUserDetails("uid-123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("uid-123", body.get("uid"));
        assertEquals("user@test.com", body.get("email"));
        assertEquals(1, body.get("reportCount"));
    }

    @Test
    @DisplayName("getUserDetails : erreur DAO → 500")
    void getUserDetails_whenDaoThrows_shouldReturn500()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        when(firebaseAuthDAO.getUserByUid(any())).thenThrow(new RuntimeException("Not found"));

        ResponseEntity<?> response = userController.getUserDetails("bad-uid");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ─────────────────────────────────────────────
    // disableUser
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("disableUser : UID valide → 200 avec disabled=true")
    void disableUser_validUid_shouldReturn200()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        doNothing().when(firebaseAuthDAO).disableUser("uid-123");

        ResponseEntity<?> response = userController.disableUser("uid-123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(true, body.get("disabled"));
        verify(firebaseAuthDAO).disableUser("uid-123");
    }

    @Test
    @DisplayName("disableUser : erreur DAO → 500")
    void disableUser_whenDaoThrows_shouldReturn500()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        doThrow(new RuntimeException("Error")).when(firebaseAuthDAO).disableUser(any());

        ResponseEntity<?> response = userController.disableUser("uid-123");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ─────────────────────────────────────────────
    // enableUser
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("enableUser : UID valide → 200 avec disabled=false")
    void enableUser_validUid_shouldReturn200()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        doNothing().when(firebaseAuthDAO).enableUser("uid-123");

        ResponseEntity<?> response = userController.enableUser("uid-123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(false, body.get("disabled"));
        verify(firebaseAuthDAO).enableUser("uid-123");
    }

    @Test
    @DisplayName("enableUser : erreur DAO → 500")
    void enableUser_whenDaoThrows_shouldReturn500()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        doThrow(new RuntimeException("Error")).when(firebaseAuthDAO).enableUser(any());

        ResponseEntity<?> response = userController.enableUser("uid-123");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    // ─────────────────────────────────────────────
    // deleteUser
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("deleteUser : UID valide → 200")
    void deleteUser_validUid_shouldReturn200()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        doNothing().when(firebaseAuthDAO).deleteUser("uid-123");

        ResponseEntity<?> response = userController.deleteUser("uid-123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(true, body.get("success"));
        verify(firebaseAuthDAO).deleteUser("uid-123");
    }

    @Test
    @DisplayName("deleteUser : erreur DAO → 500")
    void deleteUser_whenDaoThrows_shouldReturn500()
            throws ExecutionException, InterruptedException, FirebaseAuthException {
        doThrow(new RuntimeException("Error")).when(firebaseAuthDAO).deleteUser(any());

        ResponseEntity<?> response = userController.deleteUser("uid-123");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}