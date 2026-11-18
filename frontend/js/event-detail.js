requireLogin();

const eventId = new URLSearchParams(window.location.search).get("id");
const currentUser = getUser();
const isAdmin = currentUser.role === "admin";
let isRegistered = false;

if (!eventId) {
  window.location.replace("events.html");
}

function showEvent(ev) {
  // A normal user must not open an unpublished event by typing its address
  if (!ev.published && !isAdmin) {
    showLoadError("This event could not be found.");
    return;
  }

  const imageUrl = ev.metadata && ev.metadata.image_url;
  if (imageUrl) {
    $("#event-image").attr("src", imageUrl).attr("alt", "Poster for " + ev.title).removeClass("hidden");
  }

  document.title = ev.title + " | CivicEvents";
  $("#event-title").text(ev.title);
  $("#event-start").text(formatDate(ev.starts_at)).attr("datetime", ev.starts_at);
  $("#event-end").text(formatDate(ev.ends_at)).attr("datetime", ev.ends_at);
  $("#event-where").text(ev.location || "Location to be announced");
  $("#event-description").text(ev.description || "No description provided.");

  if (ev.location) {
    $("#map-link").attr("href", "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ev.location)).removeClass("hidden");
  }

  // Role guard: admins get the Edit link, normal users get the registration buttons
  if (isAdmin) {
    $("#edit-link").attr("href", "event-form.html?id=" + ev.id).removeClass("hidden");
  } else {
    loadRegistration();
  }

  $("#skeleton").addClass("hidden");
  $("#event").removeClass("hidden");
}

function showLoadError(message) {
  $("#skeleton").addClass("hidden");
  $("#error-text").text(message);
  $("#load-error").removeClass("hidden");
}

function loadEvent() {
  $("#load-error").addClass("hidden");
  $("#event").addClass("hidden");
  $("#skeleton").removeClass("hidden");

  apiRequest("GET", "/api/events/" + eventId)
    .done(function (res) {
      showEvent(res.data);
    })
    .fail(function (xhr) {
      showLoadError(xhr.status === 404 ? "This event could not be found." : errorMessage(xhr));
    });
}

function updateRegistrationButtons() {
  $("#register-btn").toggleClass("hidden", isRegistered);
  $("#registered-badge").toggleClass("hidden", !isRegistered);
  $("#cancel-btn").toggleClass("hidden", !isRegistered);
}

function loadRegistration() {
  apiRequest("GET", "/api/event-registrations/my-registrations")
    .done(function (res) {
      isRegistered = res.data.some(function (r) {
        return r.event_id === eventId && r.status === "registered";
      });
      updateRegistrationButtons();
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
    });
}

$("#retry-btn").on("click", loadEvent);

$("#register-btn").on("click", function () {
  const button = $(this).prop("disabled", true).text("Registering...");

  apiRequest("POST", "/api/event-registrations/register", { event_id: eventId })
    .done(function () {
      isRegistered = true;
      updateRegistrationButtons();
      $("#cancel-btn").trigger("focus");
      showToast("You are registered for this event!");
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
    })
    .always(function () {
      button.prop("disabled", false).text("Register");
    });
});

$("#cancel-btn").on("click", function () {
  if (!window.confirm("Cancel your registration for this event?")) return;
  const button = $(this).prop("disabled", true).text("Cancelling...");

  apiRequest("POST", "/api/event-registrations/cancel", { event_id: eventId })
    .done(function () {
      isRegistered = false;
      updateRegistrationButtons();
      $("#register-btn").trigger("focus");
      showToast("Your registration was cancelled.");
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
    })
    .always(function () {
      button.prop("disabled", false).text("Cancel registration");
    });
});

loadEvent();

let myFeedback = null;

function stars(rating) {
  const score = Number(rating) || 0;
  return `<span role="img" aria-label="${score} out of 5 stars" class="text-yellow-400">${"★".repeat(score)}${"☆".repeat(5 - score)}</span>`;
}

function feedbackItem(f, showName) {
  const who = showName ? escapeHtml(f.full_name) : "Your feedback";
  return `
    <li class="bg-neutral-900 p-4">
      <p><strong>${who}</strong> ${stars(f.rating)}</p>
      <p class="mt-2 text-sm text-gray-300">${escapeHtml(f.comment || "No comment.")}</p>
      <p class="mt-2 text-xs text-gray-400"><time datetime="${f.created_at}">${formatDate(f.created_at)}</time></p>
    </li>`;
}

function renderFeedback(list, showName) {
  $("#feedback-list").html(list.map(function (f) { return feedbackItem(f, showName); }).join(""));
  $("#feedback-empty").toggleClass("hidden", list.length > 0);
}

function loadFeedback() {
  if (isAdmin) {
    apiRequest("GET", "/api/event-feedback/event/" + eventId)
      .done(function (res) {
        renderFeedback(res.data, true);
        const rated = res.data.filter(function (f) { return f.rating; });
        if (rated.length > 0) {
          const total = rated.reduce(function (sum, f) { return sum + Number(f.rating); }, 0);
          $("#average-rating").text(`Average rating: ${(total / rated.length).toFixed(1)} out of 5 (${rated.length} ratings)`).removeClass("hidden");
        }
      })
      .fail(function (xhr) {
        showToast(errorMessage(xhr), "error");
      });
  } else {
    apiRequest("GET", "/api/event-feedback/my-feedback")
      .done(function (res) {
        myFeedback = res.data.find(function (f) { return f.event_id === eventId; }) || null;
        $("#feedback-empty").text("You have not left feedback for this event yet.");
        renderFeedback(myFeedback ? [myFeedback] : [], false);
        if (myFeedback) {
          $("#rating").val(myFeedback.rating);
          $("#comment").val(myFeedback.comment);
          $("#feedback-btn").text("Update feedback");
        }
        $("#feedback-form").removeClass("hidden");
      })
      .fail(function (xhr) {
        showToast(errorMessage(xhr), "error");
      });
  }
}

function loadAttendees() {
  apiRequest("GET", "/api/event-registrations/event/" + eventId + "/attendees")
    .done(function (res) {
      $("#attendees-list").html(res.data.map(function (a) {
        return `<li class="bg-neutral-900 px-4 py-2">${escapeHtml(a.full_name)} <span class="text-gray-300">(${escapeHtml(a.email)})</span></li>`;
      }).join(""));
      $("#attendees-empty").toggleClass("hidden", res.data.length > 0);
      $("#attendees").removeClass("hidden");
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
    });
}

$("#feedback-form").on("submit", function (e) {
  e.preventDefault();
  $("#form-error").addClass("hidden");

  const rating = Number($("#rating").val());
  const comment = $("#comment").val().trim();

  if (!rating) {
    showFormError("Please choose a rating from 1 to 5.");
    return;
  }

  const method = myFeedback ? "PUT" : "POST";
  const path = myFeedback ? "/api/event-feedback/" + myFeedback.id : "/api/event-feedback";
  const data = myFeedback ? { rating, comment } : { event_id: eventId, rating, comment };

  const button = $("#feedback-btn").prop("disabled", true).text("Saving...");

  apiRequest(method, path, data)
    .done(function () {
      showToast(myFeedback ? "Feedback updated." : "Thank you for your feedback!");
      loadFeedback();
    })
    .fail(function (xhr) {
      showFormError(errorMessage(xhr));
    })
    .always(function () {
      button.prop("disabled", false).text(myFeedback ? "Update feedback" : "Submit feedback");
    });
});

loadFeedback();

// Role guard: only admins can load the list of attendees
if (isAdmin) {
  loadAttendees();
}