document.addEventListener("DOMContentLoaded", async function () {

    const accessToken =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

    if (!accessToken) {
        window.location.href = "/login/";
        return;
    }

    try {

        const response = await fetch(
            "/auth/me/",
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );

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

});