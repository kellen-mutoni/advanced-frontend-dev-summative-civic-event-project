requireLogin();

const promoId = new URLSearchParams(window.location.search).get("id");
const isAdmin = getUser().role === "admin";

if (!promoId) {
  window.location.replace("promos.html");
}

function toTimestamp(seconds) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const rest = (seconds % 60).toFixed(3).padStart(6, "0");
  return `${hours}:${minutes}:${rest}`;
}

function buildVtt(text, duration) {
  if (text.trim().startsWith("WEBVTT")) return text;

  const lines = text.split("\n").map(function (line) { return line.trim(); }).filter(function (line) { return line; });
  const total = isFinite(duration) && duration > 0 ? duration : 30;
  const slice = total / lines.length;

  let vtt = "WEBVTT\n\n";
  lines.forEach(function (line, i) {
    vtt += `${toTimestamp(i * slice)} --> ${toTimestamp((i + 1) * slice)}\n${line}\n\n`;
  });
  return vtt;
}

function addCaptions(captionText) {
  const video = $("#player")[0];

  function addTrack() {
    const vtt = buildVtt(captionText, video.duration);
    const url = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
    $("#player").append($("<track>", { kind: "captions", srclang: "en", label: "English", src: url, default: true }));
    video.textTracks[video.textTracks.length - 1].mode = "showing";
  }

  if (video.readyState >= 1) {
    addTrack();
  } else {
    $("#player").one("loadedmetadata", addTrack);
  }
}

function showLoadError(message) {
  $("#skeleton").addClass("hidden");
  $("#error-text").text(message);
  $("#load-error").removeClass("hidden");
}

function showPromo(p) {
  // A normal user must not open an unpublished promo by typing its address
  if (!p.published && !isAdmin) {
    showLoadError("This promo could not be found.");
    return;
  }

  document.title = p.title + " | CivicEvents";
  $("#title").text(p.title);
  $("#created").text(formatDate(p.created_at)).attr("datetime", p.created_at);
  $("#description").text(p.description);
  $("#transcript").text(p.caption_text);
  $("#player").attr("src", p.video_url).attr("aria-label", "Video: " + p.title);
  $("#download-link").attr("href", p.video_url);
  addCaptions(p.caption_text || "");

  // Role guard: only admins see the Edit link
  if (isAdmin) {
    $("#edit-link").attr("href", "promo-form.html?id=" + p.id).removeClass("hidden");
  }

  $("#skeleton").addClass("hidden");
  $("#promo").removeClass("hidden");
}

function loadPromo() {
  $("#load-error").addClass("hidden");
  $("#promo").addClass("hidden");
  $("#skeleton").removeClass("hidden");

  apiRequest("GET", "/api/promos/" + promoId)
    .done(function (res) {
      showPromo(res.data);
    })
    .fail(function (xhr) {
      showLoadError(xhr.status === 404 ? "This promo could not be found." : errorMessage(xhr));
    });
}

$("#captions-btn").on("click", function () {
  const tracks = $("#player")[0].textTracks;
  if (tracks.length === 0) return;

  const turnOn = tracks[0].mode !== "showing";
  tracks[0].mode = turnOn ? "showing" : "hidden";
  $(this).attr("aria-pressed", turnOn).text("Captions: " + (turnOn ? "on" : "off"));
});

$("#player").on("error", function () {
  $("#video-error").text("This video could not be played. Try the download link instead.").removeClass("hidden");
});

$("#retry-btn").on("click", loadPromo);

loadPromo();