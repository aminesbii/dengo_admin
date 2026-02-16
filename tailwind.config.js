import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
const PRIMARY = '#22c55e'; // your green-500

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: PRIMARY,
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          "primary": PRIMARY,
          "primary-content": "#ffffff",
          "secondary": "#fb923c",
          "accent": "#ef4444",
          "neutral": "#1f1f1f",        /* Gemini deep text */
          "base-100": "#ffffff",       /* Gemini white bg */
          "base-200": "#f0f4f9",       /* Gemini sidebar/hover light */
          "base-300": "#dee2e6",
          "info": PRIMARY,
          "success": PRIMARY,
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      {
        dark: {
          "primary": PRIMARY,
          "primary-content": "#ffffff",
          "secondary": "#fb923c",
          "accent": "#ef4444",
          "neutral": "#e7e7e7",        /* Gemini light text */
          "base-100": "#131314",       /* Gemini dark bg */
          "base-200": "#1e1f20",       /* Gemini dark sidebar/card */
          "base-300": "#282a2c",       /* Gemini dark hover state */
          "info": PRIMARY,
          "success": "#34d399",
          "warning": "#f59e0b",
          "error": "#f87171",
        },
      },
    ],
  },
}