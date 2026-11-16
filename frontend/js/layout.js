const linkClass = "text-sm uppercase text-white hover:text-brand aria-[current=page]:text-brand";
const currentPage = window.location.pathname.split("/").pop();

function navItem(href, label, extra = "") {
  const current = href === currentPage ? ' aria-current="page"' : "";
  return `<li><a href="${href}" class="${extra} ${linkClass}"${current}>${label}</a></li>`;
}

function renderNavbar() {
  const user = getUser();
  const home = user ? "events.html" : "login.html";
  let items = "";

  if (user) {
    items += `<li>
      <form id="search-form" role="search">
        <label for="search-input" class="sr-only">Search events</label>
        <input id="search-input" type="search" placeholder="Search events" class="bg-neutral-800 px-3 py-1 text-sm text-white placeholder-gray-400">
      </form>
    </li>`;
    items += navItem("events.html", "Events");
    items += navItem("announcements.html", "Announcements");
    items += navItem("promos.html", "Promos");
    items += navItem("notifications.html", `<span aria-hidden="true">🔔</span><span class="sr-only">Notifications</span> <span id="notif-count"></span>`);

    // Role guard: Admin and Dashboard links are only added when the saved role is admin
    if (user.role === "admin") {
      items += navItem("admin.html", "Admin");
      items += navItem("dashboard.html", "Dashboard");
    }

    items += `
      <li class="relative">
        <button id="profile-btn" type="button" class="${linkClass}" aria-haspopup="true" aria-controls="profile-menu" aria-expanded="false">
          <span id="user-name"></span> <span aria-hidden="true">▾</span>
        </button>
        <ul id="profile-menu" class="absolute right-0 z-10 mt-2 hidden w-44 bg-neutral-900 py-2">
          ${navItem("profile.html", "My Profile", "block px-4 py-2")}
          ${navItem("my-registrations.html", "My Events", "block px-4 py-2")}
          <li><button id="logout-btn" type="button" class="${linkClass} block w-full px-4 py-2 text-left">Logout</button></li>
        </ul>
      </li>`;
  } else {
    items += navItem("login.html", "Login");
    items += `<li><a href="signup.html" class="bg-brand-dark px-5 py-2 text-sm uppercase text-white">Sign up</a></li>`;
  }

  $("#navbar").replaceWith(`
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-black">Skip to main content</a>
    <header id="navbar" class="bg-black">
      <nav class="mx-auto max-w-6xl px-6 py-4 md:flex md:items-center md:justify-between" aria-label="Main">
        <div class="flex items-center justify-between">
          <a href="${home}"><img src="../img/logo.png" alt="Eventcon home" class="h-8"></a>
          <button id="menu-btn" type="button" class="text-2xl text-white md:hidden" aria-label="Toggle menu" aria-controls="menu" aria-expanded="false"><span aria-hidden="true">☰</span></button>
        </div>
        <ul id="menu" class="mt-4 hidden flex-col gap-4 md:mt-0 md:flex md:flex-row md:items-center md:gap-6">
          ${items}
        </ul>
      </nav>
    </header>
  `);

  if (user) {
    $("#user-name").text(user.full_name);
  }
}

function renderFooter() {
  $("#footer").replaceWith(`
    <footer id="footer" class="bg-black px-6 py-10 text-gray-300">
      <div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        <section>
          <img src="../img/footer_logo.png" alt="Eventcon" class="h-8">
          <p class="mt-3 text-sm">Accessible city events and services for everyone.</p>
        </section>
        <nav aria-labelledby="footer-links">
          <h2 id="footer-links" class="font-heading text-lg uppercase text-white">Quick Links</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li><a href="events.html" class="hover:text-brand">Events</a></li>
            <li><a href="announcements.html" class="hover:text-brand">Announcements</a></li>
            <li><a href="promos.html" class="hover:text-brand">Promos</a></li>
          </ul>
        </nav>
        <section aria-labelledby="footer-help">
          <h2 id="footer-help" class="font-heading text-lg uppercase text-white">Contact &amp; Help</h2>
          <address class="mt-3 text-sm not-italic">Need help? Email <a href="mailto:help@civicevents.com" class="underline hover:text-brand">help@civicevents.com</a></address>
        </section>
      </div>
      <p class="mt-8 text-center text-xs text-gray-400">&copy; 2026 CivicEvents. All rights reserved.</p>
    </footer>
  `);
}

$(document).on("click", "#menu-btn", function () {
  $("#menu").toggleClass("hidden flex");
  $(this).attr("aria-expanded", $("#menu").hasClass("flex"));
});

$(document).on("click", "#profile-btn", function () {
  $("#profile-menu").toggleClass("hidden");
  $(this).attr("aria-expanded", !$("#profile-menu").hasClass("hidden"));
});

$(document).on("keydown", function (e) {
  if (e.key === "Escape" && !$("#profile-menu").hasClass("hidden")) {
    $("#profile-menu").addClass("hidden");
    $("#profile-btn").attr("aria-expanded", false).focus();
  }
});

$(document).on("click", "#logout-btn", function () {
  clearSession();
  window.location.href = "login.html";
});

$(document).on("submit", "#search-form", function (e) {
  e.preventDefault();
  const term = $("#search-input").val().trim();
  window.location.href = "events.html?search=" + encodeURIComponent(term);
});