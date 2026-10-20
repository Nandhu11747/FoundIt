
document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("adminLogoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault();
            logout();
        });
    }

    const tableBody = document.getElementById("usersTableBody");
    const userCount = document.getElementById("userCount");
    const searchInput = document.getElementById("userSearch");
    const topbarSearch = document.getElementById("topbarSearch");
    const statusFilter = document.getElementById("statusFilter");
    const refreshButton = document.getElementById("refreshUsersBtn");
    const errorBox = document.getElementById("usersError");

    let users = [];

    function getAccessToken() {
        return localStorage.getItem("access_token");
    }

    function showError(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
    }

    function formatDate(dateValue) {
        if (!dateValue) return "—";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getStatus(user) {
        const status = String(user.status || "").toLowerCase();

        if (status === "active") {
            return { label: "Active", className: "active" };
        }

        if (["restricted", "disabled", "inactive", "blocked"].includes(status)) {
            return { label: "Restricted", className: "restricted" };
        }

        return { label: user.status || "Unknown", className: "unknown" };
    }

    
    async function changeUserStatus(user) {
        if (user.is_superuser) {
            alert("Admin accounts cannot be restricted here.");
            return;
        }

        const currentlyActive = user.status === "active";
        const newStatus = currentlyActive ? "restricted" : "active";

        const action = currentlyActive ? "restrict" : "restore";

        const confirmed = confirm(
            `Are you sure you want to ${action} ${user.full_name || user.email}?`
        );

        if (!confirmed) return;

        const token = getAccessToken();

        try {
            const response = await fetch(
                `/auth/admin/users/${user.id}/status/`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to update user status.");
            }

            user.status = data.status;
            renderUsers();

            alert(data.message);

        } catch (error) {
            alert(error.message || "Something went wrong.");
        }
    }


    function renderUsers() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        const filteredUsers = users.filter(user => {
            const matchesSearch = [
                user.full_name,
                user.email,
                user.phone
            ].some(value =>
                String(value || "").toLowerCase().includes(searchTerm)
            );

            const normalizedStatus = String(user.status || "").toLowerCase();

            const matchesStatus =
                selectedStatus === "all" ||
                (selectedStatus === "active" && normalizedStatus === "active") ||
                (
                    selectedStatus === "restricted" &&
                    ["restricted", "disabled", "inactive", "blocked"].includes(normalizedStatus)
                );

            return matchesSearch && matchesStatus;
        });

        tableBody.replaceChildren();

        userCount.textContent =
            `${filteredUsers.length} user${filteredUsers.length === 1 ? "" : "s"}`;

        if (filteredUsers.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.className = "table-message";
            cell.textContent = users.length
                ? "No users match your search."
                : "No users found.";

            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        filteredUsers.forEach(user => {
            const row = document.createElement("tr");
            const status = getStatus(user);

            const values = [
                {
                    text: user.full_name || "Unnamed user",
                    className: "user-name"
                },
                {
                    text: user.email || "—",
                    className: "user-email"
                },
                {
                    text: String(user.reports_count ?? 0)
                },
                {
                    text: String(user.claims_count ?? 0)
                },
                {
                    text: formatDate(user.created_at)
                }
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value.text;

                if (value.className) {
                    cell.className = value.className;
                }

                row.appendChild(cell);
            });

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className = `user-status ${status.className}`;
            statusBadge.textContent = status.label;

            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);

            const actionCell = document.createElement("td");
            const viewButton = document.createElement("button");

            viewButton.type = "button";
            viewButton.className = "view-user-btn";
            viewButton.textContent = "View";

            viewButton.addEventListener("click", () => {
                alert(
                    `User: ${user.full_name || "Unnamed user"}\n` +
                    `Email: ${user.email || "—"}\n` +
                    `Status: ${status.label}\n` +
                    `Role: ${user.is_superuser ? "Admin" : "User"}`
                );
            });

            
            actionCell.appendChild(viewButton);

            if (!user.is_superuser) {
                const statusButton = document.createElement("button");

                statusButton.type = "button";
                statusButton.className = "user-status-action";
                statusButton.textContent =
                    user.status === "active" ? "Restrict" : "Restore";

                statusButton.addEventListener("click", () => {
                    changeUserStatus(user);
                });

                actionCell.appendChild(statusButton);
            }

            row.appendChild(actionCell);


            tableBody.appendChild(row);
        });
    }

    async function loadUsers() {
        errorBox.hidden = true;

        const token = getAccessToken();

        if (!token) {
            showError("Your login session was not found. Please sign in again.");
            tableBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 7;
            cell.className = "table-message";
            cell.textContent = "Unable to load users.";

            row.appendChild(cell);
            tableBody.appendChild(row);
            userCount.textContent = "Users unavailable";
            return;
        }

        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";

        try {
            const response = await fetch("/auth/admin/users/", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });

            if (response.status === 401) {
                throw new Error("Your session has expired. Please sign in again.");
            }

            if (response.status === 403) {
                throw new Error("Admin access is required to view users.");
            }

            if (!response.ok) {
                throw new Error(`Unable to load users (HTTP ${response.status}).`);
            }

            const data = await response.json();

            if (!Array.isArray(data.users)) {
                throw new Error("The API response did not contain a valid user list.");
            }

            users = data.users;
            renderUsers();

        } catch (error) {
            showError(error.message || "Something went wrong while loading users.");
            tableBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.className = "table-message";
            cell.textContent = "Unable to load users.";

            row.appendChild(cell);
            tableBody.appendChild(row);
            userCount.textContent = "Users unavailable";

        } finally {
            refreshButton.disabled = false;
            refreshButton.textContent = "↻  Refresh Users";
        }
    }

    searchInput.addEventListener("input", renderUsers);
    statusFilter.addEventListener("change", renderUsers);

    if (topbarSearch) {
        topbarSearch.addEventListener("input", () => {
            searchInput.value = topbarSearch.value;
            renderUsers();
        });
    }

    refreshButton.addEventListener("click", loadUsers);

    loadUsers();
});
