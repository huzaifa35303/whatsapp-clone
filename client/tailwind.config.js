/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wa: {
          green: '#00a884',
          'green-light': '#25d366',
          teal: '#128c7e',
          'teal-dark': '#075e54',
          blue: '#53bdeb', // WhatsApp Blue tick color
          dark: {
            bg: '#0c1317',
            panel: '#111b21',
            sidebar: '#111b21',
            secondary: '#202c33',
            hover: '#202c33',
            border: '#222e35',
            input: '#2a3942',
            text: '#e9edef',
            subtext: '#8696a0',
            bubbleOut: '#005c4b',
            bubbleIn: '#202c33',
            icon: '#aebac1'
          },
          light: {
            bg: '#f0f2f5',
            panel: '#ffffff',
            sidebar: '#ffffff',
            secondary: '#f0f2f5',
            hover: '#f5f6f6',
            border: '#e9edef',
            input: '#f0f2f5',
            text: '#111b21',
            subtext: '#667781',
            bubbleOut: '#d9fdd3',
            bubbleIn: '#ffffff',
            icon: '#54656f'
          }
        }
      }
    },
  },
  plugins: [],
}
