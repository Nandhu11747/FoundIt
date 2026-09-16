const signupForm = document.getElementById("signupForm");

const signupMessage =
    document.getElementById("signupMessage");

const otpModal =
    document.getElementById("otpModal");

const closeOtp =
    document.getElementById("closeOtp");

const verifyOtpBtn =
    document.getElementById("verifyOtpBtn");

const otpMessage =
    document.getElementById("otpMessage");

const resendOtp =
    document.getElementById("resendOtp");

const otpInputs =
    document.querySelectorAll(".otp-input");



let verificationEmail = "";




signupForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const fullName =
            document.getElementById("fullName").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;


        signupMessage.textContent = "";

        const button =
            signupForm.querySelector(
                ".create-account-btn"
            );

        button.disabled = true;

        button.querySelector("span").textContent =
            "Creating account...";


        try {

            const response = await fetch(
                "/auth/register/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        full_name: fullName,
                        phone: phone,
                        email: email,
                        password: password
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                let message =
                    "Unable to create account.";

                if (data.email) {
                    message = data.email[0];
                }

                else if (data.phone) {
                    message = data.phone[0];
                }

                else if (data.full_name) {
                    message = data.full_name[0];
                }

                else if (data.detail) {
                    message = data.detail;
                }

                throw new Error(message);
            }



            verificationEmail = email;


           
            otpModal.style.display = "flex";


           

            otpInputs.forEach(function (input) {
                input.value = "";
            });


            otpMessage.textContent = "";


           
            otpInputs[0].focus();


        }

        catch (error) {

            signupMessage.textContent =
                error.message;

            signupMessage.style.color =
                "#dc2626";

        }

        finally {

            button.disabled = false;

            button.querySelector("span").textContent =
                "Create Account";
        }

    }
);




otpInputs.forEach(
    function (input, index) {

        input.addEventListener(
            "input",
            function () {

                

                this.value =
                    this.value.replace(
                        /[^0-9]/g,
                        ""
                    );


                
                if (
                    this.value &&
                    index < otpInputs.length - 1
                ) {

                    otpInputs[index + 1].focus();
                }

            }
        );


        input.addEventListener(
            "keydown",
            function (event) {


                if (
                    event.key === "Backspace" &&
                    !this.value &&
                    index > 0
                ) {

                    otpInputs[index - 1].focus();
                }

            }
        );

    }
);



verifyOtpBtn.addEventListener(
    "click",
    async function () {


        let otp = "";


        otpInputs.forEach(
            function (input) {

                otp += input.value;

            }
        );


        if (otp.length !== 6) {

            otpMessage.textContent =
                "Please enter the 6-digit OTP.";

            otpMessage.style.color =
                "#dc2626";

            return;
        }


        verifyOtpBtn.disabled = true;

        verifyOtpBtn.textContent =
            "Verifying...";

        otpMessage.textContent = "";


        try {

            const response = await fetch(
                "/auth/verify-otp/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: verificationEmail,
                        otp: otp
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Invalid OTP."
                );
            }


            otpMessage.textContent =
                "Email verified successfully!";

            otpMessage.style.color =
                "#00a99d";


            setTimeout(
                function () {

                    window.location.href =
                        "/login/";

                },
                1000
            );

        }

        catch (error) {

            otpMessage.textContent =
                error.message;

            otpMessage.style.color =
                "#dc2626";

        }

        finally {

            verifyOtpBtn.disabled = false;

            verifyOtpBtn.textContent =
                "Verify OTP";
        }

    }
);




closeOtp.addEventListener(
    "click",
    function () {

        otpModal.style.display = "none";

    }
);

resendOtp.addEventListener(
    "click",
    async function () {

        if (!verificationEmail) {
            otpMessage.textContent =
                "Email not found. Please register again.";

            otpMessage.style.color =
                "#dc2626";

            return;
        }

        resendOtp.disabled = true;

        resendOtp.textContent =
            "Sending...";

        otpMessage.textContent = "";

        try {

            const response = await fetch(
                "/auth/resend-otp/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: verificationEmail
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Unable to resend OTP."
                );
            }

            otpInputs.forEach(function (input) {
                input.value = "";
            });

            otpInputs[0].focus();

            otpMessage.textContent =
                "A new OTP has been sent.";

            otpMessage.style.color =
                "#00a99d";

        }

        catch (error) {

            otpMessage.textContent =
                error.message;

            otpMessage.style.color =
                "#dc2626";

        }

        finally {

            resendOtp.disabled = false;

            resendOtp.textContent =
                "Resend OTP";
        }

    }
);


otpModal.addEventListener(
    "click",
    function (event) {

        if (event.target === otpModal) {

            otpModal.style.display = "none";

        }

    }
);