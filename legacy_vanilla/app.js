import { renderWizard } from './components/Wizard.js';
import { renderDashboard } from './components/Dashboard.js';
import { store } from './store.js';

const app = document.getElementById('app');

function init() {
    // Check if user is onboarded
    const user = store.getUser();
    
    if (!user.onboarded) {
        renderWizard(app, onOnboardingComplete);
    } else {
        renderDashboard(app);
    }
}

function onOnboardingComplete() {
    // Transition to Dashboard
    app.innerHTML = ''; // Clear Wizard
    renderDashboard(app);
}

// Initialize the app
init();
