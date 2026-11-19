// Role guard: only admins can open the dashboard
requireAdmin();

function statCard(label, value) {
  return `
    <li class="bg-neutral-900 p-4">
      <p class="text-sm text-gray-300">${label}</p>
      <p class="mt-1 font-heading text-4xl">${value}</p>
    </li>`;
}

function barList(items) {
  const biggest = Math.max(1, ...items.map(function (item) { return item.value; }));

  return items.map(function (item) {
    const width = Math.round((item.value / biggest) * 100);
    return `
      <li class="flex items-center gap-3 text-sm">
        <span class="w-24 shrink-0 text-gray-300">${escapeHtml(item.label)}</span>
        <span class="h-4 flex-1 bg-neutral-800"><span class="block h-4 bg-brand-dark" style="width: ${width}%"></span></span>
        <span class="w-8 text-right font-bold">${item.value}</span>
      </li>`;
  }).join("");
}

function drawStats(s, unread) {
  const cards = [
    ["Total events", s.events.total_events],
    ["Upcoming events", s.events.upcoming_events],
    ["Past events", s.events.past_events],
    ["Registrations", s.registrations.total_registrations],
    ["Users", s.users.total_users],
    ["Active users", s.users.active_users],
    ["Disabled users", s.users.inactive_users],
    ["Feedback", s.feedbacks.total_feedback],
    ["Promos", s.promos.total_promos],
    ["Announcements", s.announcements.total_announcements],
    ["Notifications", s.notifications.total_notifications],
    ["Unread notifications", unread],
  ];
  $("#stat-cards").attr("aria-busy", "false").html(cards.map(function (c) { return statCard(c[0], c[1]); }).join(""));

  const growth = s.user_growth.map(function (m) { return { label: m.month, value: Number(m.new_users) }; });
  $("#growth-chart").html(growth.length > 0 ? barList(growth) : '<li class="text-sm text-gray-300">No new users in the last 6 months.</li>');

  $("#events-chart").html(barList([
    { label: "Upcoming", value: Number(s.events.upcoming_events) },
    { label: "Past", value: Number(s.events.past_events) },
    { label: "Total", value: Number(s.events.total_events) },
  ]));

  $("#updated").text("Last updated at " + new Date().toLocaleTimeString("en-GB"));
}

function showLoadError(xhr) {
  $("#stat-cards").attr("aria-busy", "false").empty();
  $("#error-text").text(errorMessage(xhr));
  $("#load-error").removeClass("hidden");
}

function loadStats() {
  $("#load-error").addClass("hidden");

  apiRequest("GET", "/api/dashboard/admin")
    .done(function (res) {
      const stats = res.data;

      apiRequest("GET", "/api/notifications")
        .done(function (n) {
          const read = getReadIds();
          drawStats(stats, n.data.filter(function (x) { return !read.includes(x.id); }).length);
        })
        .fail(function () {
          drawStats(stats, "-");
        });
    })
    .fail(showLoadError);
}

$("#refresh-btn").on("click", loadStats);
$("#retry-btn").on("click", loadStats);

setInterval(loadStats, 60000);

loadStats();