// main.js

// ====================
// Configuration Variables
// ====================

// Amazon Cognito User Pool details
const userPoolId = 'YOUR_USER_POOL_ID'; // Replace with your User Pool ID
const clientId = 'YOUR_CLIENT_ID'; // Replace with your App Client ID
const cognitoDomain = 'YOUR_COGNITO_DOMAIN'; // Replace with your Cognito Domain
const redirectUri = 'YOUR_REDIRECT_URI'; // Replace with your Redirect URI

// AWS API Gateway endpoints
const storeChatMessageEndpoint = 'YOUR_STORE_MESSAGE_ENDPOINT'; // Replace with your POST endpoint
const getChatMessagesEndpoint = 'YOUR_GET_MESSAGES_ENDPOINT'; // Replace with your GET endpoint

// ====================
// Utility Functions
// ====================

/**
 * Decode a JWT token to extract its payload.
 * @param {string} token - The JWT token.
 * @returns {Object} - The decoded payload.
 */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Failed to parse JWT:', e);
        return {};
    }
}

/**
 * Sanitize input using DOMPurify to prevent XSS attacks.
 * @param {string} input - The input string to sanitize.
 * @returns {string} - The sanitized string.
 */
function sanitize(input) {
    return DOMPurify.sanitize(input);
}

/**
 * Display an error message to the user.
 * @param {string} message - The error message to display.
 */
function displayError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    // Hide the error after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

/**
 * Generate a unique ID for each message.
 * @returns {string} - A unique identifier.
 */
function generateUniqueId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ====================
// Authentication Handling
// ====================

/**
 * Handle the OAuth authorization code by exchanging it for tokens.
 * @param {string} code - The authorization code received from Cognito.
 */
async function handleAuthCode(code) {
    console.log('[handleAuthCode] Processing authentication code...');

    const tokenUrl = `https://${cognitoDomain}/oauth2/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.error_description || response.statusText}`);
        }

        const data = await response.json();

        // Store tokens in localStorage
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('idToken', data.id_token);
        localStorage.setItem('refreshToken', data.refresh_token);

        console.log('[handleAuthCode] Tokens stored successfully.');

        // Remove the code from the URL
        window.history.replaceState({}, document.title, redirectUri);

        // Proceed to show the chat interface
        showChatInterface();

    } catch (error) {
        console.error('[handleAuthCode] Error:', error);
        displayError('Authentication failed. Please try again.');
        showLoginButton();
    }
}

/**
 * Initialize the application by checking for authentication tokens or codes.
 */
async function init() {
    console.log('[init] Initializing application...');

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        // Handle the authorization code
        await handleAuthCode(code);
    } else if (localStorage.getItem('idToken')) {
        // User is already authenticated
        console.log('[init] User is already authenticated.');
        showChatInterface();
    } else {
        // No valid token found, show login container
        console.log('[init] No valid token found. Showing login screen.');
        showLoginContainer();
    }
}

/**
 * Redirect the user to the Cognito login page.
 */
function redirectToLogin() {
    const loginUrl = `https://${cognitoDomain}/login?client_id=${clientId}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = loginUrl;
}

/**
 * Display the login container.
 */
function showLoginContainer() {
    const loginContainer = document.getElementById('login-container');
    const chatContainer = document.getElementById('chat-container');
    const loadingIndicator = document.getElementById('loading-indicator');

    loginContainer.style.display = 'block';
    chatContainer.style.display = 'none';
    loadingIndicator.style.display = 'none';

    showLoginButton();
}

/**
 * Attach event listener to the login button.
 */
function showLoginButton() {
    const signInButton = document.getElementById('sign-in-button');
    signInButton.addEventListener('click', redirectToLogin);
}

// ====================
// Chat Interface Handling
// ====================

/**
 * Display the chat interface and set up event listeners.
 */
async function showChatInterface() {
    const loginContainer = document.getElementById('login-container');
    const chatContainer = document.getElementById('chat-container');
    const loadingIndicator = document.getElementById('loading-indicator');

    loginContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    loadingIndicator.style.display = 'none';

    // Display the username
    const userDisplay = document.getElementById('user-display');
    const idToken = localStorage.getItem('idToken');
    if (idToken) {
        const decodedToken = parseJwt(idToken);
        userDisplay.textContent = decodedToken.nickname || decodedToken['preferred_username'] || decodedToken.email || 'Chatroom';
    }

    // Set up event listeners
    const signOutButton = document.getElementById('sign-out-button');
    signOutButton.addEventListener('click', handleLogout);

    const sendMessageButton = document.getElementById('send-message-button');
    sendMessageButton.addEventListener('click', sendMessage);

    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    // Load existing messages
    await loadMessages();
}

/**
 * Handle user logout by clearing tokens and redirecting to Cognito logout.
 */
function handleLogout() {
    console.log('[handleLogout] Logging out...');
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    // Redirect to logout URL
    const logoutUrl = `https://${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = logoutUrl;
}

// ====================
// Messaging Functions
// ====================

/**
 * Send a new message to the chat.
 */
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (!message) return;

    const idToken = localStorage.getItem('idToken');

    try {
        const response = await fetch(storeChatMessageEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': idToken, // Use the ID token for authentication
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log('Message sent:', data);
        messageInput.value = '';
        // Refresh the messages list
        await loadMessages();

    } catch (error) {
        console.error('Error sending message:', error);
        displayError('Failed to send message. Please try again.');
    }
}

/**
 * Load existing messages from the backend and display them.
 */
async function loadMessages() {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) {
        console.error('No ID token found. Cannot load messages.');
        displayError('You are not authenticated. Please log in again.');
        return;
    }

    try {
        const response = await fetch(getChatMessagesEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': idToken, // Include the ID token for authentication
            },
        });

        if (!response.ok) {
            console.error(`Failed to load messages: ${response.status}`);
            throw new Error('Failed to load messages');
        }

        const data = await response.json();
        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = '';

        // Sort messages by timestamp in ascending order
        const sortedMessages = sortMessagesByTimestamp(data.messages);

        sortedMessages.forEach(item => {
            const messageElement = createMessageElement(item);
            messagesList.appendChild(messageElement);
        });

        // Scroll to the bottom to show the latest messages
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (error) {
        console.error('Error loading messages:', error);
        displayError('Failed to load messages. Please try again.');
    }
}

/**
 * Sort messages by their timestamp in ascending order.
 * @param {Array} messages - The array of message objects.
 * @returns {Array} - The sorted array of messages.
 */
function sortMessagesByTimestamp(messages) {
    return messages.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
}

/**
 * Create a DOM element for a single message.
 * @param {Object} messageData - The message data object.
 * @returns {HTMLElement} - The constructed message DOM element.
 */
function createMessageElement(messageData) {
    const messageElement = document.createElement('li');

    // Determine if the message is from the current user
    const idToken = localStorage.getItem('idToken');
    const decodedToken = parseJwt(idToken);
    const isCurrentUser = messageData.Username === decodedToken['cognito:username'] || messageData.Username === decodedToken.email;

    // Assign appropriate classes for styling
    messageElement.classList.add('message', isCurrentUser ? 'message-right' : 'message-left');

    // Sanitize message content and display name
    const sanitizedMessage = sanitize(messageData.Message);
    const sanitizedDisplayName = sanitize(messageData.DisplayName || 'Unknown');

    // Format timestamp to EST
    const timestamp = new Date(messageData.Timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });

    // Populate the message element's HTML
    messageElement.innerHTML = `
        <strong>${isCurrentUser ? 'You' : sanitizedDisplayName}</strong>
        <span class="message-text">${sanitizedMessage}</span>
        <span class="timestamp">${timestamp}</span>
    `;

    return messageElement;
}

// ====================
// Initialization
// ====================

// Initialize the application when the window loads
window.onload = init;
