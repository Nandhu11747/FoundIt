const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

const loginButton = document.getElementById("loginButton");


/* =========================
   SHOW / HIDE PASSWORD
========================= */

togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.setAttribute(
            "aria-label",
            "Hide password"
        );

    } else {

        passwordInput.type = "password";

        togglePassword.setAttribute(
            "aria-label",
            "Show password"
        );
    }

});


/* =========================
   LOGIN FORM
========================= */

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const email =
        document.getElementById("email").value.trim();

    const password =
        passwordInput.value;

    const rememberMe =
        document.getElementById("rememberMe").checked;


    /* Clear previous message */

    loginMessage.textContent = "";
    loginMessage.style.color = "";


    /* Disable button */

    loginButton.disabled = true;

    loginButton.querySelector("span").textContent =
        "Signing in...";


    try {

        const response = await fetch(
            "/auth/login/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data =
            await response.json();


        /* =========================
           LOGIN FAILED
        ========================== */

        if (!response.ok) {

            let errorMessage =
                "Invalid email or password.";

            if (data.non_field_errors) {

                errorMessage =
                    data.non_field_errors[0];

            } else if (data.detail) {

                errorMessage =
                    data.detail;

            } else if (data.email) {

                errorMessage =
                    data.email[0];

            } else if (data.password) {

                errorMessage =
                    data.password[0];

            } else if (data.error) {

                errorMessage =
                    data.error;

            }

            throw new Error(errorMessage);
        }


        /* =========================
           LOGIN SUCCESSFUL
        ========================== */

        /* =========================
            CLEAR PREVIOUS LOGIN
        ========================= */

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");

        if (rememberMe) {

            localStorage.setItem(
                "access_token",
                data.access
            );

            localStorage.setItem(
                "refresh_token",
                data.refresh
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

        } else {

            sessionStorage.setItem(
                "access_token",
                data.access
            );

            sessionStorage.setItem(
                "refresh_token",
                data.refresh
            );

            sessionStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );
        }

        if (data.user.is_superuser) {

            window.location.href =
                "/admin-dashboard/";

        } else {

            window.location.href =
                "/dashboard/";
        }
    }


    /* =========================
       LOGIN ERROR
    ========================== */

    catch (error) {

        loginMessage.textContent =
            error.message;

        loginMessage.style.color =
            "#dc2626";
    }


    /* =========================
       ENABLE BUTTON
    ========================== */

    finally {

        loginButton.disabled = false;

        loginButton.querySelector("span").textContent =
            "Sign In to Dashboard";
    }

});