# Project Title
<!-- Project description will be added after approval -->

---

## Technologies Used

### Backend
- Node.js
- MySQL
- bcrypt (for password encryption)
- JWT (for authentication)

### Web Frontend
- React.js
- HTML, CSS, JavaScript
- Axios (for API calls)

### Mobile App (Android)
- Kotlin
- Android Studio
- Retrofit (for API calls)
- SharedPreferences / Secure Storage (for token storage)

---

## Steps to Run Backend

1. Clone the repository:
   ```bash
   git clone <repository_url>
   ```

2. Navigate to the backend folder:
   ```bash
   cd backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Configure `.env` file with database credentials and JWT secret.

5. Run the backend server:
   ```bash
   npm start
   ```

6. Ensure MySQL Workbench is running with the required database.

## Steps to Run Web App

1. Navigate to the web frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open the app in your browser (usually at http://localhost:3000).

## Steps to Run Mobile App

1. Open Android Studio.

2. Open the mobile project folder.

3. Ensure the backend API URL is correctly configured in the mobile app (e.g., Retrofit base URL).

4. Build and run the app on an emulator or physical device.

5. Test login, registration, dashboard, and other features.

## List of API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | /api/register | Register a new user |
| POST | /api/login | Login a user and return JWT |
| POST | /api/logout | Logout a user |
| POST | /api/forgot-password | Request password reset |
| POST | /api/reset-password | Reset user password |
| GET | /api/dashboard | Get dashboard data (protected) |
| GET | /api/profile | Get user profile data (protected) |
| PUT | /api/profile | Update user profile data (protected) |
| POST | /api/oauth/google | Login/register with Google account |
| POST | /api/oauth/apple | Login/register with Apple account |