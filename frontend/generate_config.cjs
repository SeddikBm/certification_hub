const fs = require('fs');

const metadata = JSON.parse(fs.readFileSync('.stitch/metadata.json', 'utf8'));
fs.writeFileSync('resources/style-guide.json', JSON.stringify(metadata, null, 2));

const theme = metadata.designTheme;
const typography = theme.typography || {};
const spacing = theme.spacing || {};
const colors = theme.namedColors || {};

const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 6).replace(/}$/, '      }')},
      fontFamily: {
        "sans": ["'Hanken Grotesk'", "sans-serif"],
        "mono": ["'JetBrains Mono'", "monospace"],
      },
      spacing: ${JSON.stringify(spacing, null, 6).replace(/}$/, '      }')},
      fontSize: {
${Object.entries(typography).map(([k, v]) => `        "${k}": ["${v.fontSize}", { lineHeight: "${v.lineHeight}", letterSpacing: "${v.letterSpacing || '0em'}", fontWeight: "${v.fontWeight}" }]`).join(',\n')}
      },
      borderRadius: {
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        'full': '9999px',
      }
    },
  },
  plugins: [],
}
`;

fs.writeFileSync('tailwind.config.js', tailwindConfig);
console.log("Config generated successfully!");
