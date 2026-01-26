/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0f172a", // Dark Blue/Slate
                surface: "#1e293b",    // Lighter Slate
                primary: "#3b82f6",    // Blue
                secondary: "#ef4444",  // Red
                accent: "#8b5cf6",     // Purple
                success: "#22c55e",    // Green
                text: "#f8fafc",       // Off-white
                muted: "#94a3b8",      // Gray text
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
