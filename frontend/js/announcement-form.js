// Role guard: only admins can open the announcement form
requireAdmin();

const announcementId = new URLSearchParams(window.location.search).get("id");
const MAX_AUDIO_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg"];

function fileExtension(name) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

if (announcementId) {
  $("#page-title").text("Edit announcement");
  document.title = "Edit announcement | CivicEvents";
  $("#audio-row, #audio-hint, #published-row").addClass("hidden");
  $("#edit-note").removeClass("hidden");

  apiRequest("GET", "/api/announcements/" + announcementId)
    .done(function (res) {
      $("#title").val(res.data.title);
      $("#audio-preview").attr("src", res.data.audio_url).removeClass("hidden");
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
      $("#save-btn").prop("disabled", true);
    });
} else {
  $("#page-title").text("New announcement");
  document.title = "New announcement | CivicEvents";
}

$("#audio").on("change", function () {
  const file = this.files[0];
  $("#form-error").addClass("hidden");
  if (!file) return;

  if (!ALLOWED_EXTENSIONS.includes(fileExtension(file.name))) {
    showFormError("Please choose an MP3, WAV, M4A or OGG file.");
    this.value = "";
    return;
  }
  if (file.size > MAX_AUDIO_SIZE) {
    showFormError("That file is larger than 5 MB. Please choose a smaller one.");
    this.value = "";
    return;
  }
  $("#audio-preview").attr("src", URL.createObjectURL(file)).removeClass("hidden");
});

$("#announcement-form").on("submit", function (e) {
  e.preventDefault();
  $("#form-error").addClass("hidden");

  const title = $("#title").val().trim();
  const file = $("#audio")[0].files[0];

  if (!title) {
    showFormError("Please enter a title.");
    return;
  }
  if (!announcementId && !file) {
    showFormError("Please choose an audio file.");
    return;
  }

  let data;
  if (announcementId) {
    data = { title };
  } else {
    data = new FormData();
    data.append("title", title);
    data.append("published", $("#published").is(":checked"));
    data.append("audio", file);
  }

  const isUpload = !announcementId;
  const method = isUpload ? "POST" : "PUT";
  const path = isUpload ? "/api/announcements" : "/api/announcements/" + announcementId;

  $("#save-btn").prop("disabled", true).text("Saving...");
  $("#upload-progress").val(0).toggleClass("hidden", !isUpload);

  apiRequest(method, path, data, function (percent) {
    $("#upload-progress").val(percent);
  })
    .done(function () {
      sessionStorage.setItem("toast", isUpload ? "Announcement created. Everyone has been notified." : "Announcement updated successfully.");
      window.location.href = "announcements.html";
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
      $("#save-btn").prop("disabled", false).text("Save announcement");
      $("#upload-progress").addClass("hidden");
    });
});