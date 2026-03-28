/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-black': '#030508',
        'space-dark': '#070d1a',
        'ignite-orange': '#FF4D00',
        'ignite-amber': '#FF8C00',
        'ignite-gold': '#FFD700',
        'plasma-blue': '#00D4FF',
        'plasma-cyan': '#00FFCC',
        'metal-light': '#C0C8D8',
        'metal-dark': '#1A2035',
      },
      fontFamily: {
        'display': ['Orbitron', 'monospace'],
        'mono': ['Share Tech Mono', 'monospace'],
        'body': ['Exo 2', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'flame': 'flame 0.15s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'orbit': 'orbit 20s linear infinite',
        'flicker': 'flicker 3s ease-in-out infinite',
        'energy-flow': 'energyFlow 2s linear infinite',
        'countdown': 'countdown 1s ease-in-out',
        'launch-shake': 'launchShake 0.5s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 77, 0, 0.5)' },
          '50%': { boxShadow: '0 0 60px rgba(255, 77, 0, 1), 0 0 100px rgba(255, 140, 0, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        flame: {
          '0%': { transform: 'scaleY(1) scaleX(1)' },
          '100%': { transform: 'scaleY(1.1) scaleX(0.95)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(150px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(150px) rotate(-360deg)' },
        },
        flicker: {
          '0%, 95%, 100%': { opacity: '1' },
          '96%': { opacity: '0.8' },
          '97%': { opacity: '1' },
          '98%': { opacity: '0.6' },
          '99%': { opacity: '1' },
        },
        energyFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        countdown: {
          '0%': { transform: 'scale(1.5)', opacity: '0' },
          '50%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0' },
        },
        launchShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px) translateY(-1px)' },
          '75%': { transform: 'translateX(2px) translateY(1px)' },
        },
      },
      backgroundImage: {
        'metal-gradient': 'linear-gradient(135deg, #1A2035 0%, #0D1525 50%, #1A2035 100%)',
        'fire-gradient': 'linear-gradient(to top, #FF4D00, #FF8C00, #FFD700, transparent)',
        'energy-gradient': 'linear-gradient(90deg, #FF4D00, #FF8C00, #FFD700, #FF8C00, #FF4D00)',
      },
    },
  },
  plugins: [],
}
