
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("reportsTableBody");
    const message = document.getElementById("reportsMessage");
    const searchInput = document.getElementById("reportSearch");
    const globalSearch = document.getElementById("globalSearch");
    const pageSummary = document.getElementById("reportsPageSummary");
    const pageInfo = document.getElementById("reportsPageInfo");
    const prevButton = document.getElementById("reportsPrevPage");
    const nextButton = document.getElementById("reportsNextPage");

    const itemsPerPage = 8;

    let currentType = "all";
    let currentPage = 1;
    let totalPages = 0;
    let totalReports = 0;

    async function loadReports(page = 1) {
        message.textContent = "Loading reports...";
        tableBody.replaceChildren();

        const params = new URLSearchParams({
            page: page,
        });

        const search = searchInput.value.trim();

        if (search) {
            params.set("search", search);
        }

        if (currentType !== "all") {
            params.set("type", currentType);
        }

        try {
            const response = await authenticatedFetch(
                `/reports/admin/all/?${params.toString()}`
            );

            if (!response || !response.ok) {
                throw new Error(
                    `Request failed: ${response?.status ?? "unknown"}`
                );
            }

            const data = await response.json();

            if (!Array.isArray(data.results)) {
                throw new Error("Unexpected reports response.");
            }

            currentPage = page;
            totalReports = data.count;
            totalPages = Math.ceil(totalReports / itemsPerPage);

            renderReports(data.results);

        } catch (error) {
            console.error("Failed to load admin reports:", error);

            message.textContent =
                "Unable to load reports. Check admin access and try again.";

            tableBody.replaceChildren();
            updatePagination(0);
        }
    }

    function renderReports(reports) {
        tableBody.replaceChildren();

        reports.forEach(report => {
            const row = document.createElement("tr");

            const idCell = document.createElement("td");
            idCell.className = "report-id";
            idCell.textContent = `RPT-${report.id}`;

            const itemCell = document.createElement("td");
            itemCell.textContent = report.item_name || "Unnamed item";

            const typeCell = document.createElement("td");
            const typeBadge = document.createElement("span");

            typeBadge.className = `report-type-badge ${
                report.type === "lost" ? "lost" : "found"
            }`;

            typeBadge.textContent = report.type || "Unknown";
            typeCell.appendChild(typeBadge);

            const userCell = document.createElement("td");
            userCell.textContent = report.submitted_by || "Unknown user";

            const locationCell = document.createElement("td");
            locationCell.textContent = report.location || "Not specified";

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className = "report-status-badge";
            statusBadge.textContent = report.status || "Unknown";

            statusCell.appendChild(statusBadge);

            const actionCell = document.createElement("td");
            const actionButton = document.createElement("button");

            actionButton.type = "button";
            actionButton.className = "report-action-btn";
            actionButton.textContent = "View";

            actionButton.addEventListener("click", () => {
                window.location.href =
                    `/admin-dashboard/reports/${report.id}/`;
            });

            actionCell.appendChild(actionButton);

            row.append(
                idCell,
                itemCell,
                typeCell,
                userCell,
                locationCell,
                statusCell,
                actionCell
            );

            tableBody.appendChild(row);
        });

        message.textContent =
            reports.length === 0 ? "No reports found." : "";

        updatePagination(reports.length);
    }

    function updatePagination(visibleCount) {
        const start = totalReports === 0
            ? 0
            : (currentPage - 1) * itemsPerPage + 1;

        const end = start + visibleCount - 1;

        pageSummary.textContent =
            `Showing ${start}-${end} of ${totalReports} reports`;

        pageInfo.textContent =
            totalPages === 0
                ? "Page 0 of 0"
                : `Page ${currentPage} of ${totalPages}`;

        prevButton.disabled = currentPage <= 1;
        nextButton.disabled =
            totalPages === 0 || currentPage >= totalPages;
    }

    document.querySelectorAll(".report-filter").forEach(button => {
        button.addEventListener("click", () => {
            currentType = button.dataset.type;

            document.querySelectorAll(".report-filter").forEach(filter => {
                filter.classList.toggle("active", filter === button);
            });

            loadReports(1);
        });
    });

    searchInput.addEventListener("input", () => {
        loadReports(1);
    });

    if (globalSearch) {
        globalSearch.addEventListener("input", () => {
            searchInput.value = globalSearch.value;
            loadReports(1);
        });
    }

    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            loadReports(currentPage - 1);
        }
    });

    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            loadReports(currentPage + 1);
        }
    });

    document.getElementById("refreshReportsBtn")
        .addEventListener("click", () => loadReports(currentPage));

    const logoutButton = document.getElementById("adminLogoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();

            if (typeof logout === "function") {
                logout();
            }
        });
    }

    loadReports();
});
