import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border:'hsl(var(--border))',input:'hsl(var(--input))',ring:'hsl(var(--ring))',
        background:'hsl(var(--background))',foreground:'hsl(var(--foreground))',
        primary:{DEFAULT:'hsl(var(--primary))',foreground:'hsl(var(--primary-foreground))'},
        secondary:{DEFAULT:'hsl(var(--secondary))',foreground:'hsl(var(--secondary-foreground))'},
        muted:{DEFAULT:'hsl(var(--muted))',foreground:'hsl(var(--muted-foreground))'},
        accent:{DEFAULT:'hsl(var(--accent))',foreground:'hsl(var(--accent-foreground))'},
        destructive:{DEFAULT:'hsl(var(--destructive))',foreground:'hsl(var(--destructive-foreground))'},
        card:{DEFAULT:'hsl(var(--card))',foreground:'hsl(var(--card-foreground))'},
        popover:{DEFAULT:'hsl(var(--popover))',foreground:'hsl(var(--popover-foreground))'},
      },
      borderRadius:{lg:'var(--radius)',md:'calc(var(--radius) - 2px)',sm:'calc(var(--radius) - 4px)'},
      keyframes:{
        'accordion-down':{from:{height:'0'},to:{height:'var(--radix-accordion-content-height)'}},
        'accordion-up':{from:{height:'var(--radix-accordion-content-height)'},to:{height:'0'}},
        shimmer:{'0%':{backgroundPosition:'-200% 0'},'100%':{backgroundPosition:'200% 0'}},
        float:{'0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-12px)'}},
        blob:{'0%,100%':{borderRadius:'60% 40% 30% 70% / 60% 30% 70% 40%'},'50%':{borderRadius:'30% 60% 70% 40% / 50% 60% 30% 60%'}},
        'gradient-x':{'0%,100%':{backgroundPosition:'0% 50%'},'50%':{backgroundPosition:'100% 50%'}},
        'slide-up':{from:{opacity:'0',transform:'translateY(30px)'},to:{opacity:'1',transform:'translateY(0)'}},
        'fade-in':{from:{opacity:'0'},to:{opacity:'1'}},
        'pulse-glow':{'0%,100%':{boxShadow:'0 0 20px rgba(251,146,60,0.4)'},'50%':{boxShadow:'0 0 40px rgba(251,146,60,0.8)'}},
        marquee:{'0%':{transform:'translateX(0)'},'100%':{transform:'translateX(-50%)'}},
      },
      animation:{
        'accordion-down':'accordion-down 0.2s ease-out',
        'accordion-up':'accordion-up 0.2s ease-out',
        shimmer:'shimmer 2.5s linear infinite',float:'float 4s ease-in-out infinite',
        blob:'blob 8s ease-in-out infinite','gradient-x':'gradient-x 4s ease infinite',
        'slide-up':'slide-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':'fade-in 0.6s ease forwards','pulse-glow':'pulse-glow 2s ease-in-out infinite',
        marquee:'marquee 30s linear infinite',
      },
      backgroundSize:{'300%':'300%'},
      boxShadow:{
        'glow-sm':'0 0 15px rgba(251,146,60,0.25)','glow':'0 0 30px rgba(251,146,60,0.35)',
        'card':'0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)',
        'card-hover':'0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(251,146,60,0.15)',
        'premium':'0 4px 20px rgba(251,146,60,0.3)','dark':'0 8px 32px rgba(0,0,0,0.3)',
        'dark-lg':'0 20px 60px rgba(0,0,0,0.4)','orange':'0 4px 24px rgba(251,146,60,0.35)',
      },
    },
  },
  plugins:[require('tailwindcss-animate')],
};
export default config;
