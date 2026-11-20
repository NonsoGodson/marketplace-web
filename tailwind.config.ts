import type { Config } from 'tailwindcss';

// Design tokens for the marketplace's visual identity — see README's
// "Design system" section for the reasoning behind these choices.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14161F',       // near-black, blue-tinted — body text, dark surfaces
        paper: '#F5F3EC',     // warm parchment — light surfaces
        indigo: {
          DEFAULT: '#26305B',
          light: '#3B4779',
          dark: '#1A2142',
        },
        marigold: {
          DEFAULT: '#E8A33D',
          light: '#F0B96A',
          dark: '#C88423',
        },
        jade: {
          DEFAULT: '#1F7A64',
          light: '#2E9A80',
        },
        clay: '#B5482B', // errors/destructive — used sparingly
        line: '#E2DFD3', // hairline borders on paper
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
export default config;
