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


    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;

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


        const data = await response.json();


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

            }

            throw new Error(errorMessage);
        }


        /* =========================
           LOGIN SUCCESSFUL
        ========================== */

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


        loginMessage.textContent =
            "Login successful!";

        loginMessage.style.color =
            "#00a99d";


        /*
         * Dashboard is not built yet,
         * so don't redirect yet.
         */

    } catch (error) {

        loginMessage.textContent =
            error.message;

        loginMessage.style.color =
            "#dc2626";

    } finally {

        loginButton.disabled = false;

        loginButton.querySelector("span").textContent =
            "Sign In to Dashboard";
    }

});