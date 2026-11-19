// Role guard: only admins can open the admin panel
requireAdmin();

function loadNotifications() {
  apiRequest("GET", "/api/notifications")
    .done(function (res) {
      const options = res.data.map(function (n) {
        return `<option value="${n.id}">${escapeHtml(n.title)} (${formatDate(n.created_at)})</option>`;
      }).join("");
      $("#notification-select").html('<option value="">Choose a notification</option>' + options);
      $("#delete-btn").prop("disabled", res.data.length === 0);
    })
    .fail(function (xhr) {
      $("#notification-select").html('<option value="">Could not load notifications</option>');
      showFormError(errorMessage(xhr));
    });
}

$("#delete-form").on("submit", function (e) {
  e.preventDefault();
  $("#form-error").addClass("hidden");

  const select = $("#notification-select");
  const id = select.val();
  if (!id) {
    showFormError("Please choose a notification to delete.");
    return;
  }
  if (!window.confirm("Delete this notification? This cannot be undone.")) return;

  apiRequest("DELETE", "/api/notifications/" + id)
    .done(function () {
      showToast("Notification deleted.");
      loadNotifications();
      refreshBell();
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
    });
});

loadNotifications();