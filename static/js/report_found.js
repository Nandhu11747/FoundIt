document.addEventListener("DOMContentLoaded", async function () {

    const authenticated = await requireAuthentication();

    if (!authenticated) {
        return;
    }

    const nextButton = document.getElementById("foundNextStepBtn");

    if (nextButton) {
        nextButton.addEventListener("click", function () {
            console.log("Found report: moving to next step");
        });
    }

});