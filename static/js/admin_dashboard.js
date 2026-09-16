document.addEventListener("DOMContentLoaded", function () {

    const logoutBtn =
        document.getElementById("adminLogoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                logout();
            }
        );
    }

});