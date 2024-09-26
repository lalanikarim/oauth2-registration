function generateClientListItem(client) {
    return `
        <li>
            <span>${client.client_name}</span>
            <span>${client.client_id}</span>
            <button hx-get="/api/clients/${client.client_id}" hx-target="#mainContent">View Details</button>
            <button hx-get="/api/clients/${client.client_id}/edit" hx-target="#mainContent">Edit</button>
        </li>
    `;
}

function generateClientDetails(client) {
    return `
        <h3>${client.client_name}</h3>
        <p><strong>Client ID:</strong> ${client.client_id}</p>
        <p><strong>Client Secret:</strong> ${client.client_secret || 'hidden'}</p>
        <p><strong>Redirect URIs:</strong> ${Array.isArray(client.redirect_uris) ? client.redirect_uris.join(', ') : 'N/A'}</p>
        <p><strong>Grant Types:</strong> ${Array.isArray(client.grant_types) ? client.grant_types.join(', ') : 'N/A'}</p>
        <p><strong>Response Types:</strong> ${Array.isArray(client.response_types) ? client.response_types.join(', ') : 'N/A'}</p>
        <p><strong>Scope:</strong> ${client.scope || 'N/A'}</p>
        <p><strong>Token Endpoint Auth Method:</strong> ${client.token_endpoint_auth_method || 'N/A'}</p>
        <p><strong>Owner:</strong> ${client.owner || 'N/A'}</p>
        <p><strong>Contacts:</strong> ${Array.isArray(client.contacts) ? client.contacts.join(', ') : 'N/A'}</p>
        <p><strong>Client URI:</strong> ${client.client_uri || 'N/A'}</p>
        <p><strong>Logo URI:</strong> ${client.logo_uri || 'N/A'}</p>
        <p><strong>Terms of Service URI:</strong> ${client.tos_uri || 'N/A'}</p>
    `;
}

function generateEditForm(client) {
    return `
        <form id="editClientForm" hx-put="/api/clients/${client.client_id}" hx-target="#mainContent">
            <label for="clientName">Client Name:</label>
            <input type="text" id="clientName" name="clientName" value="${client.client_name}" required minlength="3">

            <label>Redirect URIs:</label>
            <div id="redirectUrisContainer">
                ${Array.isArray(client.redirect_uris) ? client.redirect_uris.map((uri, index) => `
                    <div class="input-group">
                        <input type="text" name="redirectUris[]" class="redirectUri" value="${uri}">
                        ${index > 0 ? '<button type="button" onclick="removeField(this)">Remove</button>' : ''}
                    </div>
                `).join('') : ''}
            </div>
            <button type="button" onclick="addRedirectUri()">Add Redirect URI</button>

            <label>Grant Types:</label>
            <div id="grantTypesContainer">
                <label><input type="checkbox" name="grantTypes[]" value="authorization_code" ${Array.isArray(client.grant_types) && client.grant_types.includes('authorization_code') ? 'checked' : ''}> Authorization Code</label>
                <label><input type="checkbox" name="grantTypes[]" value="client_credentials" ${Array.isArray(client.grant_types) && client.grant_types.includes('client_credentials') ? 'checked' : ''}> Client Credentials</label>
                <label><input type="checkbox" name="grantTypes[]" value="refresh_token" ${Array.isArray(client.grant_types) && client.grant_types.includes('refresh_token') ? 'checked' : ''}> Refresh Token</label>
            </div>

            <label>Response Types:</label>
            <div id="responseTypesContainer">
                <label><input type="checkbox" name="responseTypes[]" value="code" ${Array.isArray(client.response_types) && client.response_types.includes('code') ? 'checked' : ''}> Code</label>
                <label><input type="checkbox" name="responseTypes[]" value="token" ${Array.isArray(client.response_types) && client.response_types.includes('token') ? 'checked' : ''}> Token</label>
            </div>

            <label>Scopes:</label>
            <div id="scopesContainer">
                ${client.scope ? client.scope.split(' ').map((scope, index) => `
                    <div class="input-group">
                        <input type="text" name="scopes[]" class="scope" value="${scope}">
                        ${index > 0 ? '<button type="button" onclick="removeField(this)">Remove</button>' : ''}
                    </div>
                `).join('') : ''}
            </div>
            <button type="button" onclick="addScope()">Add Scope</button>

            <label>Token Endpoint Auth Method:</label>
            <div id="tokenEndpointAuthMethodContainer">
                <label><input type="radio" name="tokenEndpointAuthMethod" value="client_secret_basic" ${client.token_endpoint_auth_method === 'client_secret_basic' ? 'checked' : ''}> Client Secret Basic</label>
                <label><input type="radio" name="tokenEndpointAuthMethod" value="client_secret_post" ${client.token_endpoint_auth_method === 'client_secret_post' ? 'checked' : ''}> Client Secret Post</label>
                <label><input type="radio" name="tokenEndpointAuthMethod" value="none" ${client.token_endpoint_auth_method === 'none' ? 'checked' : ''}> None</label>
            </div>

            <label for="owner">Owner:</label>
            <input type="text" id="owner" name="owner" value="${client.owner || ''}">

            <label>Contacts:</label>
            <div id="contactsContainer">
                ${Array.isArray(client.contacts) ? client.contacts.map((contact, index) => `
                    <div class="input-group">
                        <input type="text" name="contacts[]" class="contact" value="${contact}">
                        ${index > 0 ? '<button type="button" onclick="removeField(this)">Remove</button>' : ''}
                    </div>
                `).join('') : ''}
            </div>
            <button type="button" onclick="addContact()">Add Contact</button>

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

function generatePagination(currentPage, totalPages, searchParams) {
    let paginationHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        const pageUrl = `/api/clients?page=${i}${searchParams}`;
        paginationHtml += `<button hx-get="${pageUrl}" hx-target="#mainContent" class="page-btn${i === currentPage ? ' active' : ''}">${i}</button>`;
    }
    return paginationHtml;
}

module.exports = {
    generateClientListItem,
    generateClientDetails,
    generateEditForm,
    generatePagination
};