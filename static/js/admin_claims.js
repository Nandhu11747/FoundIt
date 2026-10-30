
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("claimsTableBody");
    const message = document.getElementById("claimsMessage");
    const searchInput = document.getElementById("claimSearch");
    const statusFilter = document.getElementById("claimStatusFilter");

    const totalClaims = document.getElementById("totalClaims");
    const pendingClaims = document.getElementById("pendingClaims");
    const approvedClaims = document.getElementById("approvedClaims");
    const rejectedClaims = document.getElementById("rejectedClaims");

    const pageSummary = document.getElementById("claimsPageSummary");
    const pageInfo = document.getElementById("claimsPageInfo");
    const prevButton = document.getElementById("claimsPrevPage");
    const nextButton = document.getElementById("claimsNextPage");

    const itemsPerPage = 8;

    let allClaims = [];
    let filteredClaims = [];
    let currentPage = 1;

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

    function updateSummary() {
        totalClaims.textContent = allClaims.length;
        pendingClaims.textContent = allClaims.filter(
            claim => claim.status === "pending"
        ).length;
        approvedClaims.textContent = allClaims.filter(
            claim => claim.status === "approved"
        ).length;
        rejectedClaims.textContent = allClaims.filter(
            claim => claim.status === "rejected"
        ).length;
    }

    async function loadClaims() {
        message.textContent = "Loading claims...";
        tableBody.replaceChildren();

        try {
            const response = await authenticatedFetch("/claims/admin/all/");

            if (!response || !response.ok) {
                throw new Error(
                    `Request failed: ${response?.status ?? "unknown"}`
                );
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("Unexpected claims response.");
            }

            allClaims = data;
            updateSummary();
            applyFilters();

        } catch (error) {
            console.error("Failed to load admin claims:", error);

            message.textContent =
                "Unable to load claims. Check admin access and try again.";

            tableBody.replaceChildren();
            updatePagination(0, 0, 0);
        }
    }

    function applyFilters() {
        const search = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        filteredClaims = allClaims.filter(claim => {
            const matchesStatus =
                selectedStatus === "all" ||
                claim.status === selectedStatus;

            const searchableText = [
                claim.claim_id,
                claim.report_id,
                claim.item_name,
                claim.claimant_name,
                claim.claimant_email,
                claim.category,
                claim.location,
                claim.status
            ].join(" ").toLowerCase();

            return matchesStatus && searchableText.includes(search);
        });

        currentPage = 1;
        renderClaims();
    }

    function renderClaims() {
        tableBody.replaceChildren();

        const total = filteredClaims.length;
        const totalPages = Math.ceil(total / itemsPerPage);

        if (totalPages > 0 && currentPage > totalPages) {
            currentPage = totalPages;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const pageClaims = filteredClaims.slice(
            start,
            start + itemsPerPage
        );

        pageClaims.forEach(claim => {
            const row = document.createElement("tr");

            const idCell = document.createElement("td");
            idCell.className = "claim-id";
            idCell.textContent = `CLM-${claim.claim_id}`;

            const itemCell = document.createElement("td");
            itemCell.className = "claim-item-name";
            itemCell.textContent = claim.item_name || "Unnamed item";

            const claimantCell = document.createElement("td");
            claimantCell.textContent =
                claim.claimant_name || claim.claimant_email || "Unknown user";

            const categoryCell = document.createElement("td");
            categoryCell.textContent = claim.category || "Not specified";

            const locationCell = document.createElement("td");
            locationCell.textContent = claim.location || "Not specified";

            const dateCell = document.createElement("td");
            dateCell.textContent = formatDate(claim.created_at);

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");
            const normalizedStatus = String(
                claim.status || "unknown"
            ).toLowerCase();

            statusBadge.className =
                `claim-status-badge ${
                    ["pending", "approved", "rejected"].includes(normalizedStatus)
                        ? normalizedStatus
                        : "unknown"
                }`;

            statusBadge.textContent = claim.status || "Unknown";
            statusCell.appendChild(statusBadge);

            const actionCell = document.createElement("td");
            const viewButton = document.createElement("button");

            viewButton.type = "button";
            viewButton.className = "claim-view-btn";
            viewButton.textContent = "View";

            viewButton.addEventListener("click", () => {
                window.location.href =
                    `/claims/admin/page/${claim.claim_id}/`;
            });

            actionCell.appendChild(viewButton);

            row.append(
                idCell,
                itemCell,
                claimantCell,
                categoryCell,
                locationCell,
                dateCell,
                statusCell,
                actionCell
            );

            tableBody.appendChild(row);
        });

        message.textContent = total === 0 ? "No claims found." : "";

        updatePagination(total, totalPages, pageClaims.length);
    }

    function updatePagination(total, totalPages, visibleCount) {
        const start = total === 0
            ? 0
            : (currentPage - 1) * itemsPerPage + 1;

        const end = total === 0
            ? 0
            : start + visibleCount - 1;

        pageSummary.textContent =
            `Showing ${start}-${end} of ${total} claims`;

        pageInfo.textContent = totalPages === 0
            ? "Page 0 of 0"
            : `Page ${currentPage} of ${totalPages}`;

        prevButton.disabled = currentPage <= 1;
        nextButton.disabled =
            totalPages === 0 || currentPage >= totalPages;
    }

    searchInput.addEventListener("input", applyFilters);
    statusFilter.addEventListener("change", applyFilters);

    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderClaims();
        }
    });

    nextButton.addEventListener("click", () => {
        const totalPages = Math.ceil(
            filteredClaims.length / itemsPerPage
        );

        if (currentPage < totalPages) {
            currentPage++;
            renderClaims();
        }
    });

    document.getElementById("refreshClaimsBtn")
        .addEventListener("click", loadClaims);

    const logoutButton = document.getElementById("adminLogoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();

            if (typeof logout === "function") {
                logout();
            }
        });
    }

    loadClaims();
});
