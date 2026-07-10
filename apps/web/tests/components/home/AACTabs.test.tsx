import { render, screen } from '@testing-library/react';
import AACTabs from '@/app/components/home/AACTabs';

describe('AACTabs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('insets the Type workspace to reveal the composer corners', () => {
    localStorage.setItem('aac-active-tab', 'type');

    render(
      <AACTabs
        phrasesContent={<div>Phrases content</div>}
        typeContent={<div>Type content</div>}
      />,
    );

    expect(screen.getByRole('tabpanel')).toHaveClass(
      'px-3',
      'pb-3',
      'sm:px-4',
      'sm:pb-4',
    );
  });

  it('leaves the Phrases workspace edge-to-edge', () => {
    render(
      <AACTabs
        phrasesContent={<div>Phrases content</div>}
        typeContent={<div>Type content</div>}
      />,
    );

    expect(screen.getByRole('tabpanel')).not.toHaveClass(
      'px-3',
      'pb-3',
      'sm:px-4',
      'sm:pb-4',
    );
  });
});
