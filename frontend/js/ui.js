$(function () {
  $("body").append('<div id="toast-box" class="fixed right-4 top-4 z-50 space-y-2" aria-live="polite"></div>');

  // A message saved before a redirect is shown here, on the next page
  const saved = sessionStorage.getItem("toast");
  if (saved) {
        showToast(saved, sessionStorage.getItem("toast-type") || "success");
    sessionStorage.removeItem("toast");
    sessionStorage.removeItem("toast-type");
  }
});

function showToast(message, type = "success") {
  const color = type === "success" ? "bg-green-700" : "bg-red-700";
  const toast = $('<div class="px-4 py-3 text-white shadow-lg"></div>').addClass(color).text(message);
  $("#toast-box").append(toast);
  setTimeout(function () {
    toast.remove();
  }, 4000);
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}

function formatDate(isoString) {
  if (!isoString) return "Date to be announced";
  return new Date(isoString).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function errorMessage(xhr) {
  if (xhr.status === 403) return "You do not have permission to do this. Please contact an admin.";
  if (xhr.responseJSON && xhr.responseJSON.message) return xhr.responseJSON.message;
  return "Cannot reach the server. Check your connection and try again.";
}

function showFormError(message) {
  $("#form-error").text(message).removeClass("hidden");
}

function readKey() {
  return "read-notifications-" + getUser().id;
}

function getReadIds() {
  return JSON.parse(localStorage.getItem(readKey()) || "[]");
}

function markAsRead(ids) {
  const all = getReadIds();
  ids.forEach(function (id) {
    if (!all.includes(id)) all.push(id);
  });
  localStorage.setItem(readKey(), JSON.stringify(all));
  refreshBell();
}

function refreshBell() {
  if (!getUser() || $("#notif-count").length === 0) return;

  apiRequest("GET", "/api/notifications").done(function (res) {
    const read = getReadIds();
    const unread = res.data.filter(function (n) { return !read.includes(n.id); }).length;
    $("#notif-count").text(unread > 0 ? "(" + unread + ")" : "");
  });
}

$(function () {
  refreshBell();
});