
self.addEventListener("push", (event) => {
    let data = {};

    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data = {
                title: "FoundIt",
                body: event.data.text()
            };
        }
    }

    event.waitUntil(
        self.registration.showNotification(
            data.title || "FoundIt Notification",
            {
                body: data.body || "You have a new notification.",
                data: {
                    url: data.url || "/notifications/page/"
                }
            }
        )
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(clients.openWindow(url));
});
