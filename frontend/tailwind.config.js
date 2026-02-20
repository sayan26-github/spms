/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                brand: {
                    bg: '#F8FAFC',       // Off-white background
                    surface: '#FFFFFF',  // Crisp white cards
                    border: '#E2E8F0',   // Subtle slate border
                    text: '#0F172A',     // Dark text for readability
                    muted: '#64748B',    // Slate-500 for secondary text
                    primary: '#4F46E5',  // Indigo-600 for primary actions
                    primaryLight: '#EEF2FF' // Indigo-50 for hover states
                }
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
