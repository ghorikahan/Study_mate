/**
 * StudyMate Preview Theme: "Emerald Zenith & Midnight Slate"
 * 
 * Proposed modern color palette designed for high cognitive focus,
 * reduced eye fatigue in long study sessions, and OLED efficiency.
 * Currently applied exclusively to the Main Dashboard screen for evaluation.
 */

export const DashboardTheme = {
  // Canvas & Surfaces
  background: '#090D16',       // Deep midnight navy canvas
  card: '#121929',             // Sleek elevated obsidian surface
  cardSecondary: '#192438',    // Recessed background for pills and track bars
  cardBorder: '#1E2C4A',       // Subtle architectural border
  cardBorderGlow: 'rgba(16, 185, 129, 0.4)', // Focused emerald halo border

  // Primary Accent: Radiant Emerald & Mint (Growth, mastery, concentration)
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryFaded: 'rgba(16, 185, 129, 0.14)',

  // Secondary Accent: Electric Sky Blue (Clarity, schedule, logic)
  secondary: '#38BDF8',
  secondaryLight: '#7DD3FC',
  secondaryDark: '#0284C7',
  secondaryFaded: 'rgba(56, 189, 248, 0.14)',

  // Accent Gold: Radiant Amber (Streaks, deadlines, milestones)
  accentGold: '#F59E0B',
  accentGoldLight: '#FBBF24',
  accentGoldFaded: 'rgba(245, 158, 11, 0.14)',

  // Text Hierarchy
  text: '#F8FAFC',             // Crisp white heading
  textSecondary: '#94A3B8',    // Clean slate subtext
  textMuted: '#64748B',        // Muted labels and indicators

  // Feedback Colors
  error: '#F43F5E',            // Crisp coral red
  errorFaded: 'rgba(244, 63, 94, 0.14)',
};

export default DashboardTheme;
