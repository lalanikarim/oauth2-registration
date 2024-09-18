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

router.get('/:id', async (req, res) => {
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

router.get('/:id/edit', async (req, res) => {
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

module.exports = router;