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
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Helper function to generate HTML for a client list item
function generateClientListItem(client) {
    return `
        <li>
            <span>${client.client_name}</span>
            <span>${client.client_id}</span>
            <button hx-get="/api/clients/${client.client_id}" hx-target="#clientDetailsContent">View Details</button>
        </li>
    `;
}

// Helper function to generate HTML for client details
function generateClientDetails(client) {
    return `
        <h3>${client.client_name}</h3>
        <p><strong>Client ID:</strong> ${client.client_id}</p>
        <p><strong>Client Secret:</strong> ${client.client_secret || 'hidden'}</p>
        <p><strong>Redirect URIs:</strong> ${client.redirect_uris.join(', ')}</p>
        <p><strong>Grant Types:</strong> ${client.grant_types.join(', ')}</p>
        <p><strong>Response Types:</strong> ${client.response_types.join(', ')}</p>
        <p><strong>Scope:</strong> ${client.scope}</p>
        <p><strong>Token Endpoint Auth Method:</strong> ${client.token_endpoint_auth_method}</p>
        <p><strong>Owner:</strong> ${client.owner}</p>
        <p><strong>Contacts:</strong> ${client.contacts.join(', ')}</p>
        <p><strong>Client URI:</strong> ${client.client_uri || 'N/A'}</p>
        <p><strong>Logo URI:</strong> ${client.logo_uri || 'N/A'}</p>
        <p><strong>Terms of Service URI:</strong> ${client.tos_uri || 'N/A'}</p>
    `;
}

// Helper function to generate pagination HTML
function generatePagination(currentPage, totalPages, searchParams) {
    let paginationHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        const pageUrl = `/api/clients?page=${i}${searchParams}`;
        paginationHtml += `<button hx-get="${pageUrl}" hx-target="#clientListContainer" class="page-btn${i === currentPage ? ' active' : ''}">${i}</button>`;
    }
    return paginationHtml;
}

// Routes
app.get('/api/clients', async (req, res) => {
    try {
        const { clientName, clientId, page = 1, limit = 10 } = req.query;
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);

        // Fetch all clients
        const response = await axios.get(`${config.OAUTH2_BASE_URL}/clients`);
        let clients = response.data;

        // Apply filters if provided
        if (clientName) {
            clients = clients.filter(client => client.client_name.toLowerCase().includes(clientName.toLowerCase()));
        }
        if (clientId) {
            clients = clients.filter(client => client.client_id.includes(clientId));
        }

        const totalClients = clients.length;
        const totalPages = Math.ceil(totalClients / limitInt);

        // Apply pagination
        const startIndex = (pageInt - 1) * limitInt;
        const endIndex = startIndex + limitInt;
        const paginatedClients = clients.slice(startIndex, endIndex);

        const searchParams = `${clientName ? `&clientName=${clientName}` : ''}${clientId ? `&clientId=${clientId}` : ''}`;

        if (req.header('HX-Request')) {
            const clientListHtml = paginatedClients.map(generateClientListItem).join('');
            const paginationHtml = generatePagination(pageInt, totalPages, searchParams);
            res.send(`
                <ul id="clientListItems">
                    ${clientListHtml}
                </ul>
                <div id="paginationContainer">
                    ${paginationHtml}
                </div>
            `);
        } else {
            res.json({ clients: paginatedClients, totalClients, totalPages });
        }
    } catch (error) {
        console.error('Error fetching clients:', error.message);
        res.status(500).send('<p>Error fetching clients</p>');
    }
});

app.get('/api/clients/:id', async (req, res) => {
    try {
        const response = await axios.get(`${config.OAUTH2_BASE_URL}/clients/${req.params.id}`);
        const client = response.data;

        if (req.header('HX-Request')) {
            res.send(generateClientDetails(client));
        } else {
            res.json(client);
        }
    } catch (error) {
        console.error('Error fetching client details:', error.message);
        res.status(500).send('<p>Error fetching client details</p>');
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const newClient = {
            client_name: req.body.clientName,
            redirect_uris: req.body.redirectUris,
            grant_types: req.body.grantTypes,
            response_types: req.body.responseTypes,
            scope: req.body.scopes.join(' '),
            token_endpoint_auth_method: req.body.tokenEndpointAuthMethod,
            owner: req.body.owner,
            contacts: req.body.contacts,
            client_uri: req.body.clientUri,
            logo_uri: req.body.logoUri,
            tos_uri: req.body.tosUri
        };
        const response = await axios.post(`${config.OAUTH2_BASE_URL}/clients`, newClient);
        const createdClient = response.data;

        if (req.header('HX-Request')) {
            res.send(`
                ${generateClientListItem(createdClient)}
                <div id="newClientDetails" hx-swap-oob="true">
                    ${generateClientDetails(createdClient)}
                </div>
                <div id="registrationForm" hx-swap-oob="true">
                    <form id="registerForm" hx-post="/api/clients" hx-target="#clientListItems" hx-swap="beforeend">
                        <!-- Form fields here (empty) -->
                    </form>
                </div>
            `);
        } else {
            res.json(createdClient);
        }
    } catch (error) {
        console.error('Error registering client:', error.message);
        res.status(500).send('<p>Error registering client</p>');
    }
});

app.patch('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const patchOperations = req.body;

        if (!Array.isArray(patchOperations)) {
            return res.status(400).send('<p>Invalid patch format. Expected an array of patch operations.</p>');
        }

        for (const op of patchOperations) {
            if (!op.op || !op.path || (op.op !== 'remove' && !op.hasOwnProperty('value'))) {
                return res.status(400).send('<p>Invalid patch operation. Each operation must have "op" and "path" fields, and "value" for non-remove operations.</p>');
            }
            if (!['add', 'remove', 'replace', 'move', 'copy', 'test'].includes(op.op)) {
                return res.status(400).send('<p>Invalid operation. Allowed operations are: add, remove, replace, move, copy, test.</p>');
            }
        }

        const response = await axios.patch(`${config.OAUTH2_BASE_URL}/clients/${clientId}`, patchOperations, {
            headers: { 'Content-Type': 'application/json-patch+json' }
        });
        const updatedClient = response.data;

        if (req.header('HX-Request')) {
            res.send(generateClientListItem(updatedClient));
        } else {
            res.json(updatedClient);
        }
    } catch (error) {
        console.error('Error updating client:', error.message);
        res.status(500).send('<p>Error updating client</p>');
    }
});

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