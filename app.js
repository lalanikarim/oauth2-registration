// API endpoints
const API_BASE_URL = '/api';
const LIST_CLIENTS_ENDPOINT = `${API_BASE_URL}/clients`;
const CLIENT_DETAILS_ENDPOINT = `${API_BASE_URL}/clients/`;
const REGISTER_CLIENT_ENDPOINT = `${API_BASE_URL}/clients`;

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

// Fetch and display client list
async function fetchClients() {
    try {
        const response = await fetch(LIST_CLIENTS_ENDPOINT);
        const clients = await response.json();
        clientListItems.innerHTML = clients.map(client => `
            <li onclick="fetchClientDetails('${client.client_id}')">${client.client_name}</li>
        `).join('');
    } catch (error) {
        console.error('Error fetching clients:', error);
        showToast('Error fetching clients. Please try again.', 'error');
    }
}

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
        <p><strong>Contacts:</strong> ${client.contacts.join(', ') || 'N/A'}</p>
        <p><strong>Client URI:</strong> ${client.client_uri || 'N/A'}</p>
        <p><strong>Logo URI:</strong> ${client.logo_uri || 'N/A'}</p>
        <p><strong>Terms of Service URI:</strong> ${client.tos_uri || 'N/A'}</p>
        <p><strong>Created At:</strong> ${client.created_at}</p>
        <p><strong>Updated At:</strong> ${client.updated_at}</p>
    `;
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
        fetchClients(); // Refresh client list
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

// Initial load
fetchClients();