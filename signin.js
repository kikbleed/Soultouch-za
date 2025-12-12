// Sign-in page JavaScript
// Handles email magic code authentication using InstantDB

console.log("signin.js loaded ✅");

let currentEmail = '';
let isCodeSent = false;
let db = null;

// DOM elements (will be set after DOM is ready)
let signinForm;
let emailInput;
let codeInput;
let codeInputGroup;
let sendMagicCodeBtn;
let submitText;
let resendBtn;
let changeEmailBtn;
let errorMessage;
let successMessage;
let profileSection;
let profileForm;
let testSection;
let writeTestBtn;
let testResult;

// Wait for DB to be ready
async function waitForDB(maxAttempts = 50) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        if (window.db) {
            return window.db;
        }
        
        if (window.initDB) {
            try {
                return await window.initDB();
            } catch (error) {
                throw new Error(`InstantDB initialization failed: ${error.message}`);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    throw new Error('Timeout waiting for InstantDB to initialize');
}

// Check if user is already logged in
async function checkExistingAuth() {
    if (!db || !db.auth) {
        return null;
    }
    
    // Wait a bit for auth state to update after signIn
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Feature detection: try different methods to get current user
    try {
        // Try db.auth.user (property)
        if (db.auth.user !== undefined && db.auth.user !== null) {
            console.log('✅ Found user via db.auth.user:', db.auth.user);
            return db.auth.user;
        }
        
        // Try db.auth.getUser() (method)
        if (typeof db.auth.getUser === 'function') {
            const user = await db.auth.getUser();
            if (user) {
                console.log('✅ Found user via db.auth.getUser():', user);
                return user;
            }
        }
        
        // Try useAuth hook result (if available)
        if (db.useAuth && typeof db.useAuth === 'function') {
            const authResult = db.useAuth();
            if (authResult?.user) {
                console.log('✅ Found user via db.useAuth():', authResult.user);
                return authResult.user;
            }
        }
        
        console.log('⚠️ No user found via any method');
    } catch (error) {
        console.log('❌ Error checking existing auth:', error);
    }
    
    return null;
}

// Initialize DOM elements
function initDOMElements() {
    signinForm = document.getElementById('signinForm');
    emailInput = document.getElementById('email');
    codeInput = document.getElementById('code');
    codeInputGroup = document.getElementById('codeInputGroup');
    sendMagicCodeBtn = document.getElementById('sendMagicCode');
    submitText = document.getElementById('submitText');
    resendBtn = document.getElementById('resendBtn');
    changeEmailBtn = document.getElementById('changeEmailBtn');
    errorMessage = document.getElementById('errorMessage');
    successMessage = document.getElementById('successMessage');
    profileSection = document.getElementById('profileSection');
    profileForm = document.getElementById('profileForm');
    testSection = document.getElementById('testSection');
    writeTestBtn = document.getElementById('writeTestBtn');
    testResult = document.getElementById('testResult');
    
    // Check critical elements
    const missing = [];
    if (!emailInput) missing.push('email');
    if (!sendMagicCodeBtn) missing.push('sendMagicCode');
    
    if (missing.length > 0) {
        console.error('❌ Missing critical DOM elements:', missing);
        showError(`Page error: Missing elements: ${missing.join(', ')}`);
        return false;
    }
    
    console.log('✅ All critical DOM elements found');
    console.log('✅ Button element:', sendMagicCodeBtn);
    return true;
}

// Attach event listeners
function attachEventListeners() {
    // Handle Send Magic Code button click
    if (sendMagicCodeBtn) {
        sendMagicCodeBtn.addEventListener('click', async () => {
            console.log('🚀 Button clicked');
            
            const email = emailInput.value.trim().toLowerCase();
            
            if (!email) {
                showError('Please enter your email address');
                return;
            }

            if (!isCodeSent) {
                await sendMagicCode(email);
            } else {
                const code = codeInput.value.trim();
                if (!code) {
                    showError('Please enter the magic code');
                    return;
                }
                await verifyCode(code);
            }
        });
        console.log('✅ Button click listener attached to:', sendMagicCodeBtn);
    } else {
        console.error('❌ sendMagicCodeBtn not found - cannot attach listener!');
    }

    // Resend code
    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            console.log('📤 Resend clicked');
            if (currentEmail) {
                isCodeSent = false;
                await sendMagicCode(currentEmail);
            }
        });
    }

    // Change email
    if (changeEmailBtn) {
        changeEmailBtn.addEventListener('click', () => {
            console.log('🔄 Change email clicked');
            isCodeSent = false;
            hideCodeInput();
            emailInput.disabled = false;
            emailInput.value = '';
            emailInput.focus();
            currentEmail = '';
            hideMessages();
        });
    }

    // Handle profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('💾 Save profile clicked');
            await saveProfile();
        });
    }

    // Write test
    if (writeTestBtn) {
        writeTestBtn.addEventListener('click', async () => {
            console.log('🧪 Write test clicked');
            await writeTest();
        });
    }
}

// Initialize
async function init() {
    const initMessage = document.getElementById('initMessage');
    
    try {
        // Initialize DOM elements first
        if (!initDOMElements()) {
            return;
        }
        
        // Attach event listeners
        attachEventListeners();
        
        // Wait for DB
        db = await waitForDB();
        console.log('✅ DB ready for signin');
        
        // Verify db has auth methods
        if (!db || !db.auth) {
            throw new Error('InstantDB initialized but auth methods are missing');
        }
        
        // Hide init message
        if (initMessage) {
            initMessage.style.display = 'none';
        }
        
        // Check if user is already logged in
        const existingUser = await checkExistingAuth();
        if (existingUser) {
            console.log('User already logged in, redirecting...');
            window.location.href = '/index.html';
            return;
        }
        
        console.log('✅ Ready for authentication');
        
    } catch (error) {
        console.error('❌ Failed to initialize signin:', error);
        
        if (initMessage) {
            initMessage.style.display = 'none';
        }
        
        showError(`Initialization error: ${error.message}. Check browser console for details.`);
    }
}

// Send magic code
async function sendMagicCode(email) {
    if (!db || !db.auth) {
        showError('Authentication system not ready. Please refresh the page.');
        return;
    }
    
    setLoading(true);
    hideMessages();
    
    currentEmail = email;
    
    try {
        console.log(`📧 Sending magic code to: ${email.substring(0, 3)}***@${email.split('@')[1]}`);
        
        await db.auth.sendMagicCode({ email });
        
        setLoading(false);
        isCodeSent = true;
        showCodeInput();
        showSuccess('Magic code sent! Check your email.');
        emailInput.disabled = true;
        
        console.log('✅ Magic code sent successfully');
    } catch (error) {
        setLoading(false);
        console.error('❌ Send magic code error:', error);
        showError(error.message || 'Failed to send magic code. Please try again.');
    }
}

// Verify magic code
async function verifyCode(code) {
    if (!db || !db.auth) {
        showError('Authentication system not ready. Please refresh the page.');
        return;
    }
    
    setLoading(true);
    hideMessages();
    
    if (!currentEmail) {
        currentEmail = emailInput.value.trim().toLowerCase();
    }
    
    try {
        console.log(`🔐 Verifying code: ${code.substring(0, 2)}*** for email: ${currentEmail.substring(0, 3)}***`);
        
        const result = await db.auth.signInWithMagicCode({
            email: currentEmail,
            code: code
        });
        
        console.log('✅ signInWithMagicCode result:', result);
        
        setLoading(false);
        showSuccess('Sign in successful! Loading profile...');
        
        console.log('✅ Code verified successfully');
        
        // Wait longer for auth state to propagate, then check profile
        setTimeout(async () => {
            await checkAndShowProfile();
        }, 1000);
        
    } catch (error) {
        setLoading(false);
        console.error('❌ Verify code error:', error);
        showError(error.message || 'Invalid code. Please check and try again.');
        codeInput.value = '';
        codeInput.focus();
    }
}

// Check if profile exists and show form if needed
async function checkAndShowProfile() {
    try {
        // Get current user with retries
        let user = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!user && attempts < maxAttempts) {
            console.log(`Attempt ${attempts + 1}/${maxAttempts} to get user info...`);
            user = await checkExistingAuth();
            
            if (!user) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
        }
        
        if (!user) {
            showError('Could not retrieve user information after authentication. Please refresh and try again.');
            console.error('❌ Failed to get user after', maxAttempts, 'attempts');
            
            // As a fallback, just redirect - maybe the auth state will be available on the next page
            setTimeout(() => {
                console.log('Redirecting anyway...');
                window.location.href = '/index.html';
            }, 2000);
            return;
        }
        
        console.log('✅ Checking profile for user:', user.id);
        
        // Query for user profile
        const { data } = await db.query({
            profiles: {
                $: {
                    where: {
                        userId: user.id
                    }
                }
            }
        });
        
        if (data.profiles && data.profiles.length > 0) {
            // Profile exists - show success and redirect
            showSuccess('Login successful! Profile found. Redirecting...');
            
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);
        } else {
            // No profile - show profile form
            console.log('No profile found, showing profile form');
            showProfileForm(user);
        }
    } catch (error) {
        console.error('❌ Error checking profile:', error);
        
        // Try one more time to get user
        const user = await checkExistingAuth();
        if (user) {
            showProfileForm(user);
        } else {
            showError('Failed to check profile. Redirecting to home page...');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
        }
    }
}

// Show profile form
function showProfileForm(user) {
    hideMessages();
    if (signinForm) signinForm.style.display = 'none';
    if (profileSection) {
        profileSection.style.display = 'block';
        
        // Pre-fill email if available
        const profileEmailInput = document.getElementById('profileEmail');
        if (profileEmailInput && user.email) {
            profileEmailInput.value = user.email;
        }
    }
}

// Save profile
async function saveProfile() {
    const user = await checkExistingAuth();
    if (!user) {
        showError('Not authenticated');
        return;
    }
    
    const fullName = document.getElementById('profileFullName').value.trim();
    const surname = document.getElementById('profileSurname').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    
    if (!fullName || !surname) {
        showError('Full name and surname are required');
        return;
    }
    
    try {
        setLoading(true);
        
        const now = Date.now();
        
        // Upsert profile
        await db.transact([
            db.tx.profiles[db.id()].update({
                userId: user.id,
                email: email || currentEmail,
                fullName,
                surname,
                phone: phone || null,
                createdAt: now,
                updatedAt: now
            })
        ]);
        
        setLoading(false);
        showSuccess('Profile saved successfully! Redirecting...');
        
        // Show test section
        if (testSection) {
            testSection.style.display = 'block';
        }
        
        // Redirect after a delay
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
        
    } catch (error) {
        setLoading(false);
        console.error('Profile save error:', error);
        showError(error.message || 'Failed to save profile. Please try again.');
    }
}

// Write test
async function writeTest() {
    const user = await checkExistingAuth();
    
    if (!db || !user) {
        if (testResult) {
            testResult.textContent = 'Not authenticated';
            testResult.style.color = '#ef4444';
        }
        return;
    }
    
    try {
        writeTestBtn.disabled = true;
        writeTestBtn.textContent = 'Writing...';
        
        const testId = db.id();
        const now = Date.now();
        
        await db.transact([
            db.tx.test[testId].update({
                message: 'Test write from signin page',
                userId: user.id,
                timestamp: now
            })
        ]);
        
        if (testResult) {
            testResult.textContent = `✓ Test record written successfully! ID: ${testId}`;
            testResult.style.color = '#22c55e';
        }
        
        console.log('Test write successful:', testId);
        
    } catch (error) {
        console.error('Test write error:', error);
        if (testResult) {
            testResult.textContent = `✗ Error: ${error.message}`;
            testResult.style.color = '#ef4444';
        }
    } finally {
        writeTestBtn.disabled = false;
        writeTestBtn.textContent = 'Write Test';
    }
}

// Show code input field
function showCodeInput() {
    if (codeInputGroup) {
        codeInputGroup.classList.add('show');
    }
    if (codeInput) {
        codeInput.focus();
    }
    if (submitText) {
        submitText.textContent = 'Verify Code';
    }
}

// Hide code input field
function hideCodeInput() {
    if (codeInputGroup) {
        codeInputGroup.classList.remove('show');
    }
    if (submitText) {
        submitText.textContent = 'Send Magic Code';
    }
    isCodeSent = false;
}

// Show error message
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    }
    if (successMessage) {
        successMessage.classList.remove('show');
    }
}

// Show success message
function showSuccess(message) {
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
    }
    if (errorMessage) {
        errorMessage.classList.remove('show');
    }
}

// Hide all messages
function hideMessages() {
    if (errorMessage) {
        errorMessage.classList.remove('show');
    }
    if (successMessage) {
        successMessage.classList.remove('show');
    }
}

// Set loading state
function setLoading(loading) {
    if (sendMagicCodeBtn) {
        sendMagicCodeBtn.disabled = loading;
    }
    
    if (loading) {
        if (submitText) {
            submitText.innerHTML = '<span class="loading-spinner"></span>Loading...';
        }
    } else {
        if (submitText) {
            submitText.textContent = isCodeSent ? 'Verify Code' : 'Send Magic Code';
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
