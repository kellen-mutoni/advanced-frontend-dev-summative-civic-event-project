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