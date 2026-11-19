requireLogin();

const notificationId = new URLSearchParams(window.location.search).get("id");

if (!notificationId) {
  window.location.replace("notifications.html");
}

function relatedLink(metadata) {
  if (!metadata) return null;
  if (metadata.event_id) return { href: "event-detail.html?id=" + metadata.event_id, label: "View the event" };
  if (metadata.announcement_id) return { href: "announcement-detail.html?id=" + metadata.announcement_id, label: "Listen to the announcement" };
  if (metadata.promo_id) return { href: "promo-detail.html?id=" + metadata.promo_id, label: "Watch the promo" };
  return null;
}

function showLoadError(message) {
  $("#skeleton").addClass("hidden");
  $("#error-text").text(message);
  $("#load-error").removeClass("hidden");
}

function showNotification(n) {
  document.title = n.title + " | CivicEvents";
  $("#title").text(n.title);
  $("#type").text(n.type || "notification");
  $("#created").text(formatDate(n.created_at)).attr("datetime", n.created_at);
  $("#message").text(n.message);

  const link = relatedLink(n.metadata);
  if (link) {
    $("#related-link").attr("href", link.href).text(link.label).removeClass("hidden");
  }

  markAsRead([n.id]);
  $("#skeleton").addClass("hidden");
  $("#notification").removeClass("hidden");
}

function loadNotification() {
  $("#load-error").addClass("hidden");
  $("#notification").addClass("hidden");
  $("#skeleton").removeClass("hidden");

  apiRequest("GET", "/api/notifications/" + notificationId)
    .done(function (res) {
      showNotification(res.data);
    })
    .fail(function (xhr) {
      showLoadError(xhr.status === 404 ? "This notification could not be found." : errorMessage(xhr));
    });
}

$("#retry-btn").on("click", loadNotification);

loadNotification();