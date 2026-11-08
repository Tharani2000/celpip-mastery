import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      fontFamily: { display: ["var(--font-display)"], sans: ["var(--font-body)"] },
      colors: {
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        navy: "hsl(var(--navy))", purple: "hsl(var(--purple))", blue: "hsl(var(--blue))", cyan: "hsl(var(--cyan))",
        success: "hsl(var(--success))", warning: "hsl(var(--warning))",
        skill: { listening: "#2F6BFF", reading: "#6B4EF0", writing: "#13B5C6", speaking: "#E0559B" }
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 6px)", sm: "calc(var(--radius) - 10px)", xl: "calc(var(--radius) + 6px)" },
      keyframes: {
        pulseRing: { "0%": { boxShadow: "0 0 0 0 rgba(214,60,72,.45)" }, "70%": { boxShadow: "0 0 0 22px rgba(214,60,72,0)" }, "100%": { boxShadow: "0 0 0 0 rgba(214,60,72,0)" } },
        leafSway: { "0%,100%": { transform: "rotate(-8deg)" }, "50%": { transform: "rotate(8deg)" } },
        wiggle: { "0%,100%": { transform: "rotate(0)" }, "25%": { transform: "rotate(-14deg)" }, "75%": { transform: "rotate(14deg)" } },
        wave: { "0%,60%,100%": { transform: "rotate(0)" }, "10%,30%": { transform: "rotate(14deg)" }, "20%": { transform: "rotate(-8deg)" }, "40%": { transform: "rotate(-4deg)" }, "50%": { transform: "rotate(10deg)" } },
        flicker: { "0%,100%": { transform: "scale(1) rotate(0)", opacity: "1" }, "25%": { transform: "scale(1.12) rotate(-4deg)", opacity: ".85" }, "50%": { transform: "scale(.95) rotate(3deg)", opacity: "1" }, "75%": { transform: "scale(1.08) rotate(-2deg)", opacity: ".9" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        pop: { "0%": { transform: "scale(0)" }, "60%": { transform: "scale(1.3)" }, "100%": { transform: "scale(1)" } }
      },
      animation: {
        "pulse-ring": "pulseRing 1.4s infinite",
        "leaf-sway": "leafSway 3s ease-in-out infinite",
        wiggle: "wiggle .5s ease-in-out 3",
        wave: "wave 2.2s ease-in-out infinite",
        flicker: "flicker 1.6s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        pop: "pop .5s cubic-bezier(.34,1.56,.64,1) both"
      }
    }
  },
  plugins: [animate]
};
export default config;
