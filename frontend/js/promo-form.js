// Role guard: only admins can open the promo form
requireAdmin();

const promoId = new URLSearchParams(window.location.search).get("id");
const MAX_VIDEO_SIZE = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv"];

function fileExtension(name) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

if (promoId) {
  $("#page-title").text("Edit promo");
  document.title = "Edit promo | CivicEvents";
  $("#video-hint").text("Leave this empty to keep the current video. MP4, MOV, AVI or MKV, up to 8 MB.");

  apiRequest("GET", "/api/promos/" + promoId)
    .done(function (res) {
      const p = res.data;
      $("#title").val(p.title);
      $("#description").val(p.description);
      $("#caption_text").val(p.caption_text);
      $("#video-preview").attr("src", p.video_url).removeClass("hidden");
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
      $("#save-btn").prop("disabled", true);
    });
} else {
  $("#page-title").text("New promo");
  document.title = "New promo | CivicEvents";
}

$("#video").on("change", function () {
  const file = this.files[0];
  $("#form-error").addClass("hidden");
  if (!file) return;

  if (!ALLOWED_EXTENSIONS.includes(fileExtension(file.name))) {
    showFormError("Please choose an MP4, MOV, AVI or MKV video.");
    this.value = "";
    return;
  }
  if (file.size > MAX_VIDEO_SIZE) {
    showFormError("That video is larger than 8 MB. Please choose a smaller one.");
    this.value = "";
    return;
  }
  $("#video-preview").attr("src", URL.createObjectURL(file)).removeClass("hidden");
});

$("#promo-form").on("submit", function (e) {
  e.preventDefault();
  $("#form-error").addClass("hidden");

  const title = $("#title").val().trim();
  const description = $("#description").val().trim();
  const captions = $("#caption_text").val().trim();
  const file = $("#video")[0].files[0];

  if (!title || !description || !captions) {
    showFormError("Please fill in the title, description and captions.");
    return;
  }
  if (!promoId && !file) {
    showFormError("Please choose a video file.");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("caption_text", captions);
  if (file) formData.append("video", file);

  const method = promoId ? "PUT" : "POST";
  const path = promoId ? "/api/promos/" + promoId : "/api/promos";

  $("#save-btn").prop("disabled", true).text("Saving...");
  $("#upload-progress").val(0).toggleClass("hidden", !file);

  apiRequest(method, path, formData, function (percent) {
    $("#upload-progress").val(percent);
  })
    .done(function () {
      sessionStorage.removeItem("promos-cache");
      sessionStorage.setItem("toast", promoId ? "Promo updated successfully." : "Promo created. Everyone has been notified.");
      window.location.href = "promos.html";
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
      $("#save-btn").prop("disabled", false).text("Save promo");
      $("#upload-progress").addClass("hidden");
    });
});