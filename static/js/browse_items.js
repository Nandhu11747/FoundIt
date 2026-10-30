
document.addEventListener("DOMContentLoaded", loadBrowseItems);

let allItems = [];
let filteredItems = [];
let currentPage = 1;
const itemsPerPage = 9;
let currentView = "grid";
let userLatitude = null;
let userLongitude = null;


function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRadians = degrees => degrees * Math.PI / 180;
    const earthRadiusKm = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
}


async function loadBrowseItems() {

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault();
            logout();
        });
    }

    const container = document.getElementById("itemsContainer");
    const error = document.getElementById("browseError");

    try {
        const response = await authenticatedFetch("/reports/browse/");

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        allItems = await response.json();

        // Hide private or incomplete records if needed in future.
        filteredItems = [...allItems];

        setupBrowseControls();
        applyFilters();
    } catch (err) {
        console.error("Failed to load browse items:", err);
        error.hidden = false;
        container.replaceChildren();
        document.getElementById("resultsCount").textContent =
            "Unable to load reports";
    }
}

function setupBrowseControls() {
    
    
    const distanceSlider = document.getElementById("distanceSlider");
    const distanceValue = document.getElementById("distanceValue");
    const useMyLocationBtn = document.getElementById("useMyLocation");
    const locationStatus = document.getElementById("locationStatus");

    distanceSlider.addEventListener("input", () => {
        distanceValue.textContent = `${distanceSlider.value} km`;
    });

    useMyLocationBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
            locationStatus.textContent =
                "Your browser does not support location access.";
            return;
        }

        locationStatus.textContent = "Getting your location...";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLatitude = position.coords.latitude;
                userLongitude = position.coords.longitude;

                locationStatus.textContent =
                    "Location detected. Applying distance filter...";

                applyFilters();
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    locationStatus.textContent =
                        "Location permission denied. Please allow access in your browser.";
                } else {
                    locationStatus.textContent =
                        "Unable to get your location. Please try again.";
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });



    document.getElementById("itemSearch").addEventListener(
        "input",
        applyFilters
    );

    document.querySelectorAll(".category-filter").forEach(input => {
        input.addEventListener("change", applyFilters);
    });

    document.querySelectorAll(".status-filter").forEach(input => {
        input.addEventListener("change", applyFilters);
    });

    document.getElementById("dateFilter").addEventListener(
        "change",
        applyFilters
    );

    
    document.getElementById("resetFilters").addEventListener("click", () => {
        // Reset search
        document.getElementById("itemSearch").value = "";

        // Reset category filters
        document.querySelectorAll(".category-filter").forEach(input => {
            input.checked = false;
        });

        // Reset status filters to Lost and Found
        document.querySelectorAll(".status-filter").forEach(input => {
            input.checked = true;
        });

        // Reset date filter
        document.getElementById("dateFilter").value = "30";

        // Reset distance slider
        document.getElementById("distanceSlider").value = 10;
        document.getElementById("distanceValue").textContent = "10 km";

        // Clear the saved GPS location
        userLatitude = null;
        userLongitude = null;

        // Reset location status
        document.getElementById("locationStatus").textContent =
            "Enable location to filter nearby items.";

        // Apply all reset filters
        applyFilters();
    });


    document.getElementById("gridViewBtn").addEventListener("click", () => {
        currentView = "grid";
        updateViewButtons();
        renderItems();
    });

    document.getElementById("listViewBtn").addEventListener("click", () => {
        currentView = "list";
        updateViewButtons();
        renderItems();
    });

    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderItems();
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

        if (currentPage < totalPages) {
            currentPage++;
            renderItems();
        }
    });

    updateViewButtons();
}

function applyFilters() {
    const search = document.getElementById("itemSearch")
        .value.trim().toLowerCase();

    const selectedCategories = Array.from(
        document.querySelectorAll(".category-filter:checked")
    ).map(input => input.value.toLowerCase());

    const selectedStatuses = Array.from(
        document.querySelectorAll(".status-filter:checked")
    ).map(input => input.value);

    const dateRange = document.getElementById("dateFilter").value;

    const maxDistance = Number(
    document.getElementById("distanceSlider").value
    );

    const hasUserLocation =
        userLatitude !== null && userLongitude !== null;

    const now = new Date();
    const cutoff = dateRange === "all"
        ? null
        : new Date(now.getTime() - Number(dateRange) * 86400000);

    filteredItems = allItems.filter(item => {
        const searchableText = [
            item.item_name,
            item.brand,
            item.description,
            item.category,
            item.location,
            item.id
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(search);

        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(
                (item.category || "").toLowerCase()
            );

        const matchesStatus = selectedStatuses.includes(item.type);

        const reportDate = item.created_at
            ? new Date(item.created_at)
            : null;

        const matchesDate =
            !cutoff ||
            (reportDate && !Number.isNaN(reportDate.getTime()) &&
                reportDate >= cutoff);
        
        const hasReportCoordinates =
            item.latitude !== null &&
            item.latitude !== undefined &&
            item.longitude !== null &&
            item.longitude !== undefined;

        const matchesDistance =
            !hasUserLocation ||
            (
                hasReportCoordinates &&
                calculateDistance(
                    userLatitude,
                    userLongitude,
                    Number(item.latitude),
                    Number(item.longitude)
                ) <= maxDistance
            );

        return matchesSearch &&
            matchesCategory &&
            matchesStatus &&
            matchesDate&&
            matchesDistance;
    });

    currentPage = 1;
    renderItems();
}

function renderItems() {
    const container = document.getElementById("itemsContainer");
    const empty = document.getElementById("emptyResults");

    container.replaceChildren();
    container.classList.toggle("items-grid", currentView === "grid");
    container.classList.toggle("items-list", currentView === "list");

    const total = filteredItems.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredItems.slice(start, start + itemsPerPage);

    document.getElementById("resultsCount").textContent =
        `${total} item${total === 1 ? "" : "s"} found`;

    empty.hidden = total !== 0;

    pageItems.forEach(item => {
        container.appendChild(createItemCard(item));
    });

    document.getElementById("pageInfo").textContent =
        total === 0 ? "Page 0 of 0" : `Page ${currentPage} of ${totalPages}`;

    document.getElementById("prevPage").disabled = currentPage <= 1;
    document.getElementById("nextPage").disabled =
        totalPages === 0 || currentPage >= totalPages;
}

function createItemCard(item) {
    const card = document.createElement("article");
    card.className = "item-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "item-image-wrap";

    const image = document.createElement("img");
    image.className = "item-image";
    image.alt = item.item_name || "Reported item";
    image.loading = "lazy";

    if (item.image_url) {
        image.src = item.image_url;

        image.addEventListener("error", () => {
            image.removeAttribute("src");
            image.alt = "No image available";
            image.classList.add("no-image");
        }, { once: true });
    } else {
        image.alt = "No image available";
        image.classList.add("no-image");
    }

    imageWrap.appendChild(image);

    const typeBadge = document.createElement("span");
    typeBadge.className = `item-type ${item.type}`;
    typeBadge.textContent = item.type;
    imageWrap.appendChild(typeBadge);

    const content = document.createElement("div");
    content.className = "item-content";

    const category = document.createElement("span");
    category.className = "item-category";
    category.textContent = item.category || "General";

    const heading = document.createElement("h3");
    heading.textContent = item.item_name || "Unnamed item";

    const description = document.createElement("p");
    description.className = "item-description";
    description.textContent = item.description || "No description provided.";

    const meta = document.createElement("div");
    meta.className = "item-meta";

    const submittedBy = document.createElement("span");
    submittedBy.className = "item-submitted-by";
    submittedBy.textContent =
        `Submitted by: ${item.submitted_by || "Unknown user"}`;

    const location = document.createElement("span");
    location.textContent = `Location: ${item.location || "Not specified"}`;

    const date = document.createElement("span");
    date.textContent = `Date: ${formatDate(item.event_date || item.created_at)}`;

   meta.append(location, date, submittedBy);

    const footer = document.createElement("div");
    footer.className = "item-footer";

    const itemId = document.createElement("span");
    itemId.className = "item-id";
    itemId.textContent = `RPT-${item.id}`;

    const action = document.createElement("button");
    action.type = "button";
    action.className = "item-action";
    action.textContent = "View Details →";

   
    action.addEventListener("click", () => {
        window.location.href = `/reports/item/${item.id}/`;
    });


    footer.append(itemId, action);
    content.append(category, heading, description, meta, footer);
    card.append(imageWrap, content);

    return card;
}

function formatDate(value) {
    if (!value) return "Not specified";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not specified";
    }

    return date.toLocaleDateString();
}

function updateViewButtons() {
    document.getElementById("gridViewBtn")
        .classList.toggle("active", currentView === "grid");

    document.getElementById("listViewBtn")
        .classList.toggle("active", currentView === "list");
}
