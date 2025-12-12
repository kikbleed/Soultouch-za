// Authentication state management for the main application
// Uses the shared db instance from client-db.js

let db = null;

// Wait for DB to be ready
async function waitForDB() {
    if (window.db) {
        return window.db;
    }
    
    if (window.initDB) {
        return await window.initDB();
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return waitForDB();
}

// Check if user is logged in
async function checkAuth() {
    if (!db || !db.auth) {
        return null;
    }
    
    // Feature detection: try different methods to get current user
    try {
        // Try db.auth.user (property)
        if (db.auth.user !== undefined) {
            return db.auth.user;
        }
        
        // Try db.auth.getUser() (method)
        if (typeof db.auth.getUser === 'function') {
            return await db.auth.getUser();
        }
        
        // Try useAuth hook result (if available in React context)
        if (db.useAuth && typeof db.useAuth === 'function') {
            const authResult = db.useAuth();
            return authResult?.user || null;
        }
    } catch (error) {
        console.log('Could not check auth:', error);
    }
    
    return null;
}

// Update UI based on auth state
function updateAuthUI(user) {
    const authButton = document.getElementById('authButton');
    const userProfile = document.getElementById('userProfile');
    
    if (user) {
        // User is signed in
        if (authButton) {
            authButton.textContent = 'Sign Out';
            authButton.href = '#';
            authButton.onclick = handleSignOut;
        }
        
        if (userProfile) {
            userProfile.style.display = 'flex';
            const userEmail = document.getElementById('userEmail');
            if (userEmail) {
                userEmail.textContent = user.email || 'User';
            }
        }
    } else {
        // User is not signed in
        if (authButton) {
            authButton.textContent = 'Sign In';
            authButton.href = '/signin.html';
            authButton.onclick = null;
        }
        
        if (userProfile) {
            userProfile.style.display = 'none';
        }
    }
}

// Handle sign out
async function handleSignOut(e) {
    e.preventDefault();
    
    if (!db || !db.auth) {
        console.error('DB not available');
        return;
    }

    try {
        if (typeof db.auth.signOut === 'function') {
            await db.auth.signOut();
        } else {
            console.warn('signOut method not available');
        }
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out: ' + (error.message || 'Unknown error'));
    }
}

// Initialize auth state
async function initAuth() {
    try {
        db = await waitForDB();
        console.log('Auth module initialized');
        
        // Check current auth state
        const user = await checkAuth();
        updateAuthUI(user);
        
        // Poll for auth changes every 2 seconds (since onChange is not available)
        setInterval(async () => {
            const currentUser = await checkAuth();
            updateAuthUI(currentUser);
        }, 2000);
        
    } catch (error) {
        console.warn('Failed to initialize auth:', error);
        updateAuthUI(null);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
