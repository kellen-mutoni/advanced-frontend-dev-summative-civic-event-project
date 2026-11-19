requireLogin();

const announcementId = new URLSearchParams(window.location.search).get("id");
const isAdmin = getUser().role === "admin";

if (!announcementId) {
  window.location.replace("announcements.html");
}

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function updateTimeDisplay() {
  const player = $("#player")[0];
  $("#time-display").text(`${formatTime(player.currentTime)} / ${formatTime(player.duration)}`);
}

function showLoadError(message) {
  $("#skeleton").addClass("hidden");
  $("#error-text").text(message);
  $("#load-error").removeClass("hidden");
}

function showAnnouncement(a) {
  // A normal user must not open an unpublished announcement by typing its address
  if (!a.published && !isAdmin) {
    showLoadError("This announcement could not be found.");
    return;
  }

  document.title = a.title + " | CivicEvents";
  $("#title").text(a.title);
  $("#created").text(formatDate(a.created_at)).attr("datetime", a.created_at);
  $("#player").attr("src", a.audio_url).attr("aria-label", "Audio for " + a.title);
  $("#download-link").attr("href", a.audio_url);

  // Role guard: only admins see the Edit link
  if (isAdmin) {
    $("#edit-link").attr("href", "announcement-form.html?id=" + a.id).removeClass("hidden");
  }

  $("#skeleton").addClass("hidden");
  $("#announcement").removeClass("hidden");
}

function loadAnnouncement() {
  $("#load-error").addClass("hidden");
  $("#announcement").addClass("hidden");
  $("#skeleton").removeClass("hidden");

  apiRequest("GET", "/api/announcements/" + announcementId)
    .done(function (res) {
      showAnnouncement(res.data);
    })
    .fail(function (xhr) {
      showLoadError(xhr.status === 404 ? "This announcement could not be found." : errorMessage(xhr));
    });
}

$("#player").on("timeupdate loadedmetadata", updateTimeDisplay);

$("#player").on("error", function () {
  $("#time-display").text("This audio could not be played. Try the download link instead.");
});

$("#retry-btn").on("click", loadAnnouncement);

loadAnnouncement();