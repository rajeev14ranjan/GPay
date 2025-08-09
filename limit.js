// Rate limiting configuration
const RATE_LIMIT = {
    maxUsesPerDay: 5,
    resetHours: 24,
    storageKeys: {
        primary: 'gpay_usage_data',
        backup: 'gpay_backup_data',
        fingerprint: 'gpay_fp_data'
    }
};

// Additional obfuscation - encoded configuration
const _cfg = btoa(JSON.stringify({
    m: 5, // max uses
    r: 24, // reset hours  
    s: ['gpay_usage_data', 'gpay_backup_data', 'gpay_fp_data'],
    k: 'gpay_secret_' + new Date().getFullYear()
}));

// Backdoor mechanism - obfuscated
const _bk = {
    p: 'YWRtaW4yMDI1Z3BheQ==', // encoded password hash
    k: 'gpay_override_key',
    active: false,
    checkOverride: function() {
        try {
            const override = localStorage.getItem(this.k);
            if (override) {
                const decoded = JSON.parse(atob(override));
                const now = Date.now();
                // Check if override is still valid (24 hours)
                if (decoded.exp > now && decoded.fp === generateFingerprint()) {
                    this.active = true;
                    return true;
                } else {
                    localStorage.removeItem(this.k);
                }
            }
        } catch (e) {}
        return false;
    },
    activate: function(password) {
        if (btoa(password) === this.p) {
            const override = {
                exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                fp: generateFingerprint(),
                t: Date.now()
            };
            localStorage.setItem(this.k, btoa(JSON.stringify(override)));
            this.active = true;
            return true;
        }
        return false;
    }
};

// Generate a more sophisticated browser fingerprint
function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
    
    const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.deviceMemory || 'unknown',
        navigator.platform,
        navigator.cookieEnabled,
        typeof(Worker) !== 'undefined'
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

// Anti-manipulation: Validate data integrity
function validateUsageData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.fingerprint || typeof data.fingerprint !== 'string') return false;
    if (!Array.isArray(data.uses)) return false;
    if (typeof data.totalUses !== 'number') return false;
    if (typeof data.firstUse !== 'number') return false;
    if (typeof data.lastReset !== 'number') return false;
    
    // Check for reasonable values
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (data.firstUse > now || data.firstUse < (now - maxAge)) return false;
    if (data.lastReset > now || data.lastReset < (now - maxAge)) return false;
    
    // Check uses array integrity
    for (const useTime of data.uses) {
        if (typeof useTime !== 'number' || useTime > now || useTime < (now - maxAge)) {
            return false;
        }
    }
    
    return true;
}

// Get or create usage data with multiple storage mechanisms
function getUsageData() {
    const fp = generateFingerprint();
    const now = Date.now();
    
    let usageData = null;
    
    // Try multiple storage locations
    const storageKeys = [
        RATE_LIMIT.storageKeys.primary,
        RATE_LIMIT.storageKeys.backup,
        `gpay_${fp}_data`,
        `gpay_session_${Math.floor(now / (1000 * 60 * 60 * 12))}`, // 12-hour rotating key
        atob(_cfg).split('k":"')[1]?.split('"')[0] + '_data' // Obfuscated key
    ];
    
    // Try to load from any storage location
    for (const key of storageKeys) {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (validateUsageData(parsed) && parsed.fingerprint === fp) {
                    usageData = parsed;
                    break;
                }
            }
        } catch (e) {
            console.debug('Storage read failed for key:', key);
        }
    }
    
    // Create new usage data if none found
    if (!usageData) {
        usageData = {
            fingerprint: fp,
            uses: [],
            totalUses: 0,
            firstUse: now,
            lastReset: now,
            warningShown: false,
            _v: '1.0', // version
            _cs: btoa(fp + now) // checksum
        };
    }
    
    // Clean old usage data (older than resetHours)
    const resetTime = RATE_LIMIT.resetHours * 60 * 60 * 1000;
    const cutoff = now - resetTime;
    
    // Check if we need to reset
    if (now - usageData.lastReset > resetTime) {
        usageData.uses = [];
        usageData.totalUses = 0;
        usageData.lastReset = now;
        usageData.warningShown = false;
        usageData._cs = btoa(fp + now);
    } else {
        // Filter out old uses
        usageData.uses = usageData.uses.filter(useTime => useTime > cutoff);
    }
    
    return usageData;
}

// Save usage data to multiple locations
function saveUsageData(usageData) {
    const dataStr = JSON.stringify(usageData);
    const fp = usageData.fingerprint;
    const now = Date.now();
    
    const storageKeys = [
        RATE_LIMIT.storageKeys.primary,
        RATE_LIMIT.storageKeys.backup,
        `gpay_${fp}_data`,
        `gpay_session_${Math.floor(now / (1000 * 60 * 60 * 12))}`,
        atob(_cfg).split('k":"')[1]?.split('"')[0] + '_data'
    ];
    
    // Save to multiple locations
    storageKeys.forEach(key => {
        try {
            localStorage.setItem(key, dataStr);
        } catch (e) {
            console.debug('Storage save failed for key:', key);
        }
    });
    
    // Also try sessionStorage as backup
    try {
        sessionStorage.setItem('gpay_temp_data', dataStr);
    } catch (e) {
        console.debug('Session storage failed');
    }

    // Additional backup in a cookie (encoded)
    try {
        const encodedData = btoa(dataStr).substring(0, 100); // Truncated for cookie size
        document.cookie = `gpay_bk=${encodedData}; max-age=${24 * 60 * 60}; SameSite=Strict`;
    } catch (e) {
        console.debug('Cookie backup failed');
    }
}

// Check if rate limit is exceeded
function isRateLimited() {
    // Check for backdoor override first
    if (_bk.checkOverride()) {
        return {
            limited: false,
            remaining: 999,
            resetIn: 0,
            usageData: null,
            override: true
        };
    }

    const usageData = getUsageData();
    const now = Date.now();
    
    // Count recent uses
    const recentUses = usageData.uses.length;
    
    if (recentUses >= RATE_LIMIT.maxUsesPerDay) {
        // Show progressive warnings
        if (!usageData.warningShown) {
            usageData.warningShown = true;
            saveUsageData(usageData);
        }
        return {
            limited: true,
            remaining: 0,
            resetIn: Math.ceil((usageData.lastReset + (RATE_LIMIT.resetHours * 60 * 60 * 1000) - now) / (60 * 60 * 1000)),
            usageData: usageData
        };
    }
    
    return {
        limited: false,
        remaining: RATE_LIMIT.maxUsesPerDay - recentUses,
        resetIn: Math.ceil((usageData.lastReset + (RATE_LIMIT.resetHours * 60 * 60 * 1000) - now) / (60 * 60 * 1000)),
        usageData: usageData
    };
}

// Record a new use with integrity check
function recordUse() {
    const usageData = getUsageData();
    const now = Date.now();
    
    // Anti-manipulation: Check for suspicious activity
    if (usageData.uses.length > 0) {
        const lastUse = Math.max(...usageData.uses);
        if (now - lastUse < 1000) { // Less than 1 second between uses
            console.warn('Suspicious activity detected');
            return false;
        }
    }
    
    usageData.uses.push(now);
    usageData.totalUses++;
    usageData._cs = btoa(usageData.fingerprint + now); // Update checksum
    
    saveUsageData(usageData);
    return true;
}

// Progressive delay based on usage - REMOVED (keeping function for compatibility)
function calculateDelay(usageCount) {
    return 500; // Very minimal delay just for UI feedback
}

// Show warning when approaching limit
function showUsageWarning(remaining) {
    if (remaining === 2) {
        setTimeout(() => {
            alert('⚠️ Limit Notice\n\nYou have 2 uses remaining today.\nThis limit helps prevent misuse of the tool.\n\nLimit resets every 24 hours.');
        }, 1500);
    } else if (remaining === 1) {
        setTimeout(() => {
            alert('⚠️ Final Warning\n\nThis is your LAST use for today.\nThe tool will be locked for 24 hours after this.\n\nUse it wisely!');
        }, 1500);
    }
}

// Update button state and text
function updatePayAgainButton() {
    const button = document.querySelector('.pay-again-btn');
    const status = isRateLimited();
    
    if (status.override) {
        button.style.backgroundColor = 'rgba(38, 86, 200, 1)'; // Keep normal blue color
        button.style.cursor = 'pointer';
        button.textContent = 'Capture';
        button.disabled = false;
    } else if (status.limited) {
        button.style.backgroundColor = '#666';
        button.style.cursor = 'not-allowed';
        button.textContent = `Limit reached (${status.resetIn}h)`;
        button.disabled = true;
    } else {
        button.style.backgroundColor = 'rgba(38, 86, 200, 1)';
        button.style.cursor = 'pointer';
        button.textContent = `Capture (${status.remaining} left)`;
        button.disabled = false;
    }
}

// Initialize backdoor trigger on page load
document.addEventListener('DOMContentLoaded', function() {
    updatePayAgainButton();
    
    // Alternative backdoor - triple click on footer
    let footerClicks = 0;
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.addEventListener('click', function() {
            footerClicks++;
            setTimeout(() => footerClicks = 0, 2000); // Reset after 2 seconds
            
            if (footerClicks === 3) {
                const password = prompt('🔐 Admin Access:');
                if (password && _bk.activate(password)) {
                    alert('✅ Admin override enabled');
                    updatePayAgainButton();
                } else if (password) {
                    alert('❌ Access denied');
                }
                footerClicks = 0;
            }
        });
    }
});

// Screenshot Protection Module
const ScreenshotProtection = {
    init: function() {
        this.addKeyboardProtection();
        this.addVisibilityProtection();
        this.addFocusProtection();
        this.addContextMenuProtection();
        this.addDevToolsProtection();
        console.log('Screenshot protection initialized');
    },

    addKeyboardProtection: function() {
        document.addEventListener('keydown', function(e) {
            // PrintScreen key
            if (e.keyCode === 44 || e.key === 'PrintScreen') {
                e.preventDefault();
                alert('⚠️ Screenshots are not allowed for security reasons.');
                return false;
            }
            
            // Cmd/Ctrl + Shift + S (screenshot shortcuts)
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'S' || e.keyCode === 83)) {
                e.preventDefault();
                alert('⚠️ Screenshots are not allowed for security reasons.');
                return false;
            }
            
            // Mac screenshot shortcuts: Cmd+Ctrl+Shift+4 and Cmd+Ctrl+Shift+5
            if (e.metaKey && e.ctrlKey && e.shiftKey && (e.keyCode === 52 || e.key === '4')) {
                e.preventDefault();
                alert('⚠️ Mac screenshot shortcut blocked for security reasons.');
                return false;
            }
            
            if (e.metaKey && e.ctrlKey && e.shiftKey && (e.keyCode === 53 || e.key === '5')) {
                e.preventDefault();
                alert('⚠️ Mac screenshot shortcut blocked for security reasons.');
                return false;
            }
            
            // Other common screenshot combinations
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.keyCode === 52 || e.keyCode === 53 || e.keyCode === 54)) {
                e.preventDefault();
                alert('⚠️ Screenshots are not allowed for security reasons.');
                return false;
            }
            
            // Additional Mac screenshot shortcuts: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
            if (e.metaKey && e.shiftKey && (e.keyCode === 51 || e.key === '3')) {
                e.preventDefault();
                alert('⚠️ Mac screenshot shortcut blocked for security reasons.');
                return false;
            }
            
            if (e.metaKey && e.shiftKey && (e.keyCode === 52 || e.key === '4')) {
                e.preventDefault();
                alert('⚠️ Mac screenshot shortcut blocked for security reasons.');
                return false;
            }
            
            if (e.metaKey && e.shiftKey && (e.keyCode === 53 || e.key === '5')) {
                e.preventDefault();
                alert('⚠️ Mac screenshot shortcut blocked for security reasons.');
                return false;
            }
        });
    },

    addVisibilityProtection: function() {
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // Temporarily hide sensitive content
                document.body.style.visibility = 'hidden';
                setTimeout(() => {
                    if (!document.hidden) {
                        document.body.style.visibility = 'visible';
                    }
                }, 500);
            } else {
                document.body.style.visibility = 'visible';
            }
        });
    },

    addFocusProtection: function() {
        let focusLost = false;
        
        window.addEventListener('blur', function() {
            focusLost = true;
            document.body.classList.add('screenshot-protection');
            setTimeout(() => {
                if (focusLost) {
                    document.body.style.filter = 'blur(10px)';
                }
            }, 100);
        });
        
        window.addEventListener('focus', function() {
            focusLost = false;
            document.body.classList.remove('screenshot-protection');
            document.body.style.filter = 'none';
        });
    },

    addContextMenuProtection: function() {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
    },

    addDevToolsProtection: function() {
        document.addEventListener('keydown', function(e) {
            if (e.keyCode === 123 || // F12
                (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
                (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
                (e.ctrlKey && e.keyCode === 85)) { // Ctrl+U
                e.preventDefault();
                alert('⚠️ Developer tools are not allowed for security reasons.');
                return false;
            }
        });
    }
};

// Initialize screenshot protection when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    ScreenshotProtection.init();
});
