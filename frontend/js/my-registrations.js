requireLogin();

function showSkeletons() {
  let html = "";
  for (let i = 0; i < 3; i++) {
    html += '<li class="h-28 animate-pulse bg-neutral-800" aria-hidden="true"></li>';
  }
  $("#registrations-list").attr("aria-busy", "true").html(html);
}

function rowHtml(r) {
  const title = escapeHtml(r.title);
  return `
    <li class="flex flex-wrap items-center justify-between gap-4 bg-neutral-900 p-4">
      <article>
        <h2 class="font-heading text-xl uppercase">${title}</h2>
        <p class="mt-1 text-sm text-brand"><time datetime="${r.starts_at}">${formatDate(r.starts_at)}</time></p>
        <p class="mt-1 text-sm text-gray-300">${escapeHtml(r.location || "Location to be announced")}</p>
      </article>
      <p class="flex gap-3">
        <a href="event-detail.html?id=${r.event_id}" aria-label="View details of ${title}" class="bg-brand-dark px-4 py-2 text-sm font-bold uppercase text-white">View</a>
        <button type="button" class="cancel-btn border border-gray-500 px-4 py-2 text-sm uppercase text-white" data-id="${r.event_id}" data-title="${title}" aria-label="Cancel registration for ${title}">Cancel registration</button>
      </p>
    </li>`;
}

function loadRegistrations() {
  $("#load-error").addClass("hidden");
  $("#empty-state").addClass("hidden");
  showSkeletons();

  apiRequest("GET", "/api/event-registrations/my-registrations")
    .done(function (res) {
      // The backend also returns cancelled registrations, so we keep only the active ones
      const active = res.data.filter(function (r) { return r.status === "registered"; });
      $("#registrations-list").attr("aria-busy", "false").html(active.map(rowHtml).join(""));
      $("#empty-state").toggleClass("hidden", active.length > 0);
    })
    .fail(function (xhr) {
      $("#registrations-list").attr("aria-busy", "false").empty();
      $("#error-text").text(errorMessage(xhr));
      $("#load-error").removeClass("hidden");
    });
}

$("#registrations-list").on("click", ".cancel-btn", function () {
  const title = $(this).attr("data-title");
  if (!window.confirm(`Cancel your registration for "${title}"?`)) return;
  const button = $(this).prop("disabled", true).text("Cancelling...");

  apiRequest("POST", "/api/event-registrations/cancel", { event_id: button.attr("data-id") })
    .done(function () {
      showToast("Your registration was cancelled.");
      loadRegistrations();
      $("h1").trigger("focus");
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
      button.prop("disabled", false).text("Cancel registration");
    });
});

$("#retry-btn").on("click", loadRegistrations);

loadRegistrations();