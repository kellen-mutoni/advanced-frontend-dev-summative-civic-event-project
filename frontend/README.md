# CivicEvents Frontend

This is the frontend for the CivicEvents project. It is a website for city events where an admin manages the content and normal users can browse and join events. I built it with HTML, Tailwind CSS and jQuery. The backend API was already provided, so this project only has the pages and the code that talks to it.

## What you need

- The backend running on your computer (Node.js and PostgreSQL, see `backend/README.md`)
- Postman
- VS Code with the Live Server extension
- Internet, because Tailwind, jQuery and the fonts load online

## How to run it

1. **Start the backend.** Follow the steps in `backend/README.md`: create the database, run the migration file, put your database details in `backend/.env`, then run `npm install` and `npm run dev` inside the `backend` folder. When it works it says it is running on port 4000.

2. **Backend address.** The frontend connects to the backend at `http://localhost:4000`. This is written once, on the first line of `frontend/js/api.js`. If your backend uses another port, change it there.

3. **Create an admin account.** The backend does not come with one. Import `backend/CivicEvents+ API.postman_collection.json` into Postman and set the collection variable `base_url` to `http://localhost:4000`. Then send a POST request to `{{base_url}}/api/auth/signup` with this body:

   ```json
   {
     "full_name": "Admin User",
     "email": "admin@gmail.com",
     "password": "Password123@",
     "role": "admin"
   }
   ```

4. **Open the website.** Open the main project folder in VS Code, right-click `frontend/index.html` and choose **Open with Live Server**. The address is `http://127.0.0.1:5500/frontend/index.html`.

## Accounts to test with

- **Admin:** `admin@gmail.com` / `Password123@`
- **Normal user:** `user@gmail.com` / `Password123@`

## Where the role checks are

The real security is in the backend. The frontend only hides buttons and redirects, and each check has a comment in the code:

- `js/auth.js`: `requireLogin()` and `requireAdmin()` send people to the right page
- `js/layout.js`: the Admin and Dashboard links in the navbar only show for admins
- `js/events.js`, `js/announcements.js`, `js/promos.js`, `js/event-detail.js`: Edit, Delete and Create buttons only show for admins, and Register only shows for normal users
- `js/api.js`: a 401 error logs the user out, and a 403 error tells them to contact an admin

## Notes about the backend

- Events have no publish switch, because the backend ignores it for events.
- Only admins can see all the feedback and the average rating.
- Notifications cannot be created or marked as read in the backend, so "read" is saved in the browser.
- The backend does not block disabled users, so the login page checks the account status and stops them.