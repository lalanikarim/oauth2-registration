# OAuth2 Client Manager

This project is an OAuth2 Client Manager that allows users to register, view, and manage OAuth2 clients. It uses a modern tech stack with htmx for dynamic interactions and a Node.js backend.

## Project Structure

```
oauth2-registration/
├── app.js
├── config.js
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── sample.json
├── server.js
├── styles.css
└── validation.js
```

## Technologies Used

- Backend: Node.js with Express
- Frontend: HTML, CSS, htmx
- Client-side validation: JavaScript

## Setup and Running the Project

1. Make sure you have Node.js installed on your system.

2. Clone the repository:
   ```
   git clone <repository-url>
   cd oauth2-registration
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Configure the application:
   - Open `config.js` and adjust the settings as needed (e.g., APP_HOST, APP_PORT, OAUTH2_BASE_URL).

5. Start the server:
   ```
   node server.js
   ```

6. Open a web browser and navigate to `http://localhost:3000` (or the port you specified in the config).

## Features

- View existing OAuth2 clients
- Filter clients by name or ID
- View detailed information for each client
- Register new OAuth2 clients with various parameters
- Client-side form validation

## Development

- `server.js`: Contains the Express server setup and API routes.
- `index.html`: The main HTML file that structures the application.
- `styles.css`: Contains all the styles for the application.
- `validation.js`: Handles client-side form validation.

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.