const STORAGE_KEY = 'prodai_state';

const defaultState = {
    user: {
        name: '',
        role: '',
        onboarded: false,
        preferences: {
            gamification: false,
            focusMode: false
        }
    },
    tasks: [],
    currentPlan: null
};

class Store {
    constructor() {
        this.state = this.load();
    }

    load() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : defaultState;
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

    getUser() {
        return this.state.user;
    }

    updateUser(updates) {
        this.state.user = { ...this.state.user, ...updates };
        this.save();
    }

    getTasks() {
        return this.state.tasks;
    }

    setTasks(tasks) {
        this.state.tasks = tasks;
        this.save();
    }

    setPlan(plan) {
        this.state.currentPlan = plan;
        this.save();
    }

    getPlan() {
        return this.state.currentPlan;
    }
}

export const store = new Store();
