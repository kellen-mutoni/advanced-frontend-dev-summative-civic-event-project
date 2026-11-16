const BASE_URL = "http://localhost:4000";

function apiRequest(method, path, data) {
  return $.ajax({
    url: BASE_URL + path,
    method: method,
    contentType: "application/json",
    data: data ? JSON.stringify(data) : undefined,
    headers: getToken() ? { Authorization: "Bearer " + getToken() } : {},
  }).fail(function (xhr) {
    // An expired token comes back as 401, so we log the user out and send them to login
    if (xhr.status === 401 && getToken()) {
      clearSession();
      window.location.href = "login.html";
    }
  });
}