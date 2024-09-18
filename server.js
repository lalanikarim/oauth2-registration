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
            <button hx-get="/api/clients/${client.client_id}/edit" hx-target="#editClientForm">Edit</button>
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

// Helper function to generate HTML for the edit form
function generateEditForm(client) {
    return `
        <form id="editClientForm" hx-put="/api/clients/${client.client_id}" hx-target="#clientDetailsContent" hx-swap="outerHTML">
            <label for="clientName">Client Name:</label>
            <input type="text" id="clientName" name="clientName" value="${client.client_name}" required minlength="3">

            <label>Redirect URIs:</label>
            <div id="redirectUrisContainer">
                ${client.redirect_uris.map(uri => `<input type="text" name="redirectUris[]" class="redirectUri" value="${uri}">`).join('')}
            </div>
            <button type="button" hx-get="/partial/redirect-uri-input" hx-target="#redirectUrisContainer" hx-swap="beforeend">Add Redirect URI</button>

            <label>Grant Types:</label>
            <div id="grantTypesContainer">
                <label><input type="checkbox" name="grantTypes[]" value="authorization_code" ${client.grant_types.includes('authorization_code') ? 'checked' : ''}> Authorization Code</label>
                <label><input type="checkbox" name="grantTypes[]" value="client_credentials" ${client.grant_types.includes('client_credentials') ? 'checked' : ''}> Client Credentials</label>
                <label><input type="checkbox" name="grantTypes[]" value="refresh_token" ${client.grant_types.includes('refresh_token') ? 'checked' : ''}> Refresh Token</label>
            </div>

            <label>Response Types:</label>
            <div id="responseTypesContainer">
                <label><input type="checkbox" name="responseTypes[]" value="code" ${client.response_types.includes('code') ? 'checked' : ''}> Code</label>
                <label><input type="checkbox" name="responseTypes[]" value="token" ${client.response_types.includes('token') ? 'checked' : ''}> Token</label>
            </div>

            <label>Scopes:</label>
            <div id="scopesContainer">
                ${client.scope.split(' ').map(scope => `<input type="text" name="scopes[]" class="scope" value="${scope}">`).join('')}
            </div>
            <button type="button" hx-get="/partial/scope-input" hx-target="#scopesContainer" hx-swap="beforeend">Add Scope</button>

            <label>Token Endpoint Auth Method:</label>
            <div id="tokenEndpointAuthMethodContainer">
                <label><input type="radio" name="tokenEndpointAuthMethod" value="client_secret_basic" ${client.token_endpoint_auth_method === 'client_secret_basic' ? 'checked' : ''}> Client Secret Basic</label>
                <label><input type="radio" name="tokenEndpointAuthMethod" value="client_secret_post" ${client.token_endpoint_auth_method === 'client_secret_post' ? 'checked' : ''}> Client Secret Post</label>
                <label><input type="radio" name="tokenEndpointAuthMethod" value="none" ${client.token_endpoint_auth_method === 'none' ? 'checked' : ''}> None</label>
            </div>

            <label for="owner">Owner:</label>
            <input type="text" id="owner" name="owner" value="${client.owner}">

            <label>Contacts:</label>
            <div id="contactsContainer">
                ${client.contacts.map(contact => `<input type="text" name="contacts[]" class="contact" value="${contact}">`).join('')}
            </div>
            <button type="button" hx-get="/partial/contact-input" hx-target="#contactsContainer" hx-swap="beforeend">Add Contact</button>

            <label for="clientUri">Client URI:</label>
            <input type="url" id="clientUri" name="clientUri" value="${client.client_uri || ''}">

            <label for="logoUri">Logo URI:</label>
            <input type="url" id="logoUri" name="logoUri" value="${client.logo_uri || ''}">

            <label for="tosUri">Terms of Service URI:</label>
            <input type="url" id="tosUri" name="tosUri" value="${client.tos_uri || ''}">

            <button type="submit">Update Client</button>
        </form>
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

app.get('/api/clients/:id/edit', async (req, res) => {
    try {
        const response = await axios.get(`${config.OAUTH2_BASE_URL}/clients/${req.params.id}`);
        const client = response.data;

        if (req.header('HX-Request')) {
            res.send(generateEditForm(client));
        } else {
            res.json(client);
        }
    } catch (error) {
        console.error('Error fetching client for editing:', error.message);
        res.status(500).send('<p>Error fetching client for editing</p>');
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

app.put('/api/clients/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const updatedClient = {
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

        const response = await axios.put(`${config.OAUTH2_BASE_URL}/clients/${clientId}`, updatedClient);
        const updatedClientData = response.data;

        if (req.header('HX-Request')) {
            res.send(`
                <div id="clientDetailsContent">
                    ${generateClientDetails(updatedClientData)}
                </div>
                <div id="editClientForm" hx-swap-oob="true"></div>
            `);
        } else {
            res.json(updatedClientData);
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