requireLogin();

function fillProfile(u) {
  $("#full_name").val(u.full_name);
  $("#email").val(u.email);
  $("#role").text(u.role);
  $("#status").text(u.is_active ? "Active" : "Disabled");
  $("#member-since").text(formatDate(u.created_at));
}

function loadProfile() {
  $("#load-error").addClass("hidden");

  apiRequest("GET", "/api/users/profile/me")
    .done(function (res) {
      fillProfile(res.data);
    })
    .fail(function (xhr) {
      $("#error-text").text(errorMessage(xhr));
      $("#load-error").removeClass("hidden");
    });
}

$("#profile-form").on("submit", function (e) {
  e.preventDefault();
  $("#form-error").addClass("hidden");

  const fullName = $("#full_name").val().trim();
  const email = $("#email").val().trim();

  if (!fullName || !email) {
    showFormError("Please fill in your name and email.");
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showFormError("Please enter a valid email address.");
    return;
  }

  const button = $("#save-btn").prop("disabled", true).text("Saving...");

  apiRequest("PATCH", "/api/users/profile/me", { full_name: fullName, email })
    .done(function (res) {
      // Keep the saved user in step with the new name so the navbar shows it, the role stays as it was
      saveSession(getToken(), { id: getUser().id, full_name: res.data.full_name, role: getUser().role });
      $("#user-name").text(res.data.full_name);
      fillProfile(res.data);
      showToast("Profile updated successfully.");
    })
    .fail(function (xhr) {
      // A 409 means another account already uses this email, the backend message says so
      showFormError(errorMessage(xhr));
    })
    .always(function () {
      button.prop("disabled", false).text("Save changes");
    });
});

$("#retry-btn").on("click", loadProfile);

loadProfile();