module.exports = {
  // Uncomment the line below to enable the experimental Just-in-Time ("JIT") mode.
  // https://tailwindcss.com/docs/just-in-time-mode
  // mode: "jit",
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        turquoise: {
          light: '#85F8E1ff',
          DEFAULT: '#65D8C1ff',
          dark: '#45B8A1ff',
        },
        myrtleGreen: {
          lightest: '#72AFA6ff',
          light: '#528F86ff',
          DEFAULT: '#326F66ff',
          dark: '#124F46ff',
        },
        aeroBlue: {
          dark: '#98D9CCff',
          DEFAULT: '#B8F9ECff',
          light: '#E8F9FFff',
        },
        black: {
          DEFAULT: '#000000ff',
        },
        white: {
          DEFAULT: '#FFFFFFff',
        }
      }
    },
  },
  variants: {},
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
  purge: {
    // Filenames to scan for classes
    content: [
      "./src/**/*.html",
      "./src/**/*.js",
      "./src/**/*.jsx",
      "./src/**/*.ts",
      "./src/**/*.tsx",
      "./public/index.html",
    ],
    // Options passed to PurgeCSS
    options: {
      // Whitelist specific selectors by name
      // safelist: [],
    },
  },
};
