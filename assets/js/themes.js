// Theme Management Script

class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark'];
        this.colorThemes = ['default', 'purple', 'blue', 'green', 'orange'];
        this.currentTheme = this.getStoredTheme() || 'light';
        this.currentColorTheme = this.getStoredColorTheme() || 'default';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.applyColorTheme(this.currentColorTheme);
        this.setupThemeToggle();
        this.setupColorThemeButtons();
    }

    getStoredTheme() {
        return localStorage.getItem('doItLater-theme');
    }

    getStoredColorTheme() {
        return localStorage.getItem('doItLater-colorTheme');
    }

    applyTheme(theme) {
        const body = document.body;
        
        if (theme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }

        this.currentTheme = theme;
        localStorage.setItem('doItLater-theme', theme);
        this.updateThemeToggleButton();
    }

    applyColorTheme(colorTheme) {
        const body = document.body;

        // Remove all color theme classes
        this.colorThemes.forEach(theme => {
            body.classList.remove(`${theme}-theme`);
        });

        // Add the new color theme class (skip 'default' as it's the base)
        if (colorTheme !== 'default') {
            body.classList.add(`${colorTheme}-theme`);
        }

        this.currentColorTheme = colorTheme;
        localStorage.setItem('doItLater-colorTheme', colorTheme);
        this.updateColorThemeButtons();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    setupThemeToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    setupColorThemeButtons() {
        this.colorThemes.forEach(theme => {
            const btn = document.getElementById(`color-theme-${theme}`);
            if (btn) {
                btn.addEventListener('click', () => this.applyColorTheme(theme));
            }
        });
    }

    updateThemeToggleButton() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.currentTheme === 'light' ? '🌙 Dark' : '☀️ Light';
        }
    }

    updateColorThemeButtons() {
        this.colorThemes.forEach(theme => {
            const btn = document.getElementById(`color-theme-${theme}`);
            if (btn) {
                if (this.currentColorTheme === theme) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ThemeManager();
    });
} else {
    new ThemeManager();
}
