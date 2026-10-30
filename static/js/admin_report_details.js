
document.addEventListener("DOMContentLoaded", async () => {
    const loading = document.getElementById("reportLoading");
    const error = document.getElementById("reportError");
    const details = document.getElementById("reportDetails");

    const reportImage = document.getElementById("reportImage");
    const imagePlaceholder = document.getElementById("reportImagePlaceholder");

    function showValue(value) {
        return value === null || value === undefined || value === ""
            ? "Not provided"
            : value;
    }

    function formatDate(value) {
        if (!value) return "Not provided";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    try {
        // Read the report ID from /admin-dashboard/reports/<id>/
        const pathParts = window.location.pathname
            .split("/")
            .filter(Boolean);

        const reportId = pathParts[pathParts.length - 1];

        if (!reportId || !/^\d+$/.test(reportId)) {
            throw new Error("Invalid report ID.");
        }

        // Fetch reports using the existing API.
        const response = await authenticatedFetch("/reports/browse/");

        if (!response || !response.ok) {
            throw new Error(
                `Could not retrieve reports. Status: ${response?.status ?? "unknown"}`
            );
        }

        const reports = await response.json();

        if (!Array.isArray(reports)) {
            throw new Error("Unexpected reports response.");
        }

        const report = reports.find(
            item => String(item.id) === reportId
        );

        if (!report) {
            throw new Error("Report not found.");
        }

        document.getElementById("reportType").textContent =
            report.type || "Unknown";

        document.getElementById("reportType").classList.add(
            report.type === "lost" ? "lost" : "found"
        );

        document.getElementById("reportStatus").textContent =
            showValue(report.status);

        document.getElementById("reportId").textContent =
            `Report #${report.id}`;

        document.getElementById("reportName").textContent =
            showValue(report.item_name);

        document.getElementById("reportDescription").textContent =
            showValue(report.description);

        document.getElementById("reportCategory").textContent =
            showValue(report.category);

        document.getElementById("reportBrand").textContent =
            showValue(report.brand);

        document.getElementById("reportColor").textContent =
            showValue(report.color);

        document.getElementById("reportCondition").textContent =
            showValue(report.condition);

        document.getElementById("reportLocation").textContent =
            showValue(report.location);

        document.getElementById("reportEventDate").textContent =
            formatDate(report.event_date);

        document.getElementById("reportSubmittedBy").textContent =
            showValue(report.submitted_by);

        document.getElementById("reportCreatedAt").textContent =
            formatDate(report.created_at);

        // Display the report image.
        if (report.image_url) {
            reportImage.src = report.image_url;
            reportImage.alt = report.item_name || "Reported item";
            reportImage.hidden = false;
            imagePlaceholder.hidden = true;

            reportImage.addEventListener("error", () => {
                reportImage.hidden = true;
                imagePlaceholder.hidden = false;
            }, { once: true });
        } else {
            reportImage.hidden = true;
            imagePlaceholder.hidden = false;
        }

        // Display tags safely.
        const tagsContainer = document.getElementById("reportTags");
        tagsContainer.replaceChildren();

        if (Array.isArray(report.tags) && report.tags.length > 0) {
            report.tags.forEach(tag => {
                const tagElement = document.createElement("span");
                tagElement.className = "report-tag";
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        } else {
            tagsContainer.textContent = "No tags";
        }

        loading.hidden = true;
        details.hidden = false;

    } catch (err) {
        console.error("Admin report details error:", err);
        loading.hidden = true;
        error.hidden = false;
    }

    // Admin logout.
    const logoutButton = document.getElementById("adminLogoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();

            if (typeof logout === "function") {
                logout();
            }
        });
    }
});
