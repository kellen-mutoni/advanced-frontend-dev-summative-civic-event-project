// The token and user are kept in localStorage so the login survives a page refresh.
// Tradeoff: it stays after the browser closes, and any script on the page can read it.
function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Role guard: a visitor who is not logged in is sent to the login page
function requireLogin() {
  if (!getToken()) {
    window.location.replace("login.html");
  }
}

// Role guard: only admins can stay on a page that calls this
// Normal users are sent to the events page. The backend checks the role too, this is only for the UI
function requireAdmin() {
  requireLogin();
  const user = getUser();
  if (user && user.role !== "admin") {
    window.location.replace("events.html");
  }
}