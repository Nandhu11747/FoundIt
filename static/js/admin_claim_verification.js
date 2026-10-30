document.addEventListener("DOMContentLoaded", function () {
    loadClaimVerification();
});


async function loadClaimVerification() {

    const pathParts = window.location.pathname.split("/");

    const claimId =
        pathParts[pathParts.length - 2];

    if (!claimId) {
        console.error("Claim ID not found.");
        return;
    }

    try {

        const response = await authenticatedFetch(
            `/claims/admin/${claimId}/`,
            {
                method: "GET"
            }
        );

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error(
                "Failed to load claim:",
                data
            );
            return;
        }

        console.log(
            "Admin claim verification data:",
            data
        );

        renderClaimData(data);

    } catch (error) {

        console.error(
            "Error loading claim verification:",
            error
        );
    }
}


function renderClaimData(data) {

    const claim = data.claim;
    const claimant = data.claimant;
    const lostReport = data.lost_report;
    const foundReport = data.found_report;
    const finder = data.finder;
    const match = data.match;
    const verification = data.verification;

    // Render tags for each report
    renderTags("claimantTags", lostReport.tags);
    renderTags("finderTags", foundReport.tags);


    /* =====================================================
       MATCH INFORMATION
       ===================================================== */

    document.getElementById("matchScore").textContent =
        `${match.score}%`;


    
    /* =====================================================
    CLAIM STATUS AND ACTION BUTTONS
    ===================================================== */

    const pendingStatus = document.querySelector(".pending-status");
    const matchActions = document.getElementById("matchActions");
    const reviewedMessage = document.getElementById("claimAlreadyReviewed");
    const rejectReasonSection = document.getElementById("rejectReasonSection");

    const currentStatus = String(claim.status || "")
        .trim()
        .toLowerCase();

    if (pendingStatus) {
        pendingStatus.textContent = formatStatus(currentStatus);
    }

    if (currentStatus === "pending") {
        if (matchActions) matchActions.hidden = false;
        if (reviewedMessage) reviewedMessage.hidden = true;
    } else {
        if (matchActions) matchActions.hidden = true;

        if (reviewedMessage) {
            reviewedMessage.hidden = false;
            reviewedMessage.textContent =
                `This claim has already been ${formatStatus(currentStatus).toLowerCase()}.`;
        }

        if (rejectReasonSection) {
            rejectReasonSection.hidden = true;
        }
    }

    const verificationStatus = document.getElementById("verificationStatus");

    if (verificationStatus) {
        const status = String(claim.status || "").trim().toLowerCase();

        verificationStatus.textContent = formatStatus(status);

        verificationStatus.classList.remove(
            "status-pending",
            "status-approved",
            "status-rejected"
        );

        if (status === "pending") {
            verificationStatus.classList.add("status-pending");
        } else if (status === "approved") {
            verificationStatus.classList.add("status-approved");
        } else if (status === "rejected") {
            verificationStatus.classList.add("status-rejected");
        }
    }


    /* =====================================================
       CLAIMANT / LOST REPORT
       ===================================================== */

    document.getElementById("claimantItemName").textContent =
        lostReport.item_name || "Not provided";

    document.getElementById("claimantCategory").textContent =
        lostReport.category || "Not provided";

    document.getElementById("claimantLocation").textContent =
        lostReport.location || "Not provided";

    document.getElementById("claimantDateTime").textContent =
        formatDateTime(
            lostReport.event_date,
            lostReport.event_time
        );

    document.getElementById("claimantDescription").textContent =
        lostReport.description || "No description provided.";

    document.getElementById("claimantName").textContent =
        claimant.full_name || "Unknown";


    /* =====================================================
       FINDER / FOUND REPORT
       ===================================================== */

    document.getElementById("finderItemName").textContent =
        foundReport.item_name || "Not provided";

    document.getElementById("finderCategory").textContent =
        foundReport.category || "Not provided";

    document.getElementById("finderLocation").textContent =
        foundReport.location || "Not provided";

    document.getElementById("finderDateTime").textContent =
        formatDateTime(
            foundReport.event_date,
            foundReport.event_time
        );

    document.getElementById("finderDescription").textContent =
        foundReport.description || "No description provided.";

    document.getElementById("finderName").textContent =
        finder.full_name || "Unknown";

    /*  =====================================================
        REPORT IMAGES
        ===================================================== */

    // Lost report image
    const claimantImage =
        document.getElementById("claimantReportImage");

    if (claimantImage && lostReport.image_url) {
        claimantImage.src = lostReport.image_url;
    }

    // Found report image
    const finderImage =
        document.getElementById("finderReportImage");

    if (finderImage && foundReport.image_url) {
        finderImage.src = foundReport.image_url;
    }


    /* =====================================================
       VERIFICATION CHECKLIST
       ===================================================== */

    document.getElementById("ownerIdVerified").checked =
        verification.owner_id_verified;

    document.getElementById("visualMatch").checked =
        verification.item_visual_match;

    document.getElementById("locationProximity").checked =
        verification.location_proximity;

    document.getElementById("ownershipProof").checked =
        verification.ownership_proof;


    
}


/* =========================================================
   DATE / TIME FORMATTER
   ========================================================= */

function formatDateTime(date, time) {

    if (!date) {
        return "Not provided";
    }

    const dateObject = new Date(
        `${date}T${time || "00:00:00"}`
    );

    if (isNaN(dateObject.getTime())) {
        return `${date} ${time || ""}`;
    }

    const formattedDate =
        dateObject.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    if (!time) {
        return formattedDate;
    }

    const formattedTime =
        dateObject.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

    return `${formattedDate} at ${formattedTime}`;
}


/* =========================================================
   STATUS FORMATTER
   ========================================================= */

function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }

    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}

/* =========================================================
   APPROVE CLAIM
   ========================================================= */

async function approveClaim(claimId) {

    try {

        const response = await authenticatedFetch(
            `/claims/admin/${claimId}/approve/`,
            {
                method: "POST"
            }
        );

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Failed to approve claim."
            );

            return;
        }

        alert("Claim approved successfully.");

        window.location.href =
            "/admin-dashboard/";

    } catch (error) {

        console.error(
            "Error approving claim:",
            error
        );

        alert(
            "Something went wrong while approving the claim."
        );
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const approveButton =
        document.getElementById("approveClaimBtn");

    if (approveButton) {

        approveButton.addEventListener(
            "click",
            function () {

                const pathParts =
                    window.location.pathname.split("/");

                const claimId =
                    pathParts[pathParts.length - 2];

                if (!claimId) {
                    console.error("Claim ID not found.");
                    return;
                }

                approveClaim(claimId);
            }
        );
    }
});


function renderTags(containerId, tags) {

    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (!Array.isArray(tags) || tags.length === 0) {
        container.textContent = "No tags provided.";
        return;
    }

    tags.forEach(function (tag) {
        const span = document.createElement("span");
        span.textContent = tag;
        container.appendChild(span);
    });
}


/* =========================================================
   REJECT CLAIM
   ========================================================= */

async function rejectClaim(claimId, rejectionReason) {
    try {
        const response = await authenticatedFetch(
            `/claims/admin/${claimId}/reject/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    rejection_reason: rejectionReason
                })
            }
        );

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Failed to reject claim.");
            return;
        }

        alert("Claim rejected successfully.");

        window.location.href = "/admin-dashboard/";

    } catch (error) {
        console.error("Error rejecting claim:", error);
        alert("Something went wrong while rejecting the claim.");
    }
}


/* =========================================================
   REJECT BUTTON EVENTS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const rejectButton =
        document.getElementById("rejectClaimBtn");

    const rejectReasonSection =
        document.getElementById("rejectReasonSection");

    const rejectionReasonInput =
        document.getElementById("rejectionReason");

    const confirmRejectButton =
        document.getElementById("confirmRejectBtn");

    const cancelRejectButton =
        document.getElementById("cancelRejectBtn");

    if (!rejectButton || !rejectReasonSection) {
        console.error("Reject form elements not found.");
        return;
    }

    rejectButton.addEventListener("click", function () {
        rejectReasonSection.hidden = false;
        rejectionReasonInput.focus();
    });

    cancelRejectButton.addEventListener("click", function () {
        rejectReasonSection.hidden = true;
        rejectionReasonInput.value = "";
    });

    confirmRejectButton.addEventListener("click", function () {
        const claimId =
            window.location.pathname.split("/").at(-2);

        const reason = rejectionReasonInput.value.trim();

        if (!reason) {
            alert("Please enter a rejection reason.");
            rejectionReasonInput.focus();
            return;
        }

        rejectClaim(claimId, reason);
    });
});
