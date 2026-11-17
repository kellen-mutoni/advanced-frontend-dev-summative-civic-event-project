function showFormError(message) {
  $("#form-error").text(message).removeClass("hidden");
}

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
      const message = xhr.responseJSON ? xhr.responseJSON.message : "Cannot reach the server. Check your connection and try again.";
      showFormError(message);
      button.prop("disabled", false).text("Log in");
    });
});