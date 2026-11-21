function passwordScore(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[\W_]/.test(password)) score++;
  return score;
}

$("#password").on("input", function () {
  const score = passwordScore($(this).val());
  const words = ["", "Weak", "Fair", "Good", "Strong"];
  $("#strength-bar").val(score);
  $("#strength-text").text(words[score]);
});

$("#signup-form").on("submit", function (e) {
  e.preventDefault();
  $("#form-error").addClass("hidden");

  const full_name = $("#full_name").val().trim();
  const email = $("#email").val().trim();
  const password = $("#password").val();
  const confirm = $("#confirm_password").val();

  if (!full_name || !email || !password) {
    showFormError("Please fill in all fields.");
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showFormError("Please enter a valid email address.");
    return;
  }
  if (passwordScore(password) < 4) {
    showFormError("Your password does not meet all the rules.");
    return;
  }
  if (password !== confirm) {
    showFormError("The passwords do not match.");
    return;
  }

  const button = $(this).find("button[type=submit]").prop("disabled", true).text("Creating account...");

  apiRequest("POST", "/api/auth/signup", { full_name, email, password })
    .done(function () {
      sessionStorage.setItem("toast", "Account created! Please log in.");
      window.location.href = "login.html";
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
      button.prop("disabled", false).text("Sign up");
    });
});