
document.addEventListener("DOMContentLoaded", async () => {
    const loading = document.getElementById("detailsLoading");
    const error = document.getElementById("detailsError");
    const detailsSection = document.getElementById("itemDetails");

    const detailImage = document.getElementById("detailImage");
    const imagePlaceholder = document.getElementById("imagePlaceholder");

    const detailType = document.getElementById("detailType");
    const detailId = document.getElementById("detailId");
    const detailName = document.getElementById("detailName");
    const detailDescription = document.getElementById("detailDescription");
    const detailCategory = document.getElementById("detailCategory");
    const detailBrand = document.getElementById("detailBrand");
    const detailColor = document.getElementById("detailColor");
    const detailCondition = document.getElementById("detailCondition");
    const detailLocation = document.getElementById("detailLocation");
    const detailDate = document.getElementById("detailDate");
    const detailTags = document.getElementById("detailTags");

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
        // Extract the report ID from /reports/item/<report_id>/
        const pathParts = window.location.pathname
            .split("/")
            .filter(Boolean);

        const itemIndex = pathParts.indexOf("item");
        const reportId = itemIndex !== -1
            ? pathParts[itemIndex + 1]
            : null;

        if (!reportId || !/^\d+$/.test(reportId)) {
            throw new Error("Invalid report ID.");
        }

        // Use your existing API to retrieve report data.
        const response = await authenticatedFetch("/reports/browse/");

        if (!response.ok) {
            throw new Error("Could not retrieve reports.");
        }

        const reports = await response.json();

        const item = reports.find(
            report => String(report.id) === reportId
        );

        if (!item) {
            throw new Error("Item not found.");
        }

        // Fill in the item details.
        detailType.textContent =
            item.type === "lost" ? "Lost Item" : "Found Item";

        detailId.textContent = `Report #${item.id}`;
        detailName.textContent = showValue(item.item_name);
        detailDescription.textContent = showValue(item.description);
        detailCategory.textContent = showValue(item.category);
        detailBrand.textContent = showValue(item.brand);
        detailColor.textContent = showValue(item.color);
        detailCondition.textContent = showValue(item.condition);
        detailLocation.textContent = showValue(item.location);
        detailDate.textContent = formatDate(item.event_date);

        // Show the photo if one exists.
        if (item.image_url) {
            detailImage.src = item.image_url;
            detailImage.alt = item.item_name || "Reported item";
            detailImage.hidden = false;
            imagePlaceholder.hidden = true;

            detailImage.addEventListener("error", () => {
                detailImage.hidden = true;
                imagePlaceholder.hidden = false;
            }, { once: true });
        } else {
            detailImage.hidden = true;
            imagePlaceholder.hidden = false;
        }

        // Display tags safely.
        detailTags.replaceChildren();

        if (Array.isArray(item.tags) && item.tags.length > 0) {
            item.tags.forEach(tag => {
                const tagElement = document.createElement("span");
                tagElement.className = "detail-tag";
                tagElement.textContent = tag;
                detailTags.appendChild(tagElement);
            });
        }

    loading.hidden = true;
    detailsSection.hidden = false;

    if (item.type === "found") {
        loadPotentialMatches(item.id);
    }

    } catch (err) {
        console.error("Item details error:", err);
        loading.hidden = true;
        error.hidden = false;
    }
});


async function loadPotentialMatches(foundReportId) {
    const matchSection = document.getElementById("matchSection");
    const matchLoading = document.getElementById("matchLoading");
    const matchResult = document.getElementById("matchResult");
    const noMatchMessage = document.getElementById("noMatchMessage");
    const matchError = document.getElementById("matchError");
    const claimAction = document.getElementById("claimAction");

    matchSection.hidden = false;
    matchLoading.hidden = false;
    matchResult.hidden = true;
    noMatchMessage.hidden = true;
    matchError.hidden = true;

    try {
        const response = await authenticatedFetch(
            `/reports/item/${foundReportId}/matches/`
        );

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const matches = await response.json();

        if (!Array.isArray(matches) || matches.length === 0) {
            matchLoading.hidden = true;
            noMatchMessage.hidden = false;
            return;
        }

        matches.sort(
            (a, b) => Number(b.match_score) - Number(a.match_score)
        );

        const bestMatch = matches.find(
            match => match.match_status === "pending"
        );

        if (!bestMatch) {
            matchLoading.hidden = true;
            noMatchMessage.textContent =
                "Potential matches exist, but none is currently available to claim.";
            noMatchMessage.hidden = false;
            return;
        }

        document.getElementById("matchedLostItem").textContent =
            `${bestMatch.lost_item_name} (#${bestMatch.lost_report_id})`;

        const score = Math.max(
            0,
            Math.min(100, Number(bestMatch.match_score) || 0)
        );

        document.getElementById("matchScore").textContent = `${score}/100`;
        document.getElementById("matchScoreBar").style.width = `${score}%`;

        document.getElementById("matchStatus").textContent =
            `Status: ${bestMatch.match_status}`;

        claimAction.dataset.matchId = bestMatch.match_id;

        claimAction.onclick = function () {
            const matchId = this.dataset.matchId;
            console.log("Claim button clicked. Match ID:", matchId);

            window.location.href =
                `/claims/page/?match_id=${encodeURIComponent(matchId)}`;
        };

        claimAction.hidden = false;


        matchLoading.hidden = true;
        matchResult.hidden = false;

    } catch (err) {
        console.error("Failed to load potential matches:", err);
        matchLoading.hidden = true;
        matchError.hidden = false;
    }
}

