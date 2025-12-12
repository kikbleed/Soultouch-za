/* 
    ============================================
    SOULTOUCH ZA - ADMIN SHARED FUNCTIONALITY
    ============================================
*/

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/admin/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = 'login.html';
            }
        });
    }
});

// Check admin authentication
async function checkAdminAuth() {
    // This is a simple check - in production you'd want more robust auth
    // For now, we rely on the server-side cookie check
    return true;
}

// Format currency
function formatCurrency(amount) {
    return `R${amount.toFixed(2)}`;
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format status
function formatStatus(status) {
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: var(--glass-bg);
        backdrop-filter: blur(var(--glass-blur));
        border: 1px solid var(--glass-border);
        border-radius: var(--glass-radius);
        color: var(--text-primary);
        box-shadow: var(--glass-shadow);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

