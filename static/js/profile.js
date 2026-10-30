
document.addEventListener("DOMContentLoaded", async () => {
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const location = document.getElementById("location");
    const userName = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");
    const profileAvatar = document.getElementById("profileAvatar");

    // Connect the existing Sign Out button.
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (event) => {
            event.preventDefault();
            logout();
        });
    }

    try {
        const response = await authenticatedFetch("/auth/me/");

        if (!response || !response.ok) {
            throw new Error("Unable to load your profile.");
        }

        const user = await response.json();

        const name = user.full_name || "FoundIt User";
        const userEmail = user.email || "";

        profileName.textContent = name;
        profileEmail.textContent = userEmail;
        fullName.value = user.full_name || "";
        email.value = userEmail;
        phone.value = user.phone || "";
        location.value = user.location || "";
        userName.textContent = name;

        const initial = name.trim().charAt(0).toUpperCase() || "U";
        userAvatar.textContent = initial;
        profileAvatar.textContent = initial;

        // Use the saved profile photo when one is available.
        if (user.profile_photo) {
            profileAvatar.textContent = "";

            const image = document.createElement("img");
            image.src = user.profile_photo;
            image.alt = `${name}'s profile photo`;

            image.addEventListener("error", () => {
                profileAvatar.textContent = initial;
            }, { once: true });

            profileAvatar.appendChild(image);
        }
    } catch (error) {
        console.error("Profile loading failed:", error);
        profileName.textContent = "Unable to load profile";
        profileEmail.textContent =
            "Please sign in again if your session has expired.";
    }


    
    const profileForm = document.getElementById("profileForm");
    const editProfileBtn = document.getElementById("editProfileBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const profileMessage = document.getElementById("profileMessage");

    const editableFields = [fullName, phone, location];

    let originalValues = {};

    function showProfileMessage(message, type) {
        profileMessage.textContent = message;
        profileMessage.className = type;
        profileMessage.hidden = false;
    }

    function setEditMode(enabled) {
        editableFields.forEach(field => {
            field.disabled = !enabled;
        });

        editProfileBtn.hidden = enabled;
        cancelEditBtn.hidden = !enabled;
        saveProfileBtn.hidden = !enabled;
        profileMessage.hidden = true;
    }

    editProfileBtn.addEventListener("click", () => {
        originalValues = {
            fullName: fullName.value,
            phone: phone.value,
            location: location.value
        };

        setEditMode(true);
        fullName.focus();
    });

    cancelEditBtn.addEventListener("click", () => {
        fullName.value = originalValues.fullName;
        phone.value = originalValues.phone;
        location.value = originalValues.location;

        setEditMode(false);
    });

    
    profileForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!profileForm.reportValidity()) {
            return;
        }

        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = "Saving...";
        profileMessage.hidden = true;

        try {
            const response = await authenticatedFetch(
                "/auth/profile/update/",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        full_name: fullName.value.trim(),
                        phone: phone.value.trim(),
                        location: location.value.trim()
                    })
                }
            );

            if (!response) {
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = Object.values(data)
                    .flat()
                    .join(" ");

                throw new Error(
                    errorMessage || "Unable to update your profile."
                );
            }

            const updatedUser = data.user;

            fullName.value = updatedUser.full_name || "";
            phone.value = updatedUser.phone || "";
            location.value = updatedUser.location || "";

            profileName.textContent = updatedUser.full_name || "FoundIt User";
            profileEmail.textContent = email.value;
            userName.textContent = updatedUser.full_name || "FoundIt User";

            const initial =
                (updatedUser.full_name || "U").trim().charAt(0).toUpperCase();

            userAvatar.textContent = initial;
            profileAvatar.textContent = initial;

            setEditMode(false);

            showProfileMessage(
                "Profile updated successfully!",
                "success"
            );

        } catch (error) {
            showProfileMessage(
                error.message || "Something went wrong. Please try again.",
                "error"
            );
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = "Save Changes";
        }
    });

    
    async function loadProfileCounts() {
        const reportCount = document.getElementById("reportCount");
        const claimCount = document.getElementById("claimCount");

        try {
            const [reportsResponse, claimsResponse] = await Promise.all([
                authenticatedFetch("/reports/my/"),
                authenticatedFetch("/claims/my/")
            ]);

            if (
                !reportsResponse ||
                !reportsResponse.ok ||
                !claimsResponse ||
                !claimsResponse.ok
            ) {
                throw new Error("Unable to load report and claim counts.");
            }

            const [reports, claims] = await Promise.all([
                reportsResponse.json(),
                claimsResponse.json()
            ]);

            reportCount.textContent = reports.length;
            claimCount.textContent = claims.length;

        } catch (error) {
            console.error("Profile counts loading failed:", error);
            reportCount.textContent = "—";
            claimCount.textContent = "—";
        }
    }

    loadProfileCounts();


});
