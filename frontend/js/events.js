requireLogin();

const currentUser = getUser();
const isAdmin = currentUser && currentUser.role === "admin";
const PER_PAGE = 6;
const REGISTERED_HTML = `<span class="py-2 text-sm font-bold text-green-400"><span aria-hidden="true">✓</span> Registered</span>`;
let allEvents = [];
let filteredEvents = [];
let myEventIds = [];
let pageNumber = 1;

function showSkeletons() {
  let html = "";
  for (let i = 0; i < PER_PAGE; i++) {
    html += '<li class="h-80 animate-pulse bg-neutral-800" aria-hidden="true"></li>';
  }
  $("#events-list").attr("aria-busy", "true").html(html);
}

function showLoadError(xhr) {
  $("#events-list").attr("aria-busy", "false").empty();
  $("#error-text").text(errorMessage(xhr));
  $("#events-error").removeClass("hidden");
}

function loadEvents() {
  $("#events-error").addClass("hidden");
  $("#empty-state").addClass("hidden");
  showSkeletons();

  apiRequest("GET", "/api/events")
    .done(function (res) {
      // The backend sends every event, so normal users only keep the published ones
      allEvents = isAdmin ? res.data : res.data.filter(function (ev) { return ev.published; });

      apiRequest("GET", "/api/event-registrations/my-registrations")
        .done(function (reg) {
          myEventIds = reg.data
            .filter(function (r) { return r.status === "registered"; })
            .map(function (r) { return r.event_id; });
          applyFilters();
        })
        .fail(showLoadError);
    })
    .fail(showLoadError);
}

function applyFilters() {
  const searchText = $("#filter-search").val().trim().toLowerCase();
  const placeText = $("#filter-location").val().trim().toLowerCase();
  const fromDate = $("#filter-date").val();

  filteredEvents = allEvents.filter(function (ev) {
    const eventText = (ev.title + " " + (ev.description || "")).toLowerCase();
    const eventPlace = (ev.location || "").toLowerCase();
    const eventDay = ev.starts_at ? ev.starts_at.slice(0, 10) : "";
    return eventText.includes(searchText) && eventPlace.includes(placeText) && (!fromDate || eventDay >= fromDate);
  });

  pageNumber = 1;
  renderEvents();
}

function cardHtml(ev) {
  const title = escapeHtml(ev.title);
  const imageUrl = ev.metadata && ev.metadata.image_url;
  const image = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="Poster for ${title}" loading="lazy" class="h-44 w-full object-cover">`
    : `<span class="flex h-44 items-center justify-center bg-neutral-800 text-gray-300">No image</span>`;
  const when = ev.starts_at ? `<time datetime="${ev.starts_at}">${formatDate(ev.starts_at)}</time>` : "Date to be announced";
  const draft = ev.published ? "" : `<span class="ml-2 bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">Unpublished</span>`;

  let actions = `<a href="event-detail.html?id=${ev.id}" aria-label="View details of ${title}" class="bg-brand-dark px-4 py-2 text-sm font-bold uppercase text-white">View</a>`;

  // Role guard: Edit and Delete are only built for admins, normal users get Register
  if (isAdmin) {
    actions += `<a href="event-form.html?id=${ev.id}" aria-label="Edit ${title}" class="border border-gray-500 px-4 py-2 text-sm uppercase text-white">Edit</a>`;
    actions += `<button type="button" class="delete-btn border border-red-400 px-4 py-2 text-sm uppercase text-red-300" data-id="${ev.id}" data-title="${title}" aria-label="Delete ${title}">Delete</button>`;
  } else if (myEventIds.includes(ev.id)) {
    actions += REGISTERED_HTML;
  } else {
    actions += `<button type="button" class="register-btn border border-gray-500 px-4 py-2 text-sm uppercase text-white" data-id="${ev.id}" aria-label="Register for ${title}">Register</button>`;
  }

  return `
    <li>
      <article class="flex h-full flex-col bg-neutral-900">
        ${image}
        <h2 class="mt-4 px-4 font-heading text-xl uppercase">${title}${draft}</h2>
        <p class="mt-1 px-4 text-sm text-brand">${when}</p>
        <p class="mt-1 px-4 text-sm text-gray-300">${escapeHtml(ev.location || "Location to be announced")}</p>
        <p class="mt-2 line-clamp-2 px-4 text-sm text-gray-300">${escapeHtml(ev.description)}</p>
        <footer class="mt-auto flex flex-wrap gap-3 p-4">${actions}</footer>
      </article>
    </li>`;
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    $("#pagination").empty();
    return;
  }
  const btn = "page-btn border border-gray-500 px-4 py-2 text-sm text-white disabled:opacity-40";
  $("#pagination").html(`
    <button type="button" class="${btn}" data-page="${pageNumber - 1}" ${pageNumber === 1 ? "disabled" : ""}>Previous</button>
    <span class="text-sm text-gray-300">Page ${pageNumber} of ${totalPages}</span>
    <button type="button" class="${btn}" data-page="${pageNumber + 1}" ${pageNumber === totalPages ? "disabled" : ""}>Next</button>
  `);
}

function renderEvents() {
  const totalPages = Math.ceil(filteredEvents.length / PER_PAGE);
  const start = (pageNumber - 1) * PER_PAGE;
  const shown = filteredEvents.slice(start, start + PER_PAGE);

  $("#events-list").attr("aria-busy", "false").html(shown.map(cardHtml).join(""));
  $("#empty-state").toggleClass("hidden", filteredEvents.length > 0);
  $("#results-info").text(filteredEvents.length > 0 ? `Showing ${shown.length} of ${filteredEvents.length} event${filteredEvents.length === 1 ? "" : "s"}` : "");
  renderPagination(totalPages);
}

$("#filter-form").on("input", applyFilters);

$("#filter-form").on("submit", function (e) {
  e.preventDefault();
});

$("#clear-filters").on("click", function () {
  $("#filter-form")[0].reset();
  applyFilters();
});

$("#retry-btn").on("click", loadEvents);

$("#pagination").on("click", ".page-btn", function () {
  pageNumber = Number($(this).attr("data-page"));
  renderEvents();
  window.scrollTo(0, 0);
});

$("#events-list").on("click", ".register-btn", function () {
  const button = $(this).prop("disabled", true).text("Registering...");
  const card = button.closest("article");
  const eventId = button.attr("data-id");

  apiRequest("POST", "/api/event-registrations/register", { event_id: eventId })
    .done(function () {
      myEventIds.push(eventId);
      button.replaceWith(REGISTERED_HTML);
      card.find("a").first().focus();
      showToast("You are registered for this event!");
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
      button.prop("disabled", false).text("Register");
    });
});

$("#events-list").on("click", ".delete-btn", function () {
  const eventId = $(this).attr("data-id");
  const title = $(this).attr("data-title");
  if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

  apiRequest("DELETE", "/api/events/" + eventId)
    .done(function () {
      allEvents = allEvents.filter(function (ev) { return ev.id !== eventId; });
      applyFilters();
      showToast("Event deleted.");
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
    });
});

// Role guard: the Create event button is only shown to admins
if (isAdmin) {
  $("#create-event-link").removeClass("hidden");
}

const searchFromUrl = new URLSearchParams(window.location.search).get("search");
if (searchFromUrl) {
  $("#filter-search").val(searchFromUrl);
}

loadEvents();