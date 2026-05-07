import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

let eventSource = null;
let listeners = [];

function createEventSource() {
    try {
        eventSource = new EventSource("http://localhost:8080/api/notifications/subscribe");

        eventSource.addEventListener("notification", (event) => {
            try {
                const notification = JSON.parse(event.data);
                console.log("📢 Notification reçue:", notification);
                listeners.forEach(listener => listener(notification));
            } catch (e) {
                console.error("Erreur parsing notification:", e);
            }
        });

        eventSource.onopen = () => console.log("✅ Connexion SSE établie");

        eventSource.onerror = () => {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
            setTimeout(() => {
                if (listeners.length > 0) createEventSource();
            }, 5000);
        };
    } catch (e) {
        console.error("Erreur connexion SSE:", e);
    }
}

function subscribeToNotifications(callback) {
    listeners.push(callback);
    if (!eventSource) createEventSource();
    return () => {
        listeners = listeners.filter(l => l !== callback);
        if (listeners.length === 0 && eventSource) {
            eventSource.close();
            eventSource = null;
        }
    };
}

// Clés pour localStorage
const STORAGE_KEY = "roadwatch_notifications";
const UNREAD_KEY = "roadwatch_unread_count";

const Icons = {
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  BellOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  ),
  Close: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Warning: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 19h20L12 2z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Success: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  ),
};

function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les notifications depuis localStorage au démarrage
  useEffect(() => {
    const savedNotifications = localStorage.getItem(STORAGE_KEY);
    const savedUnreadCount = localStorage.getItem(UNREAD_KEY);

    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        // Filtrer uniquement les notifications avec reportId non null
        const valid = parsed.filter(n => n.reportId != null);
        setNotifications(valid);
      } catch (e) {
        console.error("Erreur chargement notifications:", e);
      }
    }

    if (savedUnreadCount) {
      setUnreadCount(parseInt(savedUnreadCount) || 0);
    }
  }, []);

  // Sauvegarder les notifications dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    localStorage.setItem(UNREAD_KEY, unreadCount.toString());
  }, [notifications, unreadCount]);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      console.log("📢 Nouvelle notification:", notification);
      setNotifications(prev => {
        const newNotifications = [notification, ...prev].slice(0, 50);
        return newNotifications;
      });
      setUnreadCount(prev => prev + 1);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/vite.svg"
        });
      } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(UNREAD_KEY);
  };

  const handleNotificationClick = (notification) => {
    console.log("🔔 Notification cliquée:", notification);
    console.log("🔔 reportId:", notification.reportId);

    if (notification.reportId && notification.reportId !== "null" && notification.reportId !== "undefined") {
      console.log("✅ Redirection vers /map avec ID:", notification.reportId);
      navigate("/map", { state: { selectedReportId: notification.reportId } });
    } else {
      console.log("❌ Pas de reportId valide");
      navigate("/map");
    }
    setShowDropdown(false);
  };

  const getNotificationStyle = (type) => {
    switch(type) {
      case "warning": return { borderLeft: "3px solid #f39c12" };
      case "success": return { borderLeft: "3px solid #27ae60" };
      default: return { borderLeft: "3px solid #e67e22" };
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case "warning": return <Icons.Warning />;
      case "success": return <Icons.Success />;
      default: return <Icons.Info />;
    }
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "à l'instant";
    if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)} h`;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) markAsRead();
        }}
        style={{
          background: "rgba(230, 126, 34, 0.15)",
          border: "1px solid rgba(230, 126, 34, 0.3)",
          borderRadius: "40px",
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "500",
          color: "#e67e22",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s ease"
        }}
      >
        <Icons.Bell />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span style={{
            background: "#e53935",
            color: "white",
            fontSize: "11px",
            fontWeight: "bold",
            borderRadius: "12px",
            padding: "2px 8px",
            minWidth: "20px",
            textAlign: "center"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          width: "360px",
          maxHeight: "480px",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          zIndex: 1000,
          overflow: "hidden",
          marginTop: "12px",
          border: "1px solid rgba(0,0,0,0.05)"
        }}>
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #fff8f0 0%, #fff 100%)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ color: "#e67e22" }}>
                <Icons.Bell />
              </div>
              <strong style={{ fontSize: "14px", color: "#e67e22" }}>Notifications en direct</strong>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "11px",
                  color: "#999",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "6px"
                }}
              >
                Tout effacer
              </button>
            )}
          </div>

          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "#999" }}>
                <div style={{ marginBottom: "12px", color: "#ccc" }}>
                  <Icons.BellOff />
                </div>
                <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>Aucune notification</div>
                <div style={{ fontSize: "12px" }}>Les nouveaux signalements apparaîtront ici</div>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={idx}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    ...getNotificationStyle(notif.type)
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: notif.type === "warning" ? "rgba(243, 156, 18, 0.1)" :
                                   notif.type === "success" ? "rgba(39, 174, 96, 0.1)" :
                                   "rgba(230, 126, 34, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: notif.type === "warning" ? "#f39c12" :
                             notif.type === "success" ? "#27ae60" : "#e67e22"
                    }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: "10px", color: "#999" }}>
                        {formatTime(notif.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid #eee",
            fontSize: "10px",
            color: "#b89a7a",
            textAlign: "center",
            background: "#fafafa"
          }}>
            Cliquez sur une notification pour voir le signalement sur la carte
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;