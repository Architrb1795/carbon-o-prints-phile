// Helper function to get user data from localStorage
function getUserData() {
    return JSON.parse(localStorage.getItem('ecoPointsUser'));
}

// Helper function to set user data to localStorage
function setUserData(userData) {
    localStorage.setItem('ecoPointsUser', JSON.stringify(userData));
}

// Helper function to check if a user is logged in
function isLoggedIn() {
    const userData = getUserData();
    return userData && userData.isLoggedIn;
}

// Redirect if not logged in (for dashboard)
function redirectToLoginIfNotLoggedIn() {
    if (window.location.pathname.includes('dashboard.html') && !isLoggedIn()) {
        window.location.href = 'index.html';
    }
}

// Redirect if logged in (for login/signup pages)
function redirectToDashboardIfLoggedIn() {
    if ((window.location.pathname.includes('index.html') || window.location.pathname.includes('signup.html')) && isLoggedIn()) {
        window.location.href = 'dashboard.html';
    }
}

// --- Signup Page Logic (signup.html) ---
if (window.location.pathname.includes('signup.html')) {
    redirectToDashboardIfLoggedIn();

    const signupForm = document.getElementById('signupForm');
    const signupName = document.getElementById('signupName');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const signupMessage = document.getElementById('signupMessage');

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value.trim();

        if (!name || !email || !password) {
            signupMessage.textContent = 'Please fill in all fields. 📝';
            return;
        }

        // Basic email validation
        if (!/^[^\]+@[^\]+\.[^\]+$/.test(email)) {
            signupMessage.textContent = 'Please enter a valid email address. 📧';
            return;
        }

        // Check if user already exists
        const existingUser = getUserData();
        if (existingUser && existingUser.email === email) {
            signupMessage.textContent = 'This email is already registered. Please log in. 🚫';
            return;
        }

        const newUser = {
            name: name,
            email: email,
            password: password, // In a real app, hash this password!
            ecoPoints: 0,
            isLoggedIn: false
        };

        setUserData(newUser);
        signupMessage.textContent = 'Sign up successful! Please log in. 🎉';
        signupMessage.classList.remove('error');
        signupMessage.classList.add('success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    });
}

// --- Login Page Logic (index.html) ---
if (window.location.pathname.includes('index.html')) {
    redirectToDashboardIfLoggedIn();

    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginMessage = document.getElementById('loginMessage');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            loginMessage.textContent = 'Please enter both email and password. 🔑';
            return;
        }

        const userData = getUserData();

        if (!userData || userData.email !== email || userData.password !== password) {
            loginMessage.textContent = 'Invalid email or password. Please try again. ❌';
            return;
        }

        // Mark user as logged in
        userData.isLoggedIn = true;
        setUserData(userData);

        loginMessage.textContent = 'Login successful! Redirecting... ✨';
        loginMessage.classList.remove('error');
        loginMessage.classList.add('success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    });
}

// --- Dashboard Page Logic (dashboard.html) ---
if (window.location.pathname.includes('dashboard.html')) {
    redirectToLoginIfNotLoggedIn();

    const dashboardUserName = document.getElementById('dashboardUserName');
    const ecoPointsDisplay = document.getElementById('ecoPointsDisplay');
    const ecoActionButtons = document.querySelectorAll('.eco-action-btn');
    const logoutBtn = document.getElementById('logoutBtn');
    const rewardNotification = document.getElementById('rewardNotification');

    let userData = getUserData();

    // Display user name and points
    if (userData) {
        dashboardUserName.textContent = userData.name;
        ecoPointsDisplay.textContent = userData.ecoPoints;
    }

    // Function to update points and check for reward
    function updateEcoPoints(pointsToAdd) {
        userData.ecoPoints += pointsToAdd;
        setUserData(userData);
        ecoPointsDisplay.textContent = userData.ecoPoints;
        checkRewardStatus();
    }

    // Check for reward status
    function checkRewardStatus() {
        if (userData.ecoPoints >= 100) {
            rewardNotification.textContent = `🎉 Congratulations, ${userData.name}! You've reached 100+ EcoPoints! Keep up the amazing work! 🏆`;
            rewardNotification.style.display = 'block';
        } else {
            rewardNotification.style.display = 'none';
        }
    }

    // Add event listeners to eco-action buttons
    ecoActionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const points = parseInt(button.dataset.points);
            updateEcoPoints(points);
            // Optional: Provide immediate feedback for the action
            button.textContent = `+${points} Points! ✅`;
            button.disabled = true; // Disable button after click to prevent spamming
            setTimeout(() => {
                // Reset button text and enable after a short delay
                button.textContent = button.getAttribute('data-original-text');
                button.disabled = false;
            }, 1500);
        });
        // Store original button text for resetting
        button.setAttribute('data-original-text', button.textContent);
    });

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        if (userData) {
            userData.isLoggedIn = false;
            setUserData(userData);
        }
        window.location.href = 'index.html';
    });

    // Initial check for reward status when dashboard loads
    checkRewardStatus();
}
