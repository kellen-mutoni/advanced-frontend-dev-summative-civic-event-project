const BASE_URL = "http://localhost:4000";

function apiRequest(method, path, data, onProgress) {
  const isForm = data instanceof FormData;
  let body;
  if (isForm) {
    body = data;
  } else if (data) {
    body = JSON.stringify(data);
  }

  return $.ajax({
    url: BASE_URL + path,
    method: method,
    contentType: isForm ? false : "application/json",
    processData: !isForm,
    data: body,
    headers: getToken() ? { Authorization: "Bearer " + getToken() } : {},
    xhr: function () {
      const request = $.ajaxSettings.xhr();
      if (onProgress && request.upload) {
        request.upload.addEventListener("progress", function (e) {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
      }
      return request;
    },
  }).fail(function (xhr) {
    // An expired token comes back as 401, so we log the user out and send them to login
    if (xhr.status === 401 && getToken()) {
      clearSession();
      window.location.href = "login.html";
    }
  });
}