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

  apiRequest("POST", "/api/auth/login", { email, password })
    .done(function (response) {
      saveSession(response.data.token, response.data.user);
      window.location.href = response.data.user.role === "admin" ? "dashboard.html" : "events.html";
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
      button.prop("disabled", false).text("Log in");
    });
});