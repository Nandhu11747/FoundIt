
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

    let notifications = [];

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
            notifications = Array.isArray(data.notifications)
                ? data.notifications
                : [];

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
});
