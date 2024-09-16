document.addEventListener('DOMContentLoaded', (event) => {
    // Validate client name
    htmx.onLoad(function(elt) {
        const clientNameInput = elt.querySelector('#clientName');
        if (clientNameInput) {
            clientNameInput.addEventListener('input', function(e) {
                const value = e.target.value.trim();
                if (value.length < 3) {
                    e.target.setCustomValidity('Client name must be at least 3 characters long');
                } else {
                    e.target.setCustomValidity('');
                }
            });
        }
    });

    // Validate redirect URIs
    htmx.onLoad(function(elt) {
        const redirectUrisContainer = elt.querySelector('#redirectUrisContainer');
        if (redirectUrisContainer) {
            redirectUrisContainer.addEventListener('input', function(e) {
                if (e.target.classList.contains('redirectUri')) {
                    // This regex pattern is more permissive and allows various URI schemes
                    const uriRegex = /^[a-z][a-z0-9+.-]*:.+$/i;
                    if (e.target.value && !uriRegex.test(e.target.value)) {
                        e.target.setCustomValidity('Please enter a valid URI');
                    } else {
                        e.target.setCustomValidity('');
                    }
                }
            });
        }
    });

    // Validate at least one grant type is selected
    htmx.onLoad(function(elt) {
        const grantTypesContainer = elt.querySelector('#grantTypesContainer');
        if (grantTypesContainer) {
            grantTypesContainer.addEventListener('change', function(e) {
                const checkedGrantTypes = grantTypesContainer.querySelectorAll('input[type="checkbox"]:checked');
                if (checkedGrantTypes.length === 0) {
                    e.target.setCustomValidity('At least one grant type must be selected');
                } else {
                    e.target.setCustomValidity('');
                }
            });
        }
    });
});