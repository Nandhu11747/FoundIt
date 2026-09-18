document.addEventListener("DOMContentLoaded", function () {

    const logoutBtn =
        document.getElementById("adminLogoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                logout();
            }
        );
    }


    async function loadPendingClaims() {
    try {
        const response = await authenticatedFetch(
            "/claims/admin/pending/",
            {
                method: "GET"
            }
        );

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            console.error("Failed to load pending claims:", data);
            return;
        }

        renderPendingClaims(data);

    } catch (error) {
        console.error("Error loading pending claims:", error);
    }
}


    function renderPendingClaims(claims) {
        const container =
            document.getElementById("verificationRows");

        if (!container) return;

        container.innerHTML = "";

        if (claims.length === 0) {
            container.innerHTML = `
                <div class="verification-row">
                    <span>No pending claims.</span>
                </div>
            `;
            return;
        }

        claims.forEach(function (claim) {

            const row = document.createElement("div");

            row.className = "verification-row";

            row.innerHTML = `
                <strong>${claim.item_name}</strong>

                <span>Claim</span>

                <span class="pending-status">
                    ◉ ${claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                </span>
            `;

            container.appendChild(row);
        });
    }

    // Load pending claims when the dashboard opens
    loadPendingClaims();

});