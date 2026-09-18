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


    /* =====================================================
       MATCH INFORMATION
       ===================================================== */

    document.getElementById("matchScore").textContent =
        `${match.score}%`;


    /* =====================================================
       CLAIM STATUS
       ===================================================== */

    const pendingStatus =
        document.querySelector(".pending-status");

    if (pendingStatus) {

        pendingStatus.textContent =
            formatStatus(claim.status);

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


    /* =====================================================
       VERIFICATION STATUS
       ===================================================== */

    const verificationStatus =
        document.getElementById("verificationStatus");

    if (verificationStatus) {

        verificationStatus.textContent =
            formatStatus(
                verification.verification_status
            );

    }
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