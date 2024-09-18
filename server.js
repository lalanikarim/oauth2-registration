const express = require('express');
const cors = require('cors');
const config = require('./config');
const clientsRouter = require('./routes/clients');

const app = express();

// CORS configuration
const corsOptions = {
    origin: `http://${config.APP_HOST}:${config.APP_PORT}`,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Routes
app.use('/api/clients', clientsRouter);

// New routes for partial HTML content
app.get('/partial/redirect-uri-input', (req, res) => {
    res.send('<input type="text" name="redirectUris[]" class="redirectUri">');
});

app.get('/partial/scope-input', (req, res) => {
    res.send('<input type="text" name="scopes[]" class="scope">');
});

app.get('/partial/contact-input', (req, res) => {
    res.send('<input type="text" name="contacts[]" class="contact" placeholder="name email@example.com">');
});

app.listen(config.APP_PORT, config.APP_HOST, () => {
    console.log(`Server running at http://${config.APP_HOST}:${config.APP_PORT}`);
    console.log(`Using OAuth2 base URL: ${config.OAUTH2_BASE_URL}`);
});