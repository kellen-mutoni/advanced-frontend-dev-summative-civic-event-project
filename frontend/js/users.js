// Role guard: only admins can open the users page
requireAdmin();

const PER_PAGE = 10;
const myId = getUser().id;
let pageNumber = 1;

function showSkeletons() {
  let html = "";
  for (let i = 0; i < 5; i++) {
    html += '<tr><td colspan="5" class="px-3 py-2"><span class="block h-8 animate-pulse bg-neutral-800" aria-hidden="true"></span></td></tr>';
  }
  $("#users-body").html(html);
  $("#users-table").attr("aria-busy", "true");
}

function rowHtml(u) {
  const name = escapeHtml(u.full_name);
  const action = u.is_active ? "Disable" : "Enable";
  const status = u.is_active
    ? '<span class="font-bold text-green-400">Active</span>'
    : '<span class="font-bold text-red-300">Disabled</span>';

  // An admin cannot disable their own account, and no control here changes a user's role
  const toggle = u.id === myId
    ? '<span class="py-1 text-xs text-gray-400">This is you</span>'
    : `<button type="button" class="toggle-btn border border-gray-500 px-3 py-1 text-sm uppercase text-white" data-id="${u.id}" data-active="${u.is_active}" aria-label="${action} ${name}">${action}</button>`;

  return `
    <tr class="border-b border-neutral-800">
      <th scope="row" class="px-3 py-3 font-bold">${name}</th>
      <td class="px-3 py-3">${escapeHtml(u.email)}</td>
      <td class="px-3 py-3 capitalize">${escapeHtml(u.role)}</td>
      <td class="px-3 py-3">${status}</td>
      <td class="px-3 py-3">
        <p class="flex items-center gap-2">
          <button type="button" class="view-btn bg-brand-dark px-3 py-1 text-sm font-bold uppercase text-white" data-id="${u.id}" aria-label="View profile of ${name}">View</button>
          ${toggle}
        </p>
      </td>
    </tr>`;
}

function renderPagination(count) {
  const btn = "page-btn border border-gray-500 px-4 py-2 text-sm text-white disabled:opacity-40";
  $("#pagination").html(`
    <button type="button" class="${btn}" data-page="${pageNumber - 1}" ${pageNumber === 1 ? "disabled" : ""}>Previous</button>
    <span class="text-sm text-gray-300">Page ${pageNumber}</span>
    <button type="button" class="${btn}" data-page="${pageNumber + 1}" ${count < PER_PAGE ? "disabled" : ""}>Next</button>
  `);
}

function loadUsers() {
  $("#load-error").addClass("hidden");
  showSkeletons();

  apiRequest("GET", `/api/users?page=${pageNumber}&limit=${PER_PAGE}`)
    .done(function (res) {
      $("#users-table").attr("aria-busy", "false");
      $("#users-body").html(res.data.map(rowHtml).join(""));
      renderPagination(res.data.length);
    })
    .fail(function (xhr) {
      $("#users-table").attr("aria-busy", "false");
      $("#users-body").empty();
      $("#error-text").text(errorMessage(xhr));
      $("#load-error").removeClass("hidden");
    });
}

$("#users-body").on("click", ".toggle-btn", function () {
  const button = $(this).prop("disabled", true);
  const enable = button.attr("data-active") !== "true";

  apiRequest("PATCH", "/api/users/" + button.attr("data-id") + "/" + (enable ? "enable" : "disable"))
    .done(function () {
      showToast(enable ? "User enabled." : "User disabled.");
      loadUsers();
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
      button.prop("disabled", false);
    });
});

$("#users-body").on("click", ".view-btn", function () {
  apiRequest("GET", "/api/users/" + $(this).attr("data-id"))
    .done(function (res) {
      const u = res.data;
      $("#dialog-title").text(u.full_name);
      $("#d-email").text(u.email);
      $("#d-role").text(u.role);
      $("#d-status").text(u.is_active ? "Active" : "Disabled");
      $("#d-joined").text(formatDate(u.created_at));
      $("#d-updated").text(formatDate(u.updated_at));
      $("#user-dialog")[0].showModal();
    })
    .fail(function (xhr) {
      showToast(errorMessage(xhr), "error");
    });
});

$("#pagination").on("click", ".page-btn", function () {
  pageNumber = Number($(this).attr("data-page"));
  loadUsers();
});

$("#retry-btn").on("click", loadUsers);

loadUsers();