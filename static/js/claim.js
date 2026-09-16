document.addEventListener("DOMContentLoaded", async function () {

    // ================= AUTHENTICATION =================

    const authenticated = await requireAuthentication();

    if (!authenticated) {
        return;
    }


    // ================= USER INFORMATION =================

    try {

        const userResponse = await authenticatedFetch(
            "/auth/me/",
            {
                method: "GET"
            }
        );

        if (userResponse && userResponse.ok) {

            const user = await userResponse.json();

            const userName =
                document.getElementById("userName");

            const userAvatar =
                document.getElementById("userAvatar");

            if (user.full_name) {

                userName.textContent =
                    user.full_name;

                userAvatar.textContent =
                    user.full_name
                        .charAt(0)
                        .toUpperCase();
            }
        }

    } catch (error) {

        console.error(
            "Unable to load user information:",
            error
        );
    }


    // ================= GET MATCH ID =================

    const urlParams =
        new URLSearchParams(window.location.search);

    const matchId =
        urlParams.get("match_id");

    if (!matchId) {

        alert("No match selected.");

        window.location.href =
            "/dashboard/";

        return;
    }


    // ================= PAGE ELEMENTS =================

    const claimItemImage =
        document.getElementById("claimItemImage");

    const claimItemCategory =
        document.getElementById("claimItemCategory");

    const claimItemName =
        document.getElementById("claimItemName");

    const claimItemDescription =
        document.getElementById("claimItemDescription");

    const claimItemLocation =
        document.getElementById("claimItemLocation");

    const claimItemDate =
        document.getElementById("claimItemDate");

    const uniqueDetails =
        document.getElementById("uniqueDetails");

    const evidenceInput =
        document.getElementById("claimEvidence");

    const selectedFile =
        document.getElementById("selectedFile");

    const submitClaimBtn =
        document.getElementById("submitClaimBtn");

    const claimMessage =
        document.getElementById("claimMessage");


    // ================= LOAD MATCH =================

    async function loadMatch() {

        try {

            const response =
                await authenticatedFetch(
                    `/claims/match/${matchId}/`,
                    {
                        method: "GET"
                    }
                );

            if (!response) {
                return;
            }

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to load match."
                );
            }

            console.log(
                "Match details:",
                data
            );

            const foundReport =
                data.found_report;


            // Item information

            claimItemCategory.textContent =
                foundReport.category;

            claimItemName.textContent =
                foundReport.item_name;

            claimItemDescription.textContent =
                foundReport.description ||
                "No description provided.";

            claimItemLocation.textContent =
                `◉ ${foundReport.location}`;

            claimItemDate.textContent =
                `● ${foundReport.event_date}`;


            // Item image

            if (foundReport.image_url) {

                claimItemImage.src =
                    foundReport.image_url;

            } else {

                claimItemImage.style.display =
                    "none";
            }


        } catch (error) {

            console.error(
                "Match loading error:",
                error
            );

            claimMessage.textContent =
                error.message;

            claimMessage.style.color =
                "#dc2626";
        }
    }


    // ================= FILE SELECTION =================

    evidenceInput.addEventListener(
        "change",
        function () {

            if (evidenceInput.files.length > 0) {

                selectedFile.textContent =
                    `Selected: ${evidenceInput.files[0].name}`;

            } else {

                selectedFile.textContent = "";
            }
        }
    );


    // ================= SUBMIT CLAIM =================

    submitClaimBtn.addEventListener(
        "click",
        async function () {

            submitClaimBtn.disabled = true;

            submitClaimBtn.textContent =
                "Submitting...";

            claimMessage.textContent = "";


            try {

                /*
                 * The match tells us which Lost Report
                 * belongs to the current user.
                 *
                 * The Claim API expects the Lost Report ID.
                 */

                const matchResponse =
                    await authenticatedFetch(
                        `/claims/match/${matchId}/`,
                        {
                            method: "GET"
                        }
                    );

                if (!matchResponse) {
                    return;
                }

                const matchData =
                    await matchResponse.json();

                console.log("Match data before claim:", matchData);

                if (!matchResponse.ok) {

                    throw new Error(
                        matchData.error ||
                        "Unable to verify match."
                    );
                }


                const formData =
                    new FormData();

                formData.append(
                    "report_id",
                    matchData.lost_report_id
                );

                formData.append(
                    "unique_identification_details",
                    uniqueDetails.value.trim()
                );

                formData.append(
                    "description",
                    uniqueDetails.value.trim()
                );


                if (evidenceInput.files.length > 0) {

                    formData.append(
                        "evidence",
                        evidenceInput.files[0]
                    );
                }


                const response =
                    await authenticatedFetch(
                        "/claims/",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Unable to submit claim."
                    );
                }


                claimMessage.textContent =
                    "Claim submitted successfully!";

                claimMessage.style.color =
                    "#15803d";

                submitClaimBtn.textContent =
                    "Claim Submitted";


                setTimeout(
                    function () {

                        window.location.href =
                            "/dashboard/";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "Claim submission error:",
                    error
                );

                claimMessage.textContent =
                    error.message;

                claimMessage.style.color =
                    "#dc2626";

                submitClaimBtn.disabled =
                    false;

                submitClaimBtn.textContent =
                    "Submit Claim";
            }

        }
    );


    // Load the match
    loadMatch();

});