// Role guard: only admins can open the event form
requireAdmin();

const eventId = new URLSearchParams(window.location.search).get("id");
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];

function toInputValue(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

if (eventId) {
  $("#page-title").text("Edit event");
  document.title = "Edit event | CivicEvents";

  apiRequest("GET", "/api/events/" + eventId)
    .done(function (res) {
      const ev = res.data;
      $("#title").val(ev.title);
      $("#description").val(ev.description);
      $("#location").val(ev.location);
      $("#starts_at").val(toInputValue(ev.starts_at));
      $("#ends_at").val(toInputValue(ev.ends_at));
      if (ev.metadata && ev.metadata.image_url) {
        $("#image-preview").attr("src", ev.metadata.image_url).removeClass("hidden");
      }
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
      $("#save-btn").prop("disabled", true);
    });
} else {
  $("#page-title").text("Create event");
  document.title = "Create event | CivicEvents";
}

$("#image").on("change", function () {
  const file = this.files[0];
  $("#form-error").addClass("hidden");
  if (!file) return;

  if (!ALLOWED_TYPES.includes(file.type)) {
    showFormError("Please choose a JPG, PNG or GIF image.");
    this.value = "";
    return;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    showFormError("That image is larger than 2 MB. Please choose a smaller one.");
    this.value = "";
    return;
  }
  $("#image-preview").attr("src", URL.createObjectURL(file)).removeClass("hidden");
});

$("#event-form").on("submit", function (e) {
  e.preventDefault();
  $("#form-error").addClass("hidden");

  const title = $("#title").val().trim();
  const location = $("#location").val().trim();
  const startsAt = $("#starts_at").val();
  const endsAt = $("#ends_at").val();

  if (!title || !location || !startsAt || !endsAt) {
    showFormError("Please fill in the title, location, start and end times.");
    return;
  }
  if (new Date(endsAt) <= new Date(startsAt)) {
    showFormError("The end time must be after the start time.");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", $("#description").val().trim());
  formData.append("location", location);
  formData.append("starts_at", new Date(startsAt).toISOString());
  formData.append("ends_at", new Date(endsAt).toISOString());
  const file = $("#image")[0].files[0];
  if (file) formData.append("image", file);

  const method = eventId ? "PUT" : "POST";
  const path = eventId ? "/api/events/" + eventId : "/api/events";

  $("#save-btn").prop("disabled", true).text("Saving...");
  $("#upload-progress").val(0).toggleClass("hidden", !file);

  apiRequest(method, path, formData, function (percent) {
    $("#upload-progress").val(percent);
  })
    .done(function () {
      sessionStorage.setItem("toast", eventId ? "Event updated successfully." : "Event created successfully.");
      window.location.href = "events.html";
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
      $("#save-btn").prop("disabled", false).text("Save event");
      $("#upload-progress").addClass("hidden");
    });
});