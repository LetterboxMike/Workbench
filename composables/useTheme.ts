/**
 * Theme composable for light/dark mode toggle
 * Default is dark mode per design system spec
 */
export const useTheme = () => {
  const isDark = useState<boolean>('theme-dark', () => true);

  const apply = (dark: boolean) => {
    isDark.value = dark;

    if (import.meta.client) {
      const html = document.documentElement;
      html.setAttribute('data-theme', dark ? 'dark' : 'light');
      localStorage.setItem('workbench-theme', dark ? 'dark' : 'light');
    }
  };

  const toggle = () => {
    if (import.meta.client) {
      // Enable transition class for smooth theme switch
      document.documentElement.classList.add('theme-transition');
    }

    apply(!isDark.value);

    if (import.meta.client) {
      // Remove transition class after animation completes
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 200);
    }
  };

  const init = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('workbench-theme');
      // Default to dark if no preference saved
      const dark = saved ? saved === 'dark' : true;
      apply(dark);
    }
  };

  // Auto-init on mount
  onMounted(() => {
    init();
  });

  return {
    isDark,
    toggle,
    apply,
    init
  };
};
