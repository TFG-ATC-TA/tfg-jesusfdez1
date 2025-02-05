import type { Config } from "tailwindcss";
const { default: flattenColorPalette } = require("tailwindcss/lib/util/flattenColorPalette");

function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        aurora: {
          '0%': {
            transform: 'translate(0%, 0%) rotate(0deg) scale(1)',
            opacity: '0.4', 
            filter: 'blur(40px) brightness(1)'
          },
          '20%': {
            transform: 'translate(-2%, 1%) rotate(-1deg) scale(1.05)',
            opacity: '0.5',
            filter: 'blur(35px) brightness(1.2)'
          },
          '40%': {
            transform: 'translate(2%, -1%) rotate(0.5deg) scale(0.98)',
            opacity: '0.35',
            filter: 'blur(45px) brightness(0.9)'
          },
          '60%': {
            transform: 'translate(-3%, -2%) rotate(-0.5deg) scale(1.1)',
            opacity: '0.45',
            filter: 'blur(40px) brightness(1.1)'
          },
          '80%': {
            transform: 'translate(1%, 3%) rotate(1deg) scale(0.95)',
            opacity: '0.5',
            filter: 'blur(30px) brightness(1.15)'
          },
          '100%': {
            transform: 'translate(0%, 0%) rotate(0deg) scale(1)',
            opacity: '0.4',
            filter: 'blur(40px) brightness(1)'
          }
        },
        'aurora-flow-1': {
          '0%': {
            transform: 'translate(-25%, 0%) scale(1.1)',
            opacity: '0.3',
            filter: 'blur(40px) brightness(1)'
          },
          '50%': {
            transform: 'translate(25%, 0%) scale(1.1)',
            opacity: '0.35',
            filter: 'blur(40px) brightness(1.05)'
          },
          '100%': {
            transform: 'translate(-25%, 0%) scale(1.1)',
            opacity: '0.3',
            filter: 'blur(40px) brightness(1)'
          }
        },
        'aurora-flow-2': {
          '0%': {
            transform: 'translate(0%, -20%) scale(1.05)',
            opacity: '0.35', 
            filter: 'blur(45px) brightness(1.05)'
          },
          '50%': {
            transform: 'translate(0%, 20%) scale(1.05)',
            opacity: '0.3',
            filter: 'blur(45px) brightness(1)'
          },
          '100%': {
            transform: 'translate(0%, -20%) scale(1.05)',
            opacity: '0.35', 
            filter: 'blur(45px) brightness(1.05)'
          }
        },
        'aurora-flow-3': {
          '0%': {
            transform: 'translate(20%, -15%) scale(1.1)',
            opacity: '0.3', 
            filter: 'blur(50px) brightness(0.9)'
          },
          '50%': {
            transform: 'translate(-20%, 15%) scale(1.1)',
            opacity: '0.35',
            filter: 'blur(50px) brightness(1)'
          },
          '100%': {
            transform: 'translate(20%, -15%) scale(1.1)',
            opacity: '0.3', 
            filter: 'blur(50px) brightness(0.9)'
          }
        },
        'aurora-flow-4': {
          '0%': {
            transform: 'translate(-20%, -20%) scale(1.15)',
            opacity: '0.25', 
            filter: 'blur(35px) brightness(1.15)'
          },
          '50%': {
            transform: 'translate(20%, 20%) scale(1.15)',
            opacity: '0.3',
            filter: 'blur(35px) brightness(1)'
          },
          '100%': {
            transform: 'translate(-20%, -20%) scale(1.15)',
            opacity: '0.25', 
            filter: 'blur(35px) brightness(1.15)'
          }
        },
        'aurora-flow-5': {
          '0%': {
            transform: 'translate(25%, 10%) scale(0.9)',
            opacity: '0.25', 
            filter: 'blur(45px) brightness(1)'
          },
          '50%': {
            transform: 'translate(-25%, -10%) scale(0.9)',
            opacity: '0.3',
            filter: 'blur(45px) brightness(1.1)'
          },
          '100%': {
            transform: 'translate(25%, 10%) scale(0.9)',
            opacity: '0.25', 
            filter: 'blur(45px) brightness(1)'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        aurora: 'aurora 25s ease-in-out infinite alternate',
        'aurora-flow-1': 'aurora-flow-1 60s ease-in-out infinite',
        'aurora-flow-2': 'aurora-flow-2 70s ease-in-out infinite',
        'aurora-flow-3': 'aurora-flow-3 80s ease-in-out infinite',
        'aurora-flow-5': 'aurora-flow-5 65s ease-in-out infinite'
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    addVariablesForColors
  ],
};

export default config;
