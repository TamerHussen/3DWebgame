document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.querySelector("#registerForm");
    const loginForm = document.querySelector("#loginForm");

    const showError = (element, message) => {
        alert(message);
        element.focus();
    };

    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            const Email = document.querySelector("#email");
            const Username = document.querySelector("#username");
            const Password = document.querySelector("#password");

            if (!Email.value.trim()) {
                e.preventDefault();
                showError(Email, "Email is required.");
            } else if (!Username.value.trim()) {
                e.preventDefault();
                showError(Username, "Username is required.");
            } else if (!Password.value.trim()) {
                e.preventDefault();
                showError(Password, "Password is required.");
            } else if (Password.value.length < 6) {
                e.preventDefault();
                showError(Password, "Password must be at least 6 characters long.");
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            const Username = document.querySelector("#loginUsername");
            const Password = document.querySelector("#loginPassword");

            if (!Username.value.trim()) {
                e.preventDefault();
                showError(Username, "Username is required.");
            } else if (!Password.value.trim()) {
                e.preventDefault();
                showError(Password, "Password is required.");
            }
        });
    }
});
