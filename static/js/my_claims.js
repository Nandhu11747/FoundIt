
document.addEventListener("DOMContentLoaded", loadMyClaims);

async function loadMyClaims() {
    const loading = document.getElementById("claimsLoading");
    const claimsList = document.getElementById("claimsList");
    const emptyMessage = document.getElementById("claimsEmpty");
    const errorMessage = document.getElementById("claimsError");

    try {
        const response = await authenticatedFetch("/claims/my/");

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const claims = await response.json();

        document.getElementById("totalClaims").textContent = claims.length;
        document.getElementById("pendingClaims").textContent =
            claims.filter(claim => claim.status === "pending").length;
        document.getElementById("approvedClaims").textContent =
            claims.filter(claim => claim.status === "approved").length;
        document.getElementById("rejectedClaims").textContent =
            claims.filter(claim => claim.status === "rejected").length;

        claimsList.replaceChildren();

        if (claims.length === 0) {
            emptyMessage.hidden = false;
            return;
        }

        emptyMessage.hidden = true;

        claims.forEach(claim => {
            const card = document.createElement("article");
            card.className = "claim-card";

            const details = document.createElement("div");

            const heading = document.createElement("h3");
            heading.textContent =
                claim.lost_report?.item_name || "Lost item";

            const claimId = document.createElement("p");
            claimId.textContent = `Claim #${claim.claim_id}`;

            const foundItem = document.createElement("p");
            foundItem.textContent = claim.found_report
                ? `Potential found item: ${claim.found_report.item_name}`
                : "No linked found item";

            const submitted = document.createElement("p");
            const date = claim.created_at
                ? new Date(claim.created_at).toLocaleDateString()
                : "Date unavailable";
            submitted.textContent = `Submitted: ${date}`;

            const statusBadge = document.createElement("span");
            statusBadge.className = `claim-status ${claim.status}`;
            statusBadge.textContent = claim.status;

            details.append(heading, claimId, foundItem, submitted, statusBadge);

            if (claim.rejection_reason) {
                const reason = document.createElement("p");
                reason.textContent = `Reason: ${claim.rejection_reason}`;
                details.appendChild(reason);
            }

            const matchStatus = document.createElement("p");
            matchStatus.textContent =
                `Match status: ${claim.match_status || "Unavailable"}`;
            details.appendChild(matchStatus);

            card.appendChild(details);
            claimsList.appendChild(card);
        });

    } catch (error) {
        console.error("Failed to load claims:", error);
        errorMessage.hidden = false;
    } finally {
        loading.hidden = true;
    }
}
