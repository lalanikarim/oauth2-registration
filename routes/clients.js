const express = require('express');
const axios = require('axios');
const config = require('../config');
const {
    generateClientListItem,
    generateClientDetails,
    generateEditForm,
    generatePagination
} = require('../utils/htmlGenerators');

const router = express.Router();

router.get('/register-form', (req, res) => {
    const registerFormHtml = `
        <h2>Register New Client</h2>
        <form id="registerForm" hx-post="/api/clients" hx-target="#mainContent">
            <label for="clientName">Client Name:</label>
            <input type="text" id="clientName" name="clientName" required minlength="3">

            <label>Redirect URIs (optional, max 10):</label>
            <div id="redirectUrisContainer">
                <div class="input-group">
                    <input type="text" name="redirectUris[]" class="redirectUri">
                </div>
            </div>
            <button type="button" onclick="addRedirectUri()">Add Redirect URI</button>

            <label>Grant Types:</label>
            <div id="grantTypesContainer">
                <label><input type="checkbox" name="grantTypes[]" value="authorization_code" checked> Authorization Code</label>
                <label><input type="checkbox" name="grantTypes[]" value="client_credentials"> Client Credentials</label>
                <label><input type="checkbox" name="grantTypes[]" value="refresh_token"> Refresh Token</label>
            </div>

            <label>Response Types:</label>
            <div id="responseTypesContainer">
                <label><input type="checkbox" name="responseTypes[]" value="code" checked> Code</label>
                <label><input type="checkbox" name="responseTypes[]" value="token"> Token</label>
            </div>

            <label>Scopes (max 20):</label>
            <div id="scopesContainer">
                <div class="input-group">
                    <input type="text" name="scopes[]" class="scope" value="openid">
                </div>
                <div class="input-group">
                    <input type="text" name="scopes[]" class="scope" value="offline_access">
                    <button type="button" onclick="removeField(this)">Remove</button>
                </div>
                <div class="input-group">
                    <input type="text" name="scopes[]" class="scope" value="offline">
                    <button type="button" onclick="removeField(this)">Remove</button>
                </div>
            </div>
            <button type="button" onclick="addScope()">Add Scope</button>

            <label>Token Endpoint Auth Method:</label>
            <div id="tokenEndpointAuthMethodContainer">
                <label><input type="radio" name="tokenEndpointAuthMethod" value="client_secret_basic" checked> Client Secret Basic</label>
                <label><input type="radio" name="tokenEndpointAuthMethod" value="client_secret_post"> Client Secret Post</label>
                <label><input type="radio" name="tokenEndpointAuthMethod" value="none"> None</label>
            </div>

            <label for="owner">Owner:</label>
            <input type="text" id="owner" name="owner">

            <label>Contacts (max 10):</label>
            <div id="contactsContainer">
                <div class="input-group">
                    <input type="text" name="contacts[]" class="contact" placeholder="name email@example.com">
                </div>
            </div>
            <button type="button" onclick="addContact()">Add Contact</button>

            <label for="clientUri">Client URI:</label>
            <input type="url" id="clientUri" name="clientUri">

            <label for="logoUri">Logo URI:</label>
            <input type="url" id="logoUri" name="logoUri">

            <label for="tosUri">Terms of Service URI:</label>
            <input type="url" id="tosUri" name="tosUri">

            <button type="submit">Register Client</button>
        </form>
        <button hx-get="/api/clients" hx-target="#mainContent">Back to Client List</button>
    `;
    res.send(registerFormHtml);
});

router.get('/', async (req, res) => {
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
            const clientListHtml = paginatedClients.map(client => `
                <li>
                    <span>${client.client_name}</span>
                    <span>${client.client_id}</span>
                    <button hx-get="/api/clients/${client.client_id}" 
                            hx-target="#mainContent"
                            hx-swap="innerHTML">
                        View Details
                    </button>
                    <button hx-get="/api/clients/${client.client_id}/edit" 
                            hx-target="#mainContent"
                            hx-swap="innerHTML">
                        Edit
                    </button>
                </li>
            `).join('');
            const paginationHtml = generatePagination(pageInt, totalPages, searchParams);
            res.send(`
                <h2>Existing Clients</h2>
                <button hx-get="/api/clients/register-form" hx-target="#mainContent">Create New Client</button>
                <form id="filterForm" hx-get="/api/clients" hx-target="#mainContent" hx-trigger="submit">
                    <input type="text" name="clientName" placeholder="Filter by Client Name" value="${clientName || ''}">
                    <input type="text" name="clientId" placeholder="Filter by Client ID" value="${clientId || ''}">
                    <button type="submit">Filter</button>
                </form>
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

router.get('/:id', async (req, res) => {
    try {
        const response = await axios.get(`${config.OAUTH2_BASE_URL}/clients/${req.params.id}`);
        const client = response.data;

        if (req.header('HX-Request')) {
            const clientDetailsHtml = generateClientDetails(client);
            const changeSecretButtonHtml = `
                <button hx-get="/api/clients/${client.client_id}/change-secret-form"
                        hx-target="#mainContent"
                        hx-swap="innerHTML">
                    Change Secret
                </button>
            `;
            res.send(`
                <h2>Client Details</h2>
                ${clientDetailsHtml}
                ${changeSecretButtonHtml}
                <div id="changeClientSecretForm"></div>
                <button hx-get="/api/clients" hx-target="#mainContent">Back to Client List</button>
            `);
        } else {
            res.json(client);
        }
    } catch (error) {
        console.error('Error fetching client details:', error.message);
        res.status(500).send('<p>Error fetching client details</p>');
    }
});

router.get('/:id/change-secret-form', (req, res) => {
    const clientId = req.params.id;
    const changeSecretFormHtml = `
        <h3>Change Client Secret</h3>
        <form hx-put="/api/clients/${clientId}/secret" hx-target="#mainContent">
            <label for="newClientSecret">New Client Secret:</label>
            <input type="password" id="newClientSecret" name="newClientSecret" required minlength="6">
            <button type="submit">Update Secret</button>
        </form>
        <p>Note: Client secret must be at least 6 characters long.</p>
        <button hx-get="/api/clients/${clientId}" hx-target="#mainContent">Back to Client Details</button>
    `;
    res.send(changeSecretFormHtml);
});

router.get('/:id/edit', async (req, res) => {
    try {
        const response = await axios.get(`${config.OAUTH2_BASE_URL}/clients/${req.params.id}`);
        const client = response.data;

        if (req.header('HX-Request')) {
            res.send(`
                <h2>Edit Client</h2>
                ${generateEditForm(client)}
                <button hx-get="/api/clients" hx-target="#mainContent">Back to Client List</button>
            `);
        } else {
            res.json(client);
        }
    } catch (error) {
        console.error('Error fetching client for editing:', error.message);
        res.status(500).send('<p>Error fetching client for editing</p>');
    }
});

router.post('/', async (req, res) => {
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
                <h2>Client Created Successfully</h2>
                ${generateClientDetails(createdClient)}
                <button hx-get="/api/clients" hx-target="#mainContent">Back to Client List</button>
            `);
        } else {
            res.json(createdClient);
        }
    } catch (error) {
        console.error('Error registering client:', error.message);
        res.status(500).send('<p>Error registering client</p>');
    }
});

router.put('/:id', async (req, res) => {
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
                <h2>Client Updated Successfully</h2>
                ${generateClientDetails(updatedClientData)}
                <button hx-get="/api/clients" hx-target="#mainContent">Back to Client List</button>
            `);
        } else {
            res.json(updatedClientData);
        }
    } catch (error) {
        console.error('Error updating client:', error.message);
        res.status(500).send('<p>Error updating client</p>');
    }
});

router.put('/:id/secret', async (req, res) => {
    try {
        const clientId = req.params.id;
        const newClientSecret = req.body.newClientSecret;

        if (newClientSecret.length < 6) {
            return res.status(400).send('<p>Error: Client secret must be at least 6 characters long.</p>');
        }

        const patchOperation = [
            { op: 'replace', path: '/client_secret', value: newClientSecret }
        ];

        const response = await axios.patch(`${config.OAUTH2_BASE_URL}/clients/${clientId}`, patchOperation, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        const updatedClientData = response.data;

        if (req.header('HX-Request')) {
            res.send(`
                <h2>Client Secret Updated Successfully</h2>
                ${generateClientDetails(updatedClientData)}
                <button hx-get="/api/clients" hx-target="#mainContent">Back to Client List</button>
            `);
        } else {
            res.json({ message: 'Client secret updated successfully' });
        }
    } catch (error) {
        console.error('Error updating client secret:', error.message);
        res.status(500).send('<p>Error updating client secret</p>');
    }
});

module.exports = router;