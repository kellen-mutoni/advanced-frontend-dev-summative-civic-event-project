$("#login-form").on("submit", function (e) {
  e.preventDefault();
  $("#form-error").addClass("hidden");

  const email = $("#email").val().trim();
  const password = $("#password").val();

  if (!email || !password) {
    showFormError("Please enter your email and password.");
    return;
  }

  const button = $(this).find("button[type=submit]").prop("disabled", true).text("Logging in...");

  function stopLogin(message) {
    clearSession();
    showFormError(message);
    button.prop("disabled", false).text("Log in");
  }

  apiRequest("POST", "/api/auth/login", { email, password })
    .done(function (response) {
      saveSession(response.data.token, response.data.user);

      // The backend still lets disabled users log in, so we check the account status ourselves
      apiRequest("GET", "/api/users/profile/me")
        .done(function (me) {
          if (!me.data.is_active) {
            stopLogin("Your account has been disabled. Please contact an admin.");
            return;
          }
          window.location.href = response.data.user.role === "admin" ? "dashboard.html" : "events.html";
        })
        .fail(function (xhr) {
          stopLogin(errorMessage(xhr));
        });
    })
    .fail(function (xhr) {
      stopLogin(errorMessage(xhr));
    });
});