document.addEventListener("DOMContentLoaded", async function () {
    
    const authenticated = await requireAuthentication();
    
    if (!authenticated) {
        return;
    }

    let currentStep = 1;

    const steps = document.querySelectorAll(".step");

    const step1 = document.querySelector(
        "#lostReportForm"
    ).closest(".report-content");

    const step2 = document.getElementById("step2");
    const step3 = document.getElementById("step3");
    const step4 = document.getElementById("step4");

    
    /* =========================
       LOCATION MAP AND GPS
    ========================= */

    const locationInput = document.getElementById("location");
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    const locationStatus = document.getElementById("locationStatus");
    const useCurrentLocationBtn = document.getElementById(
        "useCurrentLocationBtn"
    );

    let selectedCoordinates = null;
    let locationMap = null;
    let locationMarker = null;

    if (typeof L !== "undefined") {
        locationMap = L.map("locationMap").setView([10.8505, 76.2711], 7);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(locationMap);

        locationMap.on("click", function (event) {
            selectLocation(
                event.latlng.lat,
                event.latlng.lng
            );
        });
    } else {
        locationStatus.textContent =
            "Map failed to load. Check your internet connection and refresh.";
    }

    async function selectLocation(lat, lng) {
        selectedCoordinates = {
            latitude: lat,
            longitude: lng
        };

        latitudeInput.value = lat.toFixed(7);
        longitudeInput.value = lng.toFixed(7);

        if (locationMap) {
            if (locationMarker) {
                locationMarker.setLatLng([lat, lng]);
            } else {
                locationMarker = L.marker([lat, lng], {
                    draggable: true
                }).addTo(locationMap);

                locationMarker.on("dragend", function () {
                    const position = locationMarker.getLatLng();
                    selectLocation(position.lat, position.lng);
                });
            }

            locationMap.setView([lat, lng], 16);
        }

        locationInput.value =
            `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        locationStatus.textContent = "Getting location name...";

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
            );

            if (!response.ok) {
                throw new Error("Location lookup failed");
            }

            const data = await response.json();

            if (data.display_name) {
                locationInput.value = data.display_name;
                locationStatus.textContent =
                    "Location selected. You can move the pin to adjust it.";
            } else {
                locationStatus.textContent =
                    "Coordinates selected. No place name was found.";
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            locationStatus.textContent =
                "Coordinates selected, but the place name could not be loaded.";
        }
    }

    useCurrentLocationBtn.addEventListener("click", function () {
        if (!navigator.geolocation) {
            locationStatus.textContent =
                "Your browser does not support GPS location.";
            return;
        }

        locationStatus.textContent =
            "Getting your current location...";

        navigator.geolocation.getCurrentPosition(
            function (position) {
                selectLocation(
                    position.coords.latitude,
                    position.coords.longitude
                );
            },
            function (error) {
                const messages = {
                    1: "Location permission was denied. Allow location access in your browser settings.",
                    2: "Your current location is unavailable. Try selecting a point on the map.",
                    3: "Location request timed out. Please try again."
                };

                locationStatus.textContent =
                    messages[error.code] ||
                    "Could not get your location.";
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });


    function showStep(stepNumber) {

        currentStep = stepNumber;

        step1.style.display = "none";
        step2.style.display = "none";
        step3.style.display = "none";
        step4.style.display = "none";

        if (stepNumber === 1) {
            step1.style.display = "grid";
        }

        if (stepNumber === 2) {
            step2.style.display = "grid";
        }

        if (stepNumber === 3) {
            step3.style.display = "grid";
        }

        if (stepNumber === 4) {
            step4.style.display = "grid";
            updateReview();
        }


        steps.forEach((step, index) => {

            step.classList.toggle(
                "active",
                index + 1 === stepNumber
            );

        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    /* =========================
       STEP 1 → STEP 2
    ========================= */

    document
        .getElementById("nextStepBtn")
        .addEventListener("click", function () {

            const form = document.getElementById(
                "lostReportForm"
            );

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            showStep(2);
        });


    /* =========================
       STEP 2 → STEP 3
    ========================= */

    
    document
        .getElementById("locationNextBtn")
        .addEventListener("click", function () {

            const location =
                document.getElementById("location").value;

            const date =
                document.getElementById("eventDate").value;

            if (!location || !selectedCoordinates || !date) {
                alert("Please select a location on the map and enter the date.");
                return;
            }

            showStep(3);
        });


    /* =========================
       STEP 3 → STEP 4
    ========================= */

    document
        .getElementById("step3NextBtn")
        .addEventListener("click", function () {

            showStep(4);

        });


    /* =========================
       PREVIOUS BUTTONS
    ========================= */

    document
        .getElementById("previousStepBtn")
        .addEventListener("click", function () {

            showStep(1);

        });


    document
        .getElementById("step3PreviousBtn")
        .addEventListener("click", function () {

            showStep(2);

        });


    document
        .getElementById("step4PreviousBtn")
        .addEventListener("click", function () {

            showStep(3);

        });


    /* =========================
       REVIEW DATA
    ========================= */

    function updateReview() {

        document.getElementById(
            "reviewItemName"
        ).textContent =
            document.getElementById(
                "itemName"
            ).value || "—";


        document.getElementById(
            "reviewCategory"
        ).textContent =
            document.getElementById(
                "category"
            ).value || "—";


        document.getElementById(
            "reviewReward"
        ).textContent =
            document.getElementById(
                "reward"
            ).value === "0"
                ? "No reward"
                : "₹" +
                  document.getElementById(
                      "reward"
                  ).value;


        document.getElementById(
            "reviewDescription"
        ).textContent =
            document.getElementById(
                "description"
            ).value || "—";


        document.getElementById(
            "reviewLocation"
        ).textContent =
            document.getElementById(
                "location"
            ).value || "—";


        document.getElementById(
            "reviewDate"
        ).textContent =
            document.getElementById(
                "eventDate"
            ).value || "—";


        document.getElementById(
            "reviewTime"
        ).textContent =
            document.getElementById(
                "eventTime"
            ).value || "Not specified";
    }


    /* =========================
       CHARACTER COUNT
    ========================= */

    const description =
        document.getElementById("description");

    const characterCount =
        document.querySelector(".character-count");


    description.addEventListener(
        "input",
        function () {

            characterCount.textContent =
                `${description.value.length} / 1000 characters`;

        }
    );


    /* =========================
       TAGS
    ========================= */

    const tagInput =
        document.getElementById("tags");

    const addTagBtn =
        document.getElementById("addTagBtn");

    const tagContainer =
        document.getElementById("tagContainer");

    const reportTags = [];


    addTagBtn.addEventListener(
        "click",
        function () {

            const tag =
                tagInput.value.trim();

            if (!tag) {
                return;
            }

            const tagElement =
                document.createElement("span");

            tagElement.className = "tag";

            tagElement.textContent =
                tag;

            tagContainer.appendChild(
                tagElement
            );

            reportTags.push(tag);

            tagInput.value = "";

        }
    );


    /* =========================
       INITIAL STEP
    ========================= */

    showStep(1);

    /* =========================
       SUBMIT LOST REPORT
    ========================= */

    document
        .getElementById("submitLostReportBtn")
        .addEventListener("click", async function () {

            const token =
                localStorage.getItem("access_token") ||
                sessionStorage.getItem("access_token");

            if (!token) {
                window.location.href = "/login/";
                return;
            }

            const reportData = {

                item_name:
                    document.getElementById("itemName").value,

                type: "lost",

                category:
                    document.getElementById("category").value,

                description:
                    document.getElementById("description").value,

                brand: "",

                color: "",

                condition: "",

                location:
                    document.getElementById("location").value,

                latitude: Number(latitudeInput.value),
                longitude: Number(longitudeInput.value),

                event_date:
                    document.getElementById("eventDate").value,

                event_time:
                    document.getElementById("eventTime").value || null,

                reward_offered:
                    document.getElementById("reward").value || "0",

                private_identification_details:
                    document.getElementById("privateDetails").value,

                tags: reportTags

            };


            const message =
                document.getElementById("reportMessage");

            // Check whether a map location was selected
            if (!selectedCoordinates) {
                message.textContent =
                    "Please select a location on the map first.";
                return;
            }

            try {

                const response = await authenticatedFetch(
                    "/reports/",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                    },

                     body: JSON.stringify(reportData)
                }
            );


                const data =
                    await response.json();


                if (!response.ok) {

                    console.error(
                        "Report submission error:",
                        data
                    );

                    message.textContent =
                        "Unable to submit the report. Please check your information.";

                    return;
                }


                message.textContent =
                    "Lost item report submitted successfully!";


                console.log(
                    "Lost report created:",
                    data
                );


                setTimeout(function () {

                    window.location.href =
                        "/dashboard/";

                }, 1500);


            } catch (error) {

                console.error(
                    "Submission error:",
                    error
                );

                message.textContent =
                    "Something went wrong. Please try again.";

            }

        });

});