// API endpoints
const API_BASE_URL = '/api';
const LIST_CLIENTS_ENDPOINT = `${API_BASE_URL}/clients`;
const CLIENT_DETAILS_ENDPOINT = `${API_BASE_URL}/clients/`;
const REGISTER_CLIENT_ENDPOINT = `${API_BASE_URL}/clients`;
const UPDATE_CLIENT_ENDPOINT = `${API_BASE_URL}/clients/`;

// DOM elements
const clientListItems = document.getElementById('clientListItems');
const clientDetailsContent = document.getElementById('clientDetailsContent');
const registerForm = document.getElementById('registerForm');
const toastContainer = document.getElementById('toastContainer');
const redirectUrisContainer = document.getElementById('redirectUrisContainer');
const addRedirectUriButton = document.getElementById('addRedirectUri');
const scopesContainer = document.getElementById('scopesContainer');
const addScopeButton = document.getElementById('addScope');
const contactsContainer = document.getElementById('contactsContainer');
const addContactButton = document.getElementById('addContact');
const paginationContainer = document.getElementById('paginationContainer');
const filterForm = document.getElementById('filterForm');

// DOM elements for update form
const updateForm = document.getElementById('updateForm');
const updateClientId = document.getElementById('updateClientId');
const updateClientName = document.getElementById('updateClientName');
const updateRedirectUrisContainer = document.getElementById('updateRedirectUrisContainer');
const addUpdateRedirectUriButton = document.getElementById('addUpdateRedirectUri');
const updateScopesContainer = document.getElementById('updateScopesContainer');
const addUpdateScopeButton = document.getElementById('addUpdateScope');
const updateContactsContainer = document.getElementById('updateContactsContainer');
const addUpdateContactButton = document.getElementById('addUpdateContact');

let allClients = [];
let currentPage = 1;
const clientsPerPage = 10;

// Fetch all clients
async function fetchAllClients() {
    try {
        const response = await fetch(LIST_CLIENTS_ENDPOINT);
        allClients = await response.json();
        applyFiltersAndPagination();
    } catch (error) {
        console.error('Error fetching clients:', error);
        showToast('Error fetching clients. Please try again.', 'error');
    }
}

// Apply filters and pagination
function applyFiltersAndPagination() {
    const filters = getFilters();
    const filteredClients = allClients.filter(client => 
        (!filters.client_name || client.client_name.toLowerCase().includes(filters.client_name.toLowerCase())) &&
        (!filters.client_id || client.client_id.includes(filters.client_id))
    );

    const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
    const startIndex = (currentPage - 1) * clientsPerPage;
    const endIndex = startIndex + clientsPerPage;
    const clientsToDisplay = filteredClients.slice(startIndex, endIndex);

    displayClients(clientsToDisplay);
    updatePagination(totalPages);
}

// Display clients
function displayClients(clients) {
    clientListItems.innerHTML = clients.map(client => `
        <li onclick="fetchClientDetails('${client.client_id}')">${client.client_name} (${client.client_id})</li>
    `).join('');
}

// Update pagination
function updatePagination(totalPages) {
    paginationContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => {
            currentPage = i;
            applyFiltersAndPagination();
        };
        if (i === currentPage) {
            pageButton.disabled = true;
        }
        paginationContainer.appendChild(pageButton);
    }
}

// Get filters
function getFilters() {
    const clientName = document.getElementById('filterClientName').value;
    const clientId = document.getElementById('filterClientId').value;
    const filters = {};
    if (clientName) filters.client_name = clientName;
    if (clientId) filters.client_id = clientId;
    return filters;
}

// Apply filters
filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 1;
    applyFiltersAndPagination();
});

// Fetch and display client details
async function fetchClientDetails(clientId) {
    try {
        const response = await fetch(CLIENT_DETAILS_ENDPOINT + clientId);
        const client = await response.json();
        displayClientDetails(client);
    } catch (error) {
        console.error('Error fetching client details:', error);
        showToast('Error fetching client details. Please try again.', 'error');
    }
}

// Display client details
function displayClientDetails(client) {
    clientDetailsContent.innerHTML = `
        <p><strong>Client ID:</strong> ${client.client_id}</p>
        <p><strong>Client Name:</strong> ${client.client_name}</p>
        <p><strong>Client Secret:</strong> ${client.client_secret || 'N/A'}</p>
        <p><strong>Redirect URIs:</strong> ${client.redirect_uris.join(', ') || 'N/A'}</p>
        <p><strong>Grant Types:</strong> ${client.grant_types.join(', ')}</p>
        <p><strong>Response Types:</strong> ${client.response_types.join(', ')}</p>
        <p><strong>Scope:</strong> ${client.scope}</p>
        <p><strong>Token Endpoint Auth Method:</strong> ${client.token_endpoint_auth_method}</p>
        <p><strong>Owner:</strong> ${client.owner || 'N/A'}</p>
        <p><strong>Contacts:</strong> ${client.contacts && client.contacts.length ? client.contacts.join(', ') : 'N/A'}</p>
        <p><strong>Client URI:</strong> ${client.client_uri || 'N/A'}</p>
        <p><strong>Logo URI:</strong> ${client.logo_uri || 'N/A'}</p>
        <p><strong>Terms of Service URI:</strong> ${client.tos_uri || 'N/A'}</p>
        <p><strong>Created At:</strong> ${client.created_at}</p>
        <p><strong>Updated At:</strong> ${client.updated_at}</p>
    `;

    populateUpdateForm(client);
}

// Populate update form
function populateUpdateForm(client) {
    updateClientId.value = client.client_id;
    updateClientName.value = client.client_name;
    updateRedirectUrisContainer.innerHTML = client.redirect_uris.map(uri => 
        `<input type="text" class="updateRedirectUri" value="${uri}">`
    ).join('');
    document.querySelectorAll('input[name="updateGrantTypes"]').forEach(checkbox => {
        checkbox.checked = client.grant_types.includes(checkbox.value);
    });
    document.querySelectorAll('input[name="updateResponseTypes"]').forEach(checkbox => {
        checkbox.checked = client.response_types.includes(checkbox.value);
    });
    updateScopesContainer.innerHTML = client.scope.split(' ').map(scope => 
        `<input type="text" class="updateScope" value="${scope}">`
    ).join('');
    document.querySelector(`input[name="updateTokenEndpointAuthMethod"][value="${client.token_endpoint_auth_method}"]`).checked = true;
    document.getElementById('updateOwner').value = client.owner || '';
    updateContactsContainer.innerHTML = (client.contacts || []).map(contact => 
        `<input type="text" class="updateContact" value="${contact}">`
    ).join('');
    document.getElementById('updateClientUri').value = client.client_uri || '';
    document.getElementById('updateLogoUri').value = client.logo_uri || '';
    document.getElementById('updateTosUri').value = client.tos_uri || '';
}

// Add new redirect URI input
addRedirectUriButton.addEventListener('click', () => {
    if (redirectUrisContainer.children.length < 10) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'redirectUri';
        redirectUrisContainer.appendChild(input);
    }
    if (redirectUrisContainer.children.length === 10) {
        addRedirectUriButton.disabled = true;
    }
});

// Add new scope input
addScopeButton.addEventListener('click', () => {
    if (scopesContainer.children.length < 20) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'scope';
        scopesContainer.appendChild(input);
    }
    if (scopesContainer.children.length === 20) {
        addScopeButton.disabled = true;
    }
});

// Add new contact input
addContactButton.addEventListener('click', () => {
    if (contactsContainer.children.length < 10) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'contact';
        input.placeholder = 'name email@example.com';
        contactsContainer.appendChild(input);
    }
    if (contactsContainer.children.length === 10) {
        addContactButton.disabled = true;
    }
});

// Validate URI
function isValidUri(uri) {
    try {
        new URL(uri);
        return true;
    } catch (e) {
        return false;
    }
}

// Register new client
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const clientName = document.getElementById('clientName').value;
    const redirectUris = Array.from(document.querySelectorAll('.redirectUri'))
        .map(input => input.value.trim())
        .filter(uri => uri !== '');
    const grantTypes = Array.from(document.querySelectorAll('input[name="grantTypes"]:checked'))
        .map(checkbox => checkbox.value);
    const responseTypes = Array.from(document.querySelectorAll('input[name="responseTypes"]:checked'))
        .map(checkbox => checkbox.value);
    const scopes = Array.from(document.querySelectorAll('.scope'))
        .map(input => input.value.trim())
        .filter(scope => scope !== '');
    const tokenEndpointAuthMethod = document.querySelector('input[name="tokenEndpointAuthMethod"]:checked').value;
    const owner = document.getElementById('owner').value;
    const contacts = Array.from(document.querySelectorAll('.contact'))
        .map(input => input.value.trim())
        .filter(contact => contact !== '');
    const clientUri = document.getElementById('clientUri').value;
    const logoUri = document.getElementById('logoUri').value;
    const tosUri = document.getElementById('tosUri').value;

    // Validate URIs
    const invalidUris = redirectUris.filter(uri => !isValidUri(uri));
    if (invalidUris.length > 0) {
        showToast(`Invalid redirect URIs: ${invalidUris.join(', ')}`, 'error');
        return;
    }
    if (clientUri && !isValidUri(clientUri)) {
        showToast('Invalid Client URI', 'error');
        return;
    }
    if (logoUri && !isValidUri(logoUri)) {
        showToast('Invalid Logo URI', 'error');
        return;
    }
    if (tosUri && !isValidUri(tosUri)) {
        showToast('Invalid Terms of Service URI', 'error');
        return;
    }

    try {
        const response = await fetch(REGISTER_CLIENT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_name: clientName,
                redirect_uris: redirectUris,
                grant_types: grantTypes,
                response_types: responseTypes,
                scope: scopes.join(' '),
                token_endpoint_auth_method: tokenEndpointAuthMethod,
                owner: owner,
                contacts: contacts,
                client_uri: clientUri,
                logo_uri: logoUri,
                tos_uri: tosUri
            }),
        });
        const newClient = await response.json();
        showToast(`Client registered successfully! Client ID: ${newClient.client_id}`, 'success');
        displayClientDetails(newClient);
        allClients.push(newClient);
        applyFiltersAndPagination();
        registerForm.reset();
        resetRedirectUris();
        resetScopes();
        resetContacts();
    } catch (error) {
        console.error('Error registering client:', error);
        showToast('Failed to register client. Please try again.', 'error');
    }
});

// Reset redirect URIs inputs
function resetRedirectUris() {
    redirectUrisContainer.innerHTML = '<input type="text" class="redirectUri">';
    addRedirectUriButton.disabled = false;
}

// Reset scopes inputs
function resetScopes() {
    scopesContainer.innerHTML = `
        <input type="text" class="scope" value="openid">
        <input type="text" class="scope" value="offline_access">
        <input type="text" class="scope" value="offline">
    `;
    addScopeButton.disabled = false;
}

// Reset contacts inputs
function resetContacts() {
    contactsContainer.innerHTML = '<input type="text" class="contact" placeholder="name email@example.com">';
    addContactButton.disabled = false;
}

// Show toast message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.innerHTML = `
        ${message}
        <button class="toast-close">&times;</button>
    `;
    toastContainer.appendChild(toast);

    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toastContainer.removeChild(toast);
    });

    setTimeout(() => {
        if (toastContainer.contains(toast)) {
            toastContainer.removeChild(toast);
        }
    }, 5000);
}

// Add new update redirect URI input
addUpdateRedirectUriButton.addEventListener('click', () => {
    if (updateRedirectUrisContainer.children.length < 10) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'updateRedirectUri';
        updateRedirectUrisContainer.appendChild(input);
    }
    if (updateRedirectUrisContainer.children.length === 10) {
        addUpdateRedirectUriButton.disabled = true;
    }
});

// Add new update scope input
addUpdateScopeButton.addEventListener('click', () => {
    if (updateScopesContainer.children.length < 20) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'updateScope';
        updateScopesContainer.appendChild(input);
    }
    if (updateScopesContainer.children.length === 20) {
        addUpdateScopeButton.disabled = true;
    }
});

// Add new update contact input
addUpdateContactButton.addEventListener('click', () => {
    if (updateContactsContainer.children.length < 10) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'updateContact';
        input.placeholder = 'name email@example.com';
        updateContactsContainer.appendChild(input);
    }
    if (updateContactsContainer.children.length === 10) {
        addUpdateContactButton.disabled = true;
    }
});

// Update client
updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const clientId = updateClientId.value;
    const updates = {
        client_name: updateClientName.value,
        redirect_uris: Array.from(document.querySelectorAll('.updateRedirectUri'))
            .map(input => input.value.trim())
            .filter(uri => uri !== ''),
        grant_types: Array.from(document.querySelectorAll('input[name="updateGrantTypes"]:checked'))
            .map(checkbox => checkbox.value),
        response_types: Array.from(document.querySelectorAll('input[name="updateResponseTypes"]:checked'))
            .map(checkbox => checkbox.value),
        scope: Array.from(document.querySelectorAll('.updateScope'))
            .map(input => input.value.trim())
            .filter(scope => scope !== '')
            .join(' '),
        token_endpoint_auth_method: document.querySelector('input[name="updateTokenEndpointAuthMethod"]:checked').value,
        owner: document.getElementById('updateOwner').value,
        contacts: Array.from(document.querySelectorAll('.updateContact'))
            .map(input => input.value.trim())
            .filter(contact => contact !== ''),
        client_uri: document.getElementById('updateClientUri').value,
        logo_uri: document.getElementById('updateLogoUri').value,
        tos_uri: document.getElementById('updateTosUri').value
    };

    // Validate URIs
    const invalidUris = updates.redirect_uris.filter(uri => !isValidUri(uri));
    if (invalidUris.length > 0) {
        showToast(`Invalid redirect URIs: ${invalidUris.join(', ')}`, 'error');
        return;
    }
    if (updates.client_uri && !isValidUri(updates.client_uri)) {
        showToast('Invalid Client URI', 'error');
        return;
    }
    if (updates.logo_uri && !isValidUri(updates.logo_uri)) {
        showToast('Invalid Logo URI', 'error');
        return;
    }
    if (updates.tos_uri && !isValidUri(updates.tos_uri)) {
        showToast('Invalid Terms of Service URI', 'error');
        return;
    }

    try {
        await updateClient(clientId, updates);
        showToast('Client updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating client:', error);
        showToast('Failed to update client. Please try again.', 'error');
    }
});

// Update client
async function updateClient(clientId, updates) {
    try {
        const patchOperations = Object.entries(updates).map(([key, value]) => ({
            op: "replace",
            path: `/${key}`,
            value: value
        }));

        const response = await fetch(`${UPDATE_CLIENT_ENDPOINT}${clientId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json-patch+json',
            },
            body: JSON.stringify(patchOperations),
        });

        if (!response.ok) {
            throw new Error('Failed to update client');
        }

        const updatedClient = await response.json();
        displayClientDetails(updatedClient);
        
        // Update the client in the allClients array
        const index = allClients.findIndex(client => client.client_id === clientId);
        if (index !== -1) {
            allClients[index] = updatedClient;
        }
        
        applyFiltersAndPagination();
    } catch (error) {
        console.error('Error updating client:', error);
        showToast('Failed to update client. Please try again.', 'error');
    }
}

// Initial load
fetchAllClients();