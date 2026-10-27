# FLEXI Project — PawPal Pet Adoption Listing

A React + Vite frontend, Node.js + Express backend, and MongoDB database. It is based on the structure of the starter ZIP you supplied, with the student-data demo replaced by a pet-adoption listing app.

## Features
- Login and sign-up page with email/password validation.
- Passwords are hashed with bcrypt before being saved to MongoDB.
- JWT-based sessions; adding, editing, changing status, and deleting listings require login.
- List pets with name, age, breed, type, gender, location, adoption status, photo URL and description.
- Read listings from MongoDB.
- Add, edit, delete, and change adoption status.
- Search and filter by pet type and adoption status.
- Responsive layout for mobile and desktop.
- Demo preview if the backend is not running. Demo edits are not saved to MongoDB.

## Requirements
- Node.js 20.19+ or 22.12+ recommended (Vite 8 requires a recent Node release).
- MongoDB Community Server running locally.
- MongoDB Compass (optional visual tool for viewing the database).
- VS Code.

## Start MongoDB
1. Install MongoDB Community Server for your operating system from https://www.mongodb.com/try/download/community.
2. During Windows installation, choose to install MongoDB as a Windows Service if the installer offers it.
3. Open MongoDB Compass.
4. Use connection string `mongodb://127.0.0.1:27017` and click Connect.
5. Leave Compass open if you like. Compass is the viewer; the MongoDB Server is the part that stores the data.
6. The app automatically creates database `pawpal` and collection `pets` after the backend connects and a pet is added.

If Compass cannot connect, MongoDB Server may not be running. On Windows, open Services (`Win + R`, type `services.msc`) and start the `MongoDB` service. If you installed MongoDB without a service, start `mongod` using the data directory configured during installation.

## Run in VS Code
Open the extracted `flexi-pet-adoption` folder in VS Code. Use two separate terminals.

### Terminal 1 — backend
```bash
cd server
npm install
```
Create a file named `.env` inside the `server` folder by copying `.env.example`. Set `JWT_SECRET` to a long random secret before using the app beyond a local demo. Then start the backend:
```bash
npm run dev
```
Expected message: `PawPal API running at http://localhost:5000` and `MongoDB connected. Database: pawpal, collection: pets`.

### Terminal 2 — frontend
```bash
cd client
npm install
npm run dev
```
Open the local URL Vite prints, usually `http://localhost:5173`.

## Check database in Compass
1. In Compass, connect to `mongodb://127.0.0.1:27017`.
2. Click Refresh if needed.
3. Open `pawpal` → `pets`.
4. Add a pet through the website. Refresh the collection in Compass and the document should appear.
5. Change its adoption status or delete it in the website, then refresh Compass to see the database update.

## First-time login
1. Start MongoDB and both app terminals.
2. Open the frontend URL and select **Sign up**.
3. Enter your name, email, and a password of at least 8 characters.
4. Your account is stored in the `pawpal.users` collection; password hashes, not plain-text passwords, are stored.
5. Later, use **Log in** with the same email and password.

The login requires the backend and MongoDB to be running; the pet demo preview does not replace account storage. Keep your `.env` private and do not upload it to GitHub.

## Troubleshooting
- `ECONNREFUSED 127.0.0.1:27017`: MongoDB Server is not running or uses a different port.
- Port 5000 in use: change `PORT=5001` in a new `server/.env` file and update `API` in `client/src/App.jsx` to `http://localhost:5001/api/pets`.
- Port 5173 in use: Vite may print a different port; open the URL it prints.
- If pet images do not load, paste a direct image URL into the Photo URL field. The demo images use online Unsplash URLs.
- When the backend is down, the page displays demo listings. Add/edit/delete operations in demo mode are only temporary and are not stored in MongoDB.

## API endpoints
- `GET /api/health` — API health check.
- `POST /api/auth/signup` — create an account.
- `POST /api/auth/login` — log in and receive a token.
- `GET /api/pets` — list pets.
- `POST /api/pets` — create a pet.
- `PUT /api/pets/:id` — update pet fields.
- `DELETE /api/pets/:id` — delete a pet.
