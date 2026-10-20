document.addEventListener("DOMContentLoaded", async function () {

    const authenticated = await requireAuthentication();

    if (!authenticated) {
        return;
    }

    
    /* =========================
       FOUND LOCATION MAP AND GPS
    ========================= */

    const foundLocationInput = document.getElementById("foundLocation");
    const foundLatitudeInput = document.getElementById("foundLatitude");
    const foundLongitudeInput = document.getElementById("foundLongitude");
    const foundLocationStatus = document.getElementById("foundLocationStatus");
    const useFoundCurrentLocationBtn = document.getElementById(
        "useFoundCurrentLocationBtn"
    );

    let selectedFoundCoordinates = null;
    let foundLocationMap = null;
    let foundLocationMarker = null;

    if (typeof L !== "undefined") {
        foundLocationMap = L.map("foundLocationMap").setView(
            [10.8505, 76.2711],
            7
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19
        }).addTo(foundLocationMap);

        foundLocationMap.on("click", function (event) {
            selectFoundLocation(event.latlng.lat, event.latlng.lng);
        });
    } else {
        foundLocationStatus.textContent =
            "Map failed to load. Check your internet connection and refresh.";
    }

    async function selectFoundLocation(lat, lng) {
        selectedFoundCoordinates = {
            latitude: lat,
            longitude: lng
        };

        foundLatitudeInput.value = lat.toFixed(7);
        foundLongitudeInput.value = lng.toFixed(7);

        if (foundLocationMap) {
            if (foundLocationMarker) {
                foundLocationMarker.setLatLng([lat, lng]);
            } else {
                foundLocationMarker = L.marker([lat, lng], {
                    draggable: true
                }).addTo(foundLocationMap);

                foundLocationMarker.on("dragend", function () {
                    const position = foundLocationMarker.getLatLng();
                    selectFoundLocation(position.lat, position.lng);
                });
            }

            foundLocationMap.setView([lat, lng], 16);
        }

        foundLocationInput.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        foundLocationStatus.textContent = "Getting location name...";

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
            );

            if (!response.ok) {
                throw new Error("Location lookup failed");
            }

            const data = await response.json();

            if (data.display_name) {
                foundLocationInput.value = data.display_name;
                foundLocationStatus.textContent =
                    "Location selected. You can move the pin to adjust it.";
            } else {
                foundLocationStatus.textContent =
                    "Coordinates selected. No place name was found.";
            }
        } catch (error) {
            console.error("Found location lookup error:", error);
            foundLocationStatus.textContent =
                "Coordinates selected, but the place name could not be loaded.";
        }
    }

    useFoundCurrentLocationBtn.addEventListener("click", function () {
        if (!navigator.geolocation) {
            foundLocationStatus.textContent =
                "Your browser does not support GPS location.";
            return;
        }

        foundLocationStatus.textContent =
            "Getting your current location...";

        navigator.geolocation.getCurrentPosition(
            function (position) {
                selectFoundLocation(
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

                foundLocationStatus.textContent =
                    messages[error.code] || "Could not get your location.";
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });


    const steps = document.querySelectorAll(".form-step");
    const stepIndicators = document.querySelectorAll(".step");

    let currentStep = 1;


    // =========================
    // SHOW STEP
    // =========================

    function showStep(stepNumber) {

        currentStep = stepNumber;

        steps.forEach(function (step, index) {

            step.classList.toggle(
                "active",
                index === stepNumber - 1
            );

        });

        stepIndicators.forEach(function (step, index) {

            step.classList.toggle(
                "active",
                index === stepNumber - 1
            );

            step.classList.toggle(
                "completed",
                index < stepNumber - 1
            );

        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    // =========================
    // VALIDATE CURRENT STEP
    // =========================

    function validateCurrentStep() {

        const currentSection = steps[currentStep - 1];

        const requiredFields =
            currentSection.querySelectorAll(
                "input[required], select[required], textarea[required]"
            );

        for (const field of requiredFields) {

            if (!field.checkValidity()) {

                field.reportValidity();

                return false;
            }
        }

        
        // Require a map location on Step 2
        if (currentStep === 2 && !selectedFoundCoordinates) {
            foundLocationStatus.textContent =
                "Please select a location on the map before continuing.";
            return false;
        }

        return true;

    }


    // =========================
    // UPDATE REVIEW
    // =========================

    function updateReview() {

        document.getElementById("reviewFoundItemName").textContent =
            document.getElementById("foundItemName").value || "—";

        document.getElementById("reviewFoundCategory").textContent =
            document.getElementById("foundCategory").value || "—";

        document.getElementById("reviewFoundDescription").textContent =
            document.getElementById("foundDescription").value || "—";

        document.getElementById("reviewFoundBrand").textContent =
            document.getElementById("foundBrand").value || "—";

        document.getElementById("reviewFoundColor").textContent =
            document.getElementById("foundColor").value || "—";

        document.getElementById("reviewFoundCondition").textContent =
            document.getElementById("foundCondition").value || "—";

        document.getElementById("reviewFoundLocation").textContent =
            document.getElementById("foundLocation").value || "—";

        document.getElementById("reviewFoundEventDate").textContent =
            document.getElementById("foundEventDate").value || "—";

        document.getElementById("reviewFoundEventTime").textContent =
            document.getElementById("foundEventTime").value || "—";


        const photoInput =
            document.getElementById("foundItemPhoto");

        if (photoInput.files.length > 0) {

            document.getElementById("reviewFoundPhoto").textContent =
                photoInput.files[0].name;

        } else {

            document.getElementById("reviewFoundPhoto").textContent =
                "No photo selected";
        }

        // Display tags in the review section
        const reviewTags = document.getElementById("reviewFoundTags");

        reviewTags.textContent = reportTags.length
            ? reportTags.join(", ")
            : "No tags added";
    }


    // =========================
    // NEXT BUTTONS
    // =========================

    document.querySelectorAll(".next-step-btn").forEach(
        function (button) {

            button.addEventListener("click", function () {

                // Do not continue if current step is incomplete
                if (!validateCurrentStep()) {
                    return;
                }

                if (currentStep < steps.length) {

                    if (currentStep === 3) {
                        updateReview();
                    }

                    showStep(currentStep + 1);
                }

            });

        }
    );


    // =========================
    // PREVIOUS BUTTONS
    // =========================

    document.querySelectorAll(".prev-step-btn").forEach(
        function (button) {

            button.addEventListener("click", function () {

                if (currentStep > 1) {

                    showStep(currentStep - 1);
                }

            });

        }
    );


    // =========================
    // FOUND REPORT TAGS
    // =========================

    const foundTagInput =
        document.getElementById("foundTags");

    const addFoundTagBtn =
        document.getElementById("addFoundTagBtn");

    const foundTagContainer =
        document.getElementById("foundTagContainer");

    const reportTags = [];

    addFoundTagBtn.addEventListener("click", function () {

        console.log("Found tag input:", foundTagInput);
        console.log("Add tag button:", addFoundTagBtn);
        console.log("Tag container:", foundTagContainer);

        const tag = foundTagInput.value.trim();

        if (!tag) {
            return;
        }

        // Prevent duplicate tags (case-insensitive)
        const alreadyExists = reportTags.some(function (existingTag) {
            return existingTag.toLowerCase() === tag.toLowerCase();
        });

        if (alreadyExists) {
            foundTagInput.value = "";
            return;
        }

        reportTags.push(tag);

        const tagElement = document.createElement("span");
        tagElement.className = "tag";
        tagElement.textContent = tag;

        foundTagContainer.appendChild(tagElement);

        foundTagInput.value = "";
        foundTagInput.focus();
    });


// =========================
// SUBMIT FOUND REPORT
// =========================

const submitButton =
    document.getElementById("submitFoundReportBtn");

const reportMessage =
    document.getElementById("foundReportMessage");

submitButton.addEventListener("click", async function () {

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    reportMessage.textContent = "";

    console.log(
        "Private details:",
        document.getElementById("foundPrivateDetails").value
    );

    const reportData = {

        item_name:
            document.getElementById("foundItemName").value.trim(),

        type: "found",

        category:
            document.getElementById("foundCategory").value,

        description:
            document.getElementById("foundDescription").value.trim(),

        brand:
            document.getElementById("foundBrand").value.trim(),

        color:
            document.getElementById("foundColor").value.trim(),

        condition:
            document.getElementById("foundCondition").value,

        location:
            document.getElementById("foundLocation").value.trim(),

        event_date:
            document.getElementById("foundEventDate").value,

        event_time:
            document.getElementById("foundEventTime").value || null,

        private_identification_details:
            document.getElementById("foundPrivateDetails").value.trim()
    };

    try {

        const formData = new FormData();

        reportTags.forEach(function (tag) {
            formData.append("tags", tag);
        });

        formData.append(
            "item_name",
            document.getElementById("foundItemName").value.trim()
        );

        formData.append(
            "type",
            "found"
        );

        formData.append(
            "category",
            document.getElementById("foundCategory").value
        );

        formData.append(
            "description",
            document.getElementById("foundDescription").value.trim()
        );

        formData.append(
            "brand",
            document.getElementById("foundBrand").value.trim()
        );

        formData.append(
            "color",
            document.getElementById("foundColor").value.trim()
        );

        formData.append(
            "condition",
            document.getElementById("foundCondition").value
        );

        formData.append(
            "location",
            document.getElementById("foundLocation").value.trim()
        );

        
        formData.append(
            "latitude",
            foundLatitudeInput.value
        );

        formData.append(
            "longitude",
            foundLongitudeInput.value
        );


        formData.append(
            "event_date",
            document.getElementById("foundEventDate").value
        );

        formData.append(
            "event_time",
            document.getElementById("foundEventTime").value || ""
        );

        formData.append(
            "private_identification_details",
            document.getElementById("foundPrivateDetails").value.trim()
        );

        const photoInput =
            document.getElementById("foundItemPhoto");

        if (photoInput.files.length > 0) {

            formData.append(
                "photo",
                photoInput.files[0]
            );
        }

        const response = await authenticatedFetch(
            "/reports/",
            {
                method: "POST",

                body: formData
            }
        );

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                "Unable to submit found report."
            );
        }

        reportMessage.textContent =
            "Found report submitted successfully!";

        reportMessage.style.color = "#15803d";

        submitButton.textContent =
            "Report Submitted";

        setTimeout(function () {
            window.location.href = "/dashboard/";
        }, 1500);

    } catch (error) {

        console.error(
            "Found report submission error:",
            error
        );

        reportMessage.textContent =
            error.message;

        reportMessage.style.color = "#dc2626";

        submitButton.disabled = false;

        submitButton.textContent =
            "Submit Found Report";
    }

});


// =========================
// INITIAL STEP
// =========================

showStep(1);

});