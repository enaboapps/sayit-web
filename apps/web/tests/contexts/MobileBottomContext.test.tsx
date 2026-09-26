import React, { useEffect, useRef } from 'react';
import { render } from '@testing-library/react';
import { MobileBottomProvider, useMobileBottom } from '@/app/contexts/MobileBottomContext';

test('dock registration remains stable across provider updates and parent renders', () => {
  const setup = jest.fn(); const cleanup = jest.fn();
  function Dock() {
    const { registerDockContainer } = useMobileBottom();
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      setup(); registerDockContainer(ref.current);
      return () => { cleanup(); registerDockContainer(null); };
    }, [registerDockContainer]);
    return <div ref={ref} />;
  }
  const view = render(<MobileBottomProvider><Dock /></MobileBottomProvider>);
  view.rerender(<MobileBottomProvider><Dock /></MobileBottomProvider>);
  expect(setup).toHaveBeenCalledTimes(1); expect(cleanup).not.toHaveBeenCalled();
  view.unmount(); expect(cleanup).toHaveBeenCalledTimes(1);
});
