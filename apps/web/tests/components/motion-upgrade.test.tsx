import { render, screen, waitFor } from '@testing-library/react';
import { AnimatePresence, motion } from 'framer-motion';

// Use the real animation library: most component tests mock it for speed.
test('Motion 13 renders content, updates its target and completes exit removal', async () => {
  const view = (visible: boolean, opacity: number) => (
    <AnimatePresence>
      {visible && <motion.button key="speak" initial={false} animate={{ opacity }} exit={{ opacity: 0 }} transition={{ duration: 0 }}>Speak</motion.button>}
    </AnimatePresence>
  );
  const { rerender } = render(view(true, 1));
  expect(screen.getByRole('button', { name: 'Speak' })).toHaveStyle({ opacity: '1' });
  rerender(view(true, 0.5));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Speak' })).toHaveStyle({ opacity: '0.5' }));
  rerender(view(false, 0.5));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Speak' })).not.toBeInTheDocument());
});
