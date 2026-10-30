
document.addEventListener("DOMContentLoaded", () => {

    
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault();
            logout();
        });
    }


    const notificationList = document.getElementById("notificationList");
    const unreadCount = document.getElementById("unreadCount");
    const markAllReadBtn = document.getElementById("markAllReadBtn");
    const clearAllBtn = document.getElementById("clearAllBtn");

    
    const enableBrowserNotificationsBtn = document.getElementById(
        "enableBrowserNotificationsBtn"
    );

    function updateBrowserNotificationButton() {
        if (!("Notification" in window)) {
            enableBrowserNotificationsBtn.textContent =
                "Browser Notifications Not Supported";
            enableBrowserNotificationsBtn.disabled = true;
            return;
        }

        if (Notification.permission === "granted") {
            enableBrowserNotificationsBtn.textContent =
                "✓ Browser Notifications Enabled";
            enableBrowserNotificationsBtn.disabled = true;
        } else if (Notification.permission === "denied") {
            enableBrowserNotificationsBtn.textContent =
                "Notifications Blocked — Check Browser Settings";
            enableBrowserNotificationsBtn.disabled = true;
        } else {
            enableBrowserNotificationsBtn.textContent =
                "🔔 Enable Browser Notifications";
            enableBrowserNotificationsBtn.disabled = false;
        }
    }

    enableBrowserNotificationsBtn.addEventListener("click", async () => {
        if (!("Notification" in window)) {
            alert("Your browser does not support notifications.");
            return;
        }

        try {
            const permission = await Notification.requestPermission();

            updateBrowserNotificationButton();

            if (permission === "granted") {
                new Notification("FoundIt", {
                    body: "Browser notifications are now enabled!"
                });
            } else if (permission === "denied") {
                alert(
                    "Notifications are blocked. Please allow them in your browser's site settings."
                );
            }
        } catch (error) {
            console.error("Notification permission request failed:", error);
            alert("Could not enable browser notifications.");
        }
    });

    updateBrowserNotificationButton();


    let notifications = [];
    let knownNotificationIds = new Set();
    let hasLoadedNotificationsOnce = false;

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function getNotificationIcon(type) {
        const icons = {
            match_found: "⌕",
            claim_submitted: "◷",
            claim_approved: "✓",
            claim_rejected: "×",
            system: "▤"
        };

        return icons[type] || "●";
    }

    function formatTime(value) {
        if (!value) return "";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        const now = new Date();
        const sameDay = date.toDateString() === now.toDateString();

        if (sameDay) {
            return date.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });
        }

        return date.toLocaleDateString([], {
            day: "numeric",
            month: "short",
            year: date.getFullYear() === now.getFullYear()
                ? undefined
                : "numeric"
        });
    }

    function renderNotifications() {
        const unread = notifications.filter(item => !item.is_read).length;
        unreadCount.textContent = unread;

        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    <h3>No notifications yet</h3>
                    <p>Updates about your reports and claims will appear here.</p>
                </div>
            `;
            return;
        }

        notificationList.innerHTML = notifications.map(item => {
            const title = escapeHTML(item.title);
            const message = escapeHTML(item.message);
            const time = escapeHTML(formatTime(item.created_at));
            const icon = escapeHTML(getNotificationIcon(item.notification_type));

            // Only allow links to pages on this FoundIt site.
            const rawUrl = item.related_url || "";
            const safeUrl = rawUrl.startsWith("/") &&
                !rawUrl.startsWith("//") &&
                !rawUrl.includes("\\")
                ? rawUrl
                : "";

            const action = safeUrl
                ? `<a class="primary-action notification-open"
                      href="${escapeHTML(safeUrl)}"
                      data-id="${Number(item.id)}">View Details</a>`
                : "";

            const readAction = item.is_read
                ? ""
                : `<button type="button"
                           class="mark-read-btn"
                           data-id="${Number(item.id)}">Mark as Read</button>`;

            return `
                <article class="notification-card ${item.is_read ? "" : "unread"}">
                    <div class="notification-icon">${icon}</div>

                    <div class="notification-content">
                        <div class="notification-card-top">
                            <h3>${title}</h3>
                            <time class="notification-time">${time}</time>
                        </div>

                        <p class="notification-message">${message}</p>

                        <div class="notification-card-actions">
                            ${action}
                            ${readAction}
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    async function loadNotifications() {
        notificationList.innerHTML =
            '<p class="notification-loading">Loading notifications...</p>';

        try {
            const response = await authenticatedFetch("/notifications/");

            if (!response.ok) {
                throw new Error(`Unable to load notifications (${response.status})`);
            }

            
            const data = await response.json();

            const latestNotifications = Array.isArray(data.notifications)
                ? data.notifications
                : [];

            // First load: record existing notifications without alerting for old ones.
           // if (!hasLoadedNotificationsOnce) {
             //   latestNotifications.forEach(item => {
               //     knownNotificationIds.add(Number(item.id));
                //});

                //hasLoadedNotificationsOnce = true;
            //} 
            if (!hasLoadedNotificationsOnce) {
                latestNotifications.forEach(item => {
                    knownNotificationIds.add(Number(item.id));
                });

                hasLoadedNotificationsOnce = true;
            } else {
                // Keep the rest of your existing else block unchanged.
                // Later loads: notify only about newly created approval/rejection alerts.
                latestNotifications.forEach(item => {
                    const id = Number(item.id);

                    if (!knownNotificationIds.has(id)) {
                        knownNotificationIds.add(id);

                        if (
                            Notification.permission === "granted" &&
                            ["claim_approved", "claim_rejected"].includes(
                                item.notification_type
                            )
                        ) {
                            const browserNotification = new Notification(
                                item.title || "FoundIt Update",
                                {
                                    body: item.message || "Your claim status has changed.",
                                    tag: `foundit-notification-${id}`
                                }
                            );

                            browserNotification.onclick = () => {
                                window.focus();

                                const url = item.related_url || "/claims/page/my/";

                                if (url.startsWith("/") &&
                                    !url.startsWith("//") &&
                                    !url.includes("\\")) {
                                    window.location.href = url;
                                }

                                browserNotification.close();
                            };
                        }
                    }
                });
            }

            notifications = latestNotifications;
            renderNotifications();

        } catch (error) {
            console.error("Notification loading failed:", error);
            notificationList.innerHTML = `
                <p class="notification-error">
                    Could not load notifications. Please refresh the page and try again.
                </p>
            `;
        }
    }

    async function markAsRead(id) {
        try {
            const response = await authenticatedFetch(
                `/notifications/${id}/read/`,
                { method: "POST" }
            );

            if (!response.ok) {
                throw new Error(`Unable to mark notification as read (${response.status})`);
            }

            const notification = notifications.find(item => item.id === id);
            if (notification) {
                notification.is_read = true;
            }

            renderNotifications();
        } catch (error) {
            console.error(error);
            alert("Could not mark this notification as read. Please try again.");
        }
    }

    notificationList.addEventListener("click", async event => {
        const button = event.target.closest(".mark-read-btn");

        if (button) {
            const id = Number(button.dataset.id);
            if (Number.isInteger(id) && id > 0) {
                await markAsRead(id);
            }
        }
    });

    markAllReadBtn.addEventListener("click", async () => {
        markAllReadBtn.disabled = true;

        try {
            const response = await authenticatedFetch(
                "/notifications/read-all/",
                { method: "POST" }
            );

            if (!response.ok) {
                throw new Error(`Unable to mark all notifications as read (${response.status})`);
            }

            notifications.forEach(item => {
                item.is_read = true;
            });

            renderNotifications();
        } catch (error) {
            console.error(error);
            alert("Could not mark all notifications as read. Please try again.");
        } finally {
            markAllReadBtn.disabled = false;
        }
    });

    // Clear All will be connected after we add a secure backend endpoint.
    clearAllBtn.addEventListener("click", () => {
        alert("Clear All will be enabled after we add the delete endpoint.");
    });

    loadNotifications();

    setInterval(loadNotifications, 10000);
});


function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);

    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = atob(base64);

    return Uint8Array.from(
        [...rawData].map(char => char.charCodeAt(0))
    );
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration =
                await navigator.serviceWorker.register(
                    "/service-worker.js"
                );

            console.log(
                "Service worker registered:",
                registration.scope
            );

            if (Notification.permission !== "granted") {
                console.log(
                    "Enable browser notifications before subscribing."
                );
                return;
            }

            const publicKey = window.VAPID_PUBLIC_KEY;

            if (!publicKey) {
                console.error("VAPID public key is missing.");
                return;
            }

            let subscription =
                await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription =
                    await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey:
                            urlBase64ToUint8Array(publicKey)
                    });
            }

            const response = await authenticatedFetch(
                "/auth/push/subscribe/",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        subscription: subscription.toJSON()
                    })
                }
            );

            if (response && response.ok) {
                console.log("Push subscription saved successfully.");
            } else {
                console.error(
                    "Failed to save push subscription:",
                    response?.status
                );
            }
        } catch (error) {
            console.error(
                "Push subscription setup failed:",
                error
            );
        }
    });
}
