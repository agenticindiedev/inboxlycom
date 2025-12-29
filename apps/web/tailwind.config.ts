import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [require('@agenticindiedev/ui/tailwind.preset')],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
