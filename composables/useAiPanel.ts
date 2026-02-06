/**
 * AI Panel state composable
 * Manages the open/close state of the AI assistant panel
 */
export const useAiPanel = () => {
  const isOpen = useState<boolean>('ai-panel-open', () => false);

  const open = () => {
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  return {
    isOpen,
    open,
    close,
    toggle
  };
};
