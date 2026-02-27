import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        "2xl": "4rem",
      },
      screens: {
        "2xl": "1536px",
        "3xl": "1920px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        "input-border": "hsl(var(--input-border))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          light: "hsl(var(--primary-light))",
        },
        "medical-cyan": "hsl(var(--medical-cyan))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          light: "hsl(var(--warning-light))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          light: "hsl(var(--destructive-light))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        // Medical Status Colors
        status: {
          confirmed: "hsl(var(--status-confirmed))",
          pending: "hsl(var(--status-pending))",
          cancelled: "hsl(var(--status-cancelled))",
          completed: "hsl(var(--status-completed))",
          "no-show": "hsl(var(--status-no-show))",
          "risk-high": "hsl(var(--status-risk-high))",
          "risk-medium": "hsl(var(--status-risk-medium))",
          "risk-low": "hsl(var(--status-risk-low))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      screens: {
        "3xl": "1920px",
        "4xl": "2560px",
      },
      fontSize: {
        "fluid-sm": ["clamp(0.875rem, 0.8vw, 1rem)", { lineHeight: "1.5" }],
        "fluid-base": ["clamp(1rem, 1.05vw, 1.25rem)", { lineHeight: "1.6" }],
        "fluid-lg": ["clamp(1.125rem, 1.2vw, 1.5rem)", { lineHeight: "1.5" }],
        "fluid-xl": ["clamp(1.25rem, 1.5vw, 1.875rem)", { lineHeight: "1.4" }],
        "fluid-2xl": ["clamp(1.5rem, 2vw, 2.5rem)", { lineHeight: "1.3" }],
        "fluid-3xl": ["clamp(1.875rem, 2.5vw, 3rem)", { lineHeight: "1.2" }],
        "fluid-4xl": ["clamp(2.25rem, 3.5vw, 4rem)", { lineHeight: "1.1" }],
        "fluid-5xl": ["clamp(2.5rem, 5vw, 6rem)", { lineHeight: "1.0" }],
        "fluid-6xl": ["clamp(3rem, 6vw, 8rem)", { lineHeight: "0.95" }],
      },
      spacing: {
        section: "clamp(4rem, 8vw, 10rem)",
        "section-sm": "clamp(2rem, 4vw, 5rem)",
      },
      maxWidth: {
        "8xl": "96rem",
        "9xl": "120rem",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
        medical: "var(--shadow-medical)",
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))",
        "gradient-success":
          "linear-gradient(135deg, hsl(var(--success)), hsl(142 71% 40%))",
        "gradient-medical":
          "linear-gradient(135deg, hsl(var(--primary-light)), hsl(var(--background)))",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
