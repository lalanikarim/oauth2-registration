const express = require('express');
const axios = require('axios');
const cors = require('cors');
const config = require('./config');
const app = express();

// CORS configuration
const corsOptions = {
    origin: `http://${config.APP_HOST}:${config.APP_PORT}`,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('.')); // Serve static files from the current directory

// Routes
app.get('/api/clients', async (req, res) => {
    try {
        const response = await axios.get(`${config.OAUTH2_BASE_URL}/clients`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching clients:', error.message);
        res.status(500).json({ error: 'Error fetching clients' });
    }
});

app.get('/api/clients/:id', async (req, res) => {
    try {
        const response = await axios.get(`${config.OAUTH2_BASE_URL}/clients/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching client details:', error.message);
        res.status(500).json({ error: 'Error fetching client details' });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const newClient = {
            client_name: req.body.client_name,
            redirect_uris: req.body.redirect_uris,
            grant_types: req.body.grant_types,
            response_types: req.body.response_types,
            scope: req.body.scope,
            token_endpoint_auth_method: req.body.token_endpoint_auth_method,
            owner: req.body.owner,
            contacts: req.body.contacts,
            client_uri: req.body.client_uri,
            logo_uri: req.body.logo_uri,
            tos_uri: req.body.tos_uri
        };
        const response = await axios.post(`${config.OAUTH2_BASE_URL}/clients`, newClient);
        res.json(response.data);
    } catch (error) {
        console.error('Error registering client:', error.message);
        res.status(500).json({ error: 'Error registering client' });
    }
});

app.patch('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const patchOperations = req.body;

        // Validate patch operations
        if (!Array.isArray(patchOperations)) {
            return res.status(400).json({ error: 'Invalid patch format. Expected an array of patch operations.' });
        }

        for (const op of patchOperations) {
            if (!op.op || !op.path || (op.op !== 'remove' && !op.hasOwnProperty('value'))) {
                return res.status(400).json({ error: 'Invalid patch operation. Each operation must have "op" and "path" fields, and "value" for non-remove operations.' });
            }
            if (!['add', 'remove', 'replace', 'move', 'copy', 'test'].includes(op.op)) {
                return res.status(400).json({ error: 'Invalid operation. Allowed operations are: add, remove, replace, move, copy, test.' });
            }
        }

        const response = await axios.patch(`${config.OAUTH2_BASE_URL}/clients/${clientId}`, patchOperations, {
            headers: { 'Content-Type': 'application/json-patch+json' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error updating client:', error.message);
        res.status(500).json({ error: 'Error updating client' });
    }
});

app.listen(config.APP_PORT, config.APP_HOST, () => {
    console.log(`Server running at http://${config.APP_HOST}:${config.APP_PORT}`);
    console.log(`Using OAuth2 base URL: ${config.OAUTH2_BASE_URL}`);
});