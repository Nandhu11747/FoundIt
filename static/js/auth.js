function getAccessToken() {

    return (
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token")
    );

}


function getRefreshToken() {

    return (
        localStorage.getItem("refresh_token") ||
        sessionStorage.getItem("refresh_token")
    );

}


function saveTokens(accessToken, refreshToken = null) {

    if (localStorage.getItem("access_token")) {

        localStorage.setItem(
            "access_token",
            accessToken
        );

        if (refreshToken) {

            localStorage.setItem(
                "refresh_token",
                refreshToken
            );

        }

    } else {

        sessionStorage.setItem(
            "access_token",
            accessToken
        );

        if (refreshToken) {

            sessionStorage.setItem(
                "refresh_token",
                refreshToken
            );

        }

    }

}


async function refreshAccessToken() {

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        return false;
    }


    try {

        const response = await fetch(
            "/auth/token/refresh/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    refresh: refreshToken
                })
            }
        );


        if (!response.ok) {

            return false;

        }


        const data = await response.json();


        if (!data.access) {

            return false;

        }


        saveTokens(
            data.access,
            data.refresh || null
        );


        return true;

    } catch (error) {

        console.error(
            "Token refresh error:",
            error
        );

        return false;

    }

}


async function authenticatedFetch(
    url,
    options = {}
) {

    let token = getAccessToken();


    if (!token) {

        window.location.href = "/login/";

        return null;

    }


    options.headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };


    let response = await fetch(
        url,
        options
    );


    /*
     * Access token expired.
     * Try refreshing it once.
     */

    if (response.status === 401) {

        const refreshed =
            await refreshAccessToken();


        if (!refreshed) {

            localStorage.clear();
            sessionStorage.clear();

            window.location.href =
                "/login/";

            return null;

        }


        token = getAccessToken();


        options.headers = {
            ...(options.headers || {}),
            "Authorization": `Bearer ${token}`
        };


        response = await fetch(
            url,
            options
        );

    }


    return response;

}

async function requireAuthentication() {

    const token = getAccessToken();

    if (!token) {
        window.location.href = "/login/";
        return null;
    }

    const response = await authenticatedFetch(
        "/auth/me/",
        {
            method: "GET"
        }
    );

    if (!response || !response.ok) {
        localStorage.clear();
        sessionStorage.clear();

        window.location.href = "/login/";
        return null;
    }
    const user = await response.json();
    
    return user;
}

function logout() {
    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/login/";
}