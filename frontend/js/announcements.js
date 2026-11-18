requireLogin();

const isAdmin = getUser().role === "admin";

function showSkeletons() {
  let html = "";
  for (let i = 0; i < 3; i++) {
    html += '<li class="h-28 animate-pulse bg-neutral-800" aria-hidden="true"></li>';
  }
  $("#announcements-list").attr("aria-busy", "true").html(html);
}

function showDuration(url, element) {
  const audio = new Audio();
  audio.preload = "metadata";
  audio.addEventListener("loadedmetadata", function () {
    const minutes = Math.floor(audio.duration / 60);
    const seconds = String(Math.floor(audio.duration % 60)).padStart(2, "0");
    element.text(`Length: ${minutes}:${seconds}`);
  });
  audio.addEventListener("error", function () {
    element.text("Length: unavailable");
  });
  audio.src = url;
}

function rowHtml(a) {
  const title = escapeHtml(a.title);
  const draft = a.published ? "" : `<span class="ml-2 bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">Unpublished</span>`;
  const publishLabel = a.published ? "Unpublish" : "Publish";

  let actions = `<a href="announcement-detail.html?id=${a.id}" aria-label="Play ${title}" class="bg-brand-dark px-4 py-2 text-sm font-bold uppercase text-white"><span aria-hidden="true">▶</span> Play</a>`;

  // Role guard: only admins get the edit, publish and delete controls
  if (isAdmin) {
    actions += `<a href="announcement-form.html?id=${a.id}" aria-label="Edit ${title}" class="border border-gray-500 px-4 py-2 text-sm uppercase text-white">Edit</a>`;
    actions += `<button type="button" class="toggle-btn border border-gray-500 px-4 py-2 text-sm uppercase text-white" data-id="${a.id}" data-published="${a.published}" aria-label="${publishLabel} ${title}">${publishLabel}</button>`;
    actions += `<button type="button" class="delete-btn border border-red-400 px-4 py-2 text-sm uppercase text-red-300" data-id="${a.id}" data-title="${title}" aria-label="Delete ${title}">Delete</button>`;
  }

  return `
    <li class="flex flex-wrap items-center justify-between gap-4 bg-neutral-900 p-4">
      <article>
        <h2 class="font-heading text-xl uppercase">${title}${draft}</h2>
        <p class="mt-1 text-sm text-gray-300"><span class="duration" data-audio="${escapeHtml(a.audio_url)}">Length: ...</span> &middot; <time datetime="${a.created_at}">${formatDate(a.created_at)}</time></p>
      </article>
      <p class="flex flex-wrap gap-3">${actions}</p>
    </li>`;
}

function loadAnnouncements() {
  $("#load-error").addClass("hidden");
  $("#empty-state").addClass("hidden");
  showSkeletons();

  apiRequest("GET", "/api/announcements")
    .done(function (res) {
      // The backend also sends unpublished ones, so normal users only keep the published ones
      const list = isAdmin ? res.data : res.data.filter(function (a) { return a.published; });
      $("#announcements-list").attr("aria-busy", "false").html(list.map(rowHtml).join(""));
      $("#empty-state").toggleClass("hidden", list.length > 0);

      $(".duration").each(function () {
        showDuration($(this).attr("data-audio"), $(this));
      });
    })
    .fail(function (xhr) {
      $("#announcements-list").attr("aria-busy", "false").empty();
      $("#error-text").text(errorMessage(xhr));
      $("#load-error").removeClass("hidden");
    });
}

$("#announcements-list").on("click", ".toggle-btn", function () {
  const button = $(this).prop("disabled", true);
  const publish = button.attr("data-published") !== "true";
  const action = publish ? "publish" : "unpublish";

  apiRequest("PATCH", "/api/announcements/" + button.attr("data-id") + "/" + action)
    .done(function () {
      showToast(publish ? "Announcement published." : "Announcement unpublished.");
      loadAnnouncements();
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
      button.prop("disabled", false);
    });
});

$("#announcements-list").on("click", ".delete-btn", function () {
  const title = $(this).attr("data-title");
  if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

  apiRequest("DELETE", "/api/announcements/" + $(this).attr("data-id"))
    .done(function () {
      showToast("Announcement deleted.");
      loadAnnouncements();
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
    });
});

$("#retry-btn").on("click", loadAnnouncements);

// Role guard: the New announcement button is only shown to admins
if (isAdmin) {
  $("#create-link").removeClass("hidden");
}

loadAnnouncements();