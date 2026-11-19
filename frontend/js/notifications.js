requireLogin();

const isAdmin = getUser().role === "admin";
let notifications = [];

function showSkeletons() {
  let html = "";
  for (let i = 0; i < 4; i++) {
    html += '<li class="h-24 animate-pulse bg-neutral-800" aria-hidden="true"></li>';
  }
  $("#notifications-list").attr("aria-busy", "true").html(html);
}

function rowHtml(n) {
  const title = escapeHtml(n.title);
  const isUnread = !getReadIds().includes(n.id);
  const dot = isUnread ? '<span class="mr-2 inline-block h-2 w-2 rounded-full bg-brand" aria-hidden="true"></span><span class="sr-only">Unread: </span>' : "";

  // Role guard: only admins get a Delete button
  const deleteButton = isAdmin
    ? `<button type="button" class="delete-btn shrink-0 border border-red-400 px-3 py-1 text-sm uppercase text-red-300" data-id="${n.id}" data-title="${title}" aria-label="Delete ${title}">Delete</button>`
    : "";

  return `
    <li class="flex items-start justify-between gap-4 bg-neutral-900 p-4">
      <article>
        <h2 class="font-heading text-lg uppercase">${dot}<a href="notification-detail.html?id=${n.id}" class="hover:text-brand">${title}</a></h2>
        <p class="mt-1 text-sm text-gray-300">${escapeHtml(n.message)}</p>
        <p class="mt-2 text-xs capitalize text-gray-400">${escapeHtml(n.type)} &middot; <time datetime="${n.created_at}">${formatDate(n.created_at)}</time></p>
      </article>
      ${deleteButton}
    </li>`;
}

function drawList() {
  $("#notifications-list").attr("aria-busy", "false").html(notifications.map(rowHtml).join(""));
  $("#empty-state").toggleClass("hidden", notifications.length > 0);
  $("#mark-all-btn").toggleClass("hidden", notifications.length === 0);
}

function loadNotifications() {
  $("#load-error").addClass("hidden");
  $("#empty-state").addClass("hidden");
  showSkeletons();

  apiRequest("GET", "/api/notifications")
    .done(function (res) {
      notifications = res.data;
      drawList();
    })
    .fail(function (xhr) {
      $("#notifications-list").attr("aria-busy", "false").empty();
      $("#error-text").text(errorMessage(xhr));
      $("#load-error").removeClass("hidden");
    });
}

$("#mark-all-btn").on("click", function () {
  markAsRead(notifications.map(function (n) { return n.id; }));
  drawList();
  showToast("All notifications marked as read.");
});

$("#notifications-list").on("click", ".delete-btn", function () {
  const id = $(this).attr("data-id");
  const title = $(this).attr("data-title");
  if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

  apiRequest("DELETE", "/api/notifications/" + id)
    .done(function () {
      notifications = notifications.filter(function (n) { return n.id !== id; });
      drawList();
      refreshBell();
      showToast("Notification deleted.");
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
    });
});

$("#retry-btn").on("click", loadNotifications);

loadNotifications();