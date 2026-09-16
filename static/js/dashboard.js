document.addEventListener("DOMContentLoaded", async function () {

    // ================= USER AUTHENTICATION =================

    const accessToken =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    if (!accessToken) {
        window.location.href = "/login/";
        return;
    }

    try {

        const response = await authenticatedFetch(
            "/auth/me/",
            {
                method: "GET"
            }
        );

        if (!response) {
            return;
        }

        if (!response.ok) {

            if (response.status === 401) {
                localStorage.clear();
                sessionStorage.clear();

                window.location.href = "/login/";
                return;
            }

            throw new Error("Unable to load user information.");
        }

        const user = await response.json();

        console.log("Logged-in user:", user);


        /* =========================
        ADMIN REDIRECT
        ========================= */

        if (user.is_superuser) {

            window.location.href = "/admin-dashboard/";
            return;

        }


        const welcomeMessage =
            document.getElementById("welcomeMessage");

        const userName =
            document.getElementById("userName");

        const userAvatar =
            document.getElementById("userAvatar");

        if (user.full_name) {

            welcomeMessage.textContent =
                `Welcome back, ${user.full_name}!`;

            userName.textContent =
                user.full_name;

            userAvatar.textContent =
                user.full_name.charAt(0).toUpperCase();
        }

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }


    // ================= POTENTIAL MATCHES =================

    const matchCardContainer =
        document.getElementById("matchCardContainer");

    const prevMatchBtn =
        document.getElementById("prevMatchBtn");

    const nextMatchBtn =
        document.getElementById("nextMatchBtn");

    const matchDots =
        document.getElementById("matchDots");

    const noMatchesMessage =
        document.getElementById("noMatchesMessage");

    let matches = [];
    let currentMatchIndex = 0;


    async function loadMatches() {

        try {

            const response = await authenticatedFetch(
                "/reports/matches/",
                {
                    method: "GET"
                }
            );

            if (!response) {
                return;
            }

            if (!response.ok) {

                throw new Error(
                    "Unable to load potential matches."
                );
            }

            matches = await response.json();

            console.log(
                "Potential matches:",
                matches
            );

            if (matches.length === 0) {

                showNoMatches();

                return;
            }

            showMatches();

        } catch (error) {

            console.error(
                "Match loading error:",
                error
            );

            showNoMatches();
        }
    }


    function showNoMatches() {

        matchCardContainer.style.display = "none";
        prevMatchBtn.style.display = "none";
        nextMatchBtn.style.display = "none";
        matchDots.style.display = "none";

        noMatchesMessage.style.display = "block";
    }


    function showMatches() {

        matchCardContainer.style.display = "block";
        noMatchesMessage.style.display = "none";

        if (matches.length <= 1) {

            prevMatchBtn.style.display = "none";
            nextMatchBtn.style.display = "none";

        } else {

            prevMatchBtn.style.display = "flex";
            nextMatchBtn.style.display = "flex";
        }
        
        renderMatch();

        if (matches.length > 1) {
            matchDots.style.display = "flex";
            renderDots();
        } else {
            matchDots.style.display = "none";
        }
    }


    function renderMatch() {

        const match = matches[currentMatchIndex];

        const score = Number(match.match_score);

        let confidenceText = "Potential Match";

        if (score >= 90) {
            confidenceText = "HIGH CONFIDENCE MATCH";
        } else if (score >= 70) {
            confidenceText = "GOOD MATCH";
        }

        matchCardContainer.innerHTML = `
            <div class="dynamic-match-card">

                <div class="dynamic-match-top">

                    <span class="dynamic-match-badge">
                        ${confidenceText}
                    </span>

                    <span class="dynamic-match-score">
                        ${score}%
                    </span>

                </div>

                <h3>
                    Potential match for "${match.item_name}"
                </h3>

                <p>
                    A found report appears to match your lost item.
                </p>

                <div class="dynamic-match-details">

                    <span>
                        ◉ ${match.location}
                    </span>

                    <span>
                        ● ${match.event_date}
                    </span>

                    <span>
                        Report #${match.found_report_id}
                    </span>

                </div>

                <div class="dynamic-match-status">
                    Status: ${match.status}
                </div>

                <div class="dynamic-match-action">
                    <button
                        type="button"
                        class="view-match-btn"
                        onclick="openClaimPage(${match.id})"
                    >
                        View & Verify Match
                        <span>→</span>
                    </button>
                </div>

            </div>
        `;

        updateDots();
    }


    function renderDots() {

        matchDots.innerHTML = "";

        matches.forEach(function (match, index) {

            const dot =
                document.createElement("span");

            dot.className = "match-dot";

            if (index === currentMatchIndex) {
                dot.classList.add("active");
            }

            matchDots.appendChild(dot);
        });
    }


    function updateDots() {

        const dots =
            matchDots.querySelectorAll(".match-dot");

        dots.forEach(function (dot, index) {

            dot.classList.toggle(
                "active",
                index === currentMatchIndex
            );
        });
    }


    // ================= SLIDER CONTROLS =================

    if (prevMatchBtn) {

        prevMatchBtn.addEventListener(
            "click",
            function () {

                if (matches.length === 0) {
                    return;
                }

                currentMatchIndex--;

                if (currentMatchIndex < 0) {
                    currentMatchIndex =
                        matches.length - 1;
                }

                renderMatch();
            }
        );
    }


    if (nextMatchBtn) {

        nextMatchBtn.addEventListener(
            "click",
            function () {

                if (matches.length === 0) {
                    return;
                }

                currentMatchIndex++;

                if (
                    currentMatchIndex >=
                    matches.length
                ) {
                    currentMatchIndex = 0;
                }

                renderMatch();
            }
        );
    }


    // Load potential matches
    loadMatches();

});


// ================= LOGOUT =================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const logoutBtn =
            document.getElementById("logoutBtn");

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    logout();
                }
            );
        }

    }
);

function openClaimPage(matchId) {
    window.location.href =
        `/claims/page/?match_id=${matchId}`;
}