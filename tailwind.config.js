/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Map our CSS variables to Tailwind colors for easy use
                'app-primary': 'var(--bg-primary)',
                'app-secondary': 'var(--bg-secondary)',
                'app-glass': 'var(--bg-glass)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'accent-primary': 'var(--accent-primary)',
                'accent-success': 'var(--accent-success)',
                'accent-warning': 'var(--accent-warning)',
                'accent-danger': 'var(--accent-danger)',
            },
            borderRadius: {
                'app-sm': 'var(--radius-sm)',
                'app-md': 'var(--radius-md)',
                'app-lg': 'var(--radius-lg)',
            },
            backdropBlur: {
                'app': 'var(--glass-blur)',
            }
        },
    },
    plugins: [],
}
