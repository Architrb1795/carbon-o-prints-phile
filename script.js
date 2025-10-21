// Storage Manager - Handles localStorage operations
const StorageManager = {
    USERS_KEY: 'ecoPointsUsers',
    CURRENT_USER_KEY: 'ecoPointsCurrentUser',

    getAllUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : {};
    },

    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },

    getCurrentUser() {
        const email = localStorage.getItem(this.CURRENT_USER_KEY);
        if (!email) return null;

        const users = this.getAllUsers();
        return users[email] || null;
    },

    setCurrentUser(email) {
        localStorage.setItem(this.CURRENT_USER_KEY, email);
    },

    clearCurrentUser() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    },

    saveUser(userData) {
        const users = this.getAllUsers();
        users[userData.email] = userData;
        this.saveUsers(users);
    },

    userExists(email) {
        const users = this.getAllUsers();
        return email in users;
    }
};

// Notification Manager - Handles toast notifications
const NotificationManager = {
    element: null,
    timeout: null,

    init() {
        this.element = document.getElementById('notification');
    },

    show(message, type = 'success', duration = 3000) {
        if (!this.element) return;

        this.element.textContent = message;
        this.element.className = `notification ${type} show`;

        if (this.timeout) clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            this.hide();
        }, duration);
    },

    hide() {
        if (!this.element) return;
        this.element.classList.remove('show');
    }
};

// Activity Manager - Handles user activities
const ActivityManager = {
    ACTIVITIES_KEY: 'ecoPointsActivities',

    getActivities(userEmail) {
        const allActivities = localStorage.getItem(this.ACTIVITIES_KEY);
        const activities = allActivities ? JSON.parse(allActivities) : {};
        return activities[userEmail] || [];
    },

    saveActivity(userEmail, activity) {
        const allActivities = localStorage.getItem(this.ACTIVITIES_KEY);
        const activities = allActivities ? JSON.parse(allActivities) : {};

        if (!activities[userEmail]) {
            activities[userEmail] = [];
        }

        activities[userEmail].unshift(activity);

        // Keep only last 100 activities per user
        if (activities[userEmail].length > 100) {
            activities[userEmail] = activities[userEmail].slice(0, 100);
        }

        localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(activities));
    },

    getStats(userEmail) {
        const activities = this.getActivities(userEmail);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const todayActivities = activities.filter(a => new Date(a.timestamp) >= today);
        const weekActivities = activities.filter(a => new Date(a.timestamp) >= weekAgo);

        // Find most common action
        const actionCounts = {};
        activities.forEach(a => {
            actionCounts[a.label] = (actionCounts[a.label] || 0) + 1;
        });

        let favoriteAction = '-';
        let maxCount = 0;
        for (const [action, count] of Object.entries(actionCounts)) {
            if (count > maxCount) {
                maxCount = count;
                favoriteAction = action;
            }
        }

        return {
            total: activities.length,
            today: todayActivities.length,
            week: weekActivities.length,
            favorite: favoriteAction
        };
    }
};

// Utility Functions
const Utils = {
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    },

    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    },

    redirectToLogin() {
        window.location.href = 'index.html';
    }
};

// Action Icons Map
const ACTION_ICONS = {
    'public_transport': '🚌',
    'recycle': '♻️',
    'plant_tree': '🌳',
    'save_energy': '💡',
    'conserve_water': '💧',
    'bike': '🚴'
};

// ==================== SIGNUP PAGE ====================
if (window.location.pathname.includes('signup.html')) {
    // Redirect if already logged in
    const currentUser = StorageManager.getCurrentUser();
    if (currentUser) {
        Utils.redirectToDashboard();
    }

    const form = document.getElementById('signupForm');
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const messageEl = document.getElementById('signupMessage');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();

        // Validation
        if (!name || !email || !password) {
            messageEl.textContent = 'Please fill in all fields.';
            messageEl.className = 'message error';
            return;
        }

        if (!Utils.validateEmail(email)) {
            messageEl.textContent = 'Please enter a valid email address.';
            messageEl.className = 'message error';
            return;
        }

        if (password.length < 6) {
            messageEl.textContent = 'Password must be at least 6 characters long.';
            messageEl.className = 'message error';
            return;
        }

        // Check if user exists
        if (StorageManager.userExists(email)) {
            messageEl.textContent = 'This email is already registered. Please log in.';
            messageEl.className = 'message error';
            return;
        }

        // Create new user
        const newUser = {
            name: name,
            email: email,
            password: password,
            ecoPoints: 0,
            createdAt: new Date().toISOString()
        };

        StorageManager.saveUser(newUser);

        messageEl.textContent = 'Sign up successful! Redirecting to login...';
        messageEl.className = 'message success';

        setTimeout(() => {
            Utils.redirectToLogin();
        }, 1500);
    });
}

// ==================== LOGIN PAGE ====================
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // Redirect if already logged in
    const currentUser = StorageManager.getCurrentUser();
    if (currentUser) {
        Utils.redirectToDashboard();
    }

    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const messageEl = document.getElementById('loginMessage');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            messageEl.textContent = 'Please enter both email and password.';
            messageEl.className = 'message error';
            return;
        }

        const users = StorageManager.getAllUsers();
        const user = users[email];

        if (!user || user.password !== password) {
            messageEl.textContent = 'Invalid email or password. Please try again.';
            messageEl.className = 'message error';
            return;
        }

        // Set current user
        StorageManager.setCurrentUser(email);

        messageEl.textContent = 'Login successful! Redirecting...';
        messageEl.className = 'message success';

        setTimeout(() => {
            Utils.redirectToDashboard();
        }, 1000);
    });
}

// ==================== DASHBOARD PAGE ====================
if (window.location.pathname.includes('dashboard.html')) {
    // Check if logged in
    const currentUser = StorageManager.getCurrentUser();
    if (!currentUser) {
        Utils.redirectToLogin();
    }

    // Initialize notification manager
    NotificationManager.init();

    // Get DOM elements
    const userNameEl = document.getElementById('dashboardUserName');
    const ecoPointsEl = document.getElementById('ecoPointsDisplay');
    const actionButtons = document.querySelectorAll('.eco-action-btn');
    const logoutBtn = document.getElementById('logoutBtn');
    const activityHistoryEl = document.getElementById('activityHistory');

    // Stats elements
    const totalActionsEl = document.getElementById('totalActions');
    const todayActionsEl = document.getElementById('todayActions');
    const thisWeekActionsEl = document.getElementById('thisWeekActions');
    const favoriteActionEl = document.getElementById('favoriteAction');

    // Display user info
    userNameEl.textContent = currentUser.name;
    ecoPointsEl.textContent = currentUser.ecoPoints;

    // Update statistics
    function updateStats() {
        const stats = ActivityManager.getStats(currentUser.email);
        totalActionsEl.textContent = stats.total;
        todayActionsEl.textContent = stats.today;
        thisWeekActionsEl.textContent = stats.week;
        favoriteActionEl.textContent = stats.favorite;
    }

    // Render activity history
    function renderActivityHistory() {
        const activities = ActivityManager.getActivities(currentUser.email);

        if (activities.length === 0) {
            activityHistoryEl.innerHTML = '<p class="empty-state">No activities logged yet. Start earning points!</p>';
            return;
        }

        const html = activities.slice(0, 20).map(activity => `
            <div class="activity-item">
                <div class="activity-info">
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-details">
                        <div class="activity-label">${activity.label}</div>
                        <div class="activity-time">${Utils.formatTimestamp(activity.timestamp)}</div>
                    </div>
                </div>
                <div class="activity-points">+${activity.points}</div>
            </div>
        `).join('');

        activityHistoryEl.innerHTML = html;
    }

    // Update points in storage
    function updateUserPoints(points) {
        currentUser.ecoPoints += points;
        StorageManager.saveUser(currentUser);
        ecoPointsEl.textContent = currentUser.ecoPoints;
    }

    // Handle eco-action button clicks
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const points = parseInt(button.dataset.points);
            const actionType = button.dataset.action;
            const label = button.querySelector('.label').textContent;
            const icon = button.querySelector('.icon').textContent;

            // Save activity
            const activity = {
                action: actionType,
                label: label,
                icon: icon,
                points: points,
                timestamp: new Date().toISOString()
            };

            ActivityManager.saveActivity(currentUser.email, activity);

            // Update points
            updateUserPoints(points);

            // Update UI
            updateStats();
            renderActivityHistory();

            // Show notification
            NotificationManager.show(`Great job! You earned ${points} points for ${label}!`, 'success');

            // Disable button temporarily
            button.disabled = true;
            const originalHTML = button.innerHTML;
            button.innerHTML = '<span class="label">Added!</span>';

            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = originalHTML;
            }, 1500);

            // Check for milestones
            if (currentUser.ecoPoints >= 100 && currentUser.ecoPoints - points < 100) {
                setTimeout(() => {
                    NotificationManager.show('Congratulations! You\'ve reached 100 EcoPoints!', 'success', 5000);
                }, 2000);
            }
        });
    });

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        StorageManager.clearCurrentUser();
        Utils.redirectToLogin();
    });

    // Initial render
    updateStats();
    renderActivityHistory();
}
