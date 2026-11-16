$(function () {
  $("body").append('<div id="toast-box" class="fixed right-4 top-4 z-50 space-y-2" aria-live="polite"></div>');

  // A message saved before a redirect is shown here, on the next page
  const saved = sessionStorage.getItem("toast");
  if (saved) {
    showToast(saved);
    sessionStorage.removeItem("toast");
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