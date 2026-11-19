requireLogin();

const isAdmin = getUser().role === "admin";
const CACHE_KEY = "promos-cache";
const CACHE_MINUTES = 2;

const lazyVideos = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src + "#t=0.1";
      entry.target.preload = "metadata";
      lazyVideos.unobserve(entry.target);
    }
  });
}, { rootMargin: "200px" });

function showSkeletons() {
  let html = "";
  for (let i = 0; i < 6; i++) {
    html += '<li class="h-72 animate-pulse bg-neutral-800" aria-hidden="true"></li>';
  }
  $("#promos-list").attr("aria-busy", "true").html(html);
}

function readCache() {
  const saved = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
  if (saved && Date.now() - saved.time < CACHE_MINUTES * 60 * 1000) {
    return saved.data;
  }
  return null;
}

function clearCache() {
  sessionStorage.removeItem(CACHE_KEY);
}

function cardHtml(p) {
  const title = escapeHtml(p.title);
  const draft = p.published ? "" : `<span class="ml-2 bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">Unpublished</span>`;
  const publishLabel = p.published ? "Unpublish" : "Publish";

  let actions = `<a href="promo-detail.html?id=${p.id}" aria-label="Watch ${title}" class="bg-brand-dark px-4 py-2 text-sm font-bold uppercase text-white"><span aria-hidden="true">▶</span> Play</a>`;

  // Role guard: only admins get the edit, publish and delete controls
  if (isAdmin) {
    actions += `<a href="promo-form.html?id=${p.id}" aria-label="Edit ${title}" class="border border-gray-500 px-4 py-2 text-sm uppercase text-white">Edit</a>`;
    actions += `<button type="button" class="toggle-btn border border-gray-500 px-4 py-2 text-sm uppercase text-white" data-id="${p.id}" data-published="${p.published}" aria-label="${publishLabel} ${title}">${publishLabel}</button>`;
    actions += `<button type="button" class="delete-btn border border-red-400 px-4 py-2 text-sm uppercase text-red-300" data-id="${p.id}" data-title="${title}" aria-label="Delete ${title}">Delete</button>`;
  }

  return `
    <li>
      <article class="flex h-full flex-col bg-neutral-900">
        <video class="thumb h-44 w-full bg-neutral-800 object-cover" data-src="${escapeHtml(p.video_url)}" muted playsinline preload="none" aria-hidden="true" tabindex="-1"></video>
        <h2 class="mt-4 px-4 font-heading text-xl uppercase">${title}${draft}</h2>
        <p class="mt-2 line-clamp-2 px-4 text-sm text-gray-300">${escapeHtml(p.description)}</p>
        <footer class="mt-auto flex flex-wrap gap-3 p-4">${actions}</footer>
      </article>
    </li>`;
}

function drawPromos(all) {
  // The backend also sends unpublished promos, so normal users only keep the published ones
  const list = isAdmin ? all : all.filter(function (p) { return p.published; });
  $("#promos-list").attr("aria-busy", "false").html(list.map(cardHtml).join(""));
  $("#empty-state").toggleClass("hidden", list.length > 0);
  $(".thumb").each(function () {
    lazyVideos.observe(this);
  });
}

function loadPromos() {
  $("#load-error").addClass("hidden");
  $("#empty-state").addClass("hidden");

  const cached = readCache();
  if (cached) {
    drawPromos(cached);
    return;
  }

  showSkeletons();
  apiRequest("GET", "/api/promos?limit=100")
    .done(function (res) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: res.data }));
      drawPromos(res.data);
    })
    .fail(function (xhr) {
      $("#promos-list").attr("aria-busy", "false").empty();
      $("#error-text").text(errorMessage(xhr));
      $("#load-error").removeClass("hidden");
    });
}

$("#promos-list").on("click", ".toggle-btn", function () {
  const button = $(this).prop("disabled", true);
  const publish = button.attr("data-published") !== "true";

  apiRequest("PATCH", "/api/promos/" + button.attr("data-id") + "/" + (publish ? "publish" : "unpublish"))
    .done(function () {
      clearCache();
      showToast(publish ? "Promo published." : "Promo unpublished.");
      loadPromos();
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
      button.prop("disabled", false);
    });
});

$("#promos-list").on("click", ".delete-btn", function () {
  const title = $(this).attr("data-title");
  if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

  apiRequest("DELETE", "/api/promos/" + $(this).attr("data-id"))
    .done(function () {
      clearCache();
      showToast("Promo deleted.");
      loadPromos();
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
    });
});

$("#retry-btn").on("click", loadPromos);

// Role guard: the New promo button is only shown to admins
if (isAdmin) {
  $("#create-link").removeClass("hidden");
}

loadPromos();