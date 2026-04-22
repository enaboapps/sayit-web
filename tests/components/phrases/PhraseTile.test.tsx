import { render, screen } from '@testing-library/react';
import PhraseTile from '@/app/components/phrases/PhraseTile';

describe('PhraseTile', () => {
  it('uses the configured text size for phrase text', () => {
    render(
      <PhraseTile
        phrase={{ id: 'phrase-1', text: 'Hello' }}
        onPress={jest.fn()}
        textSizePx={24}
      />
    );

    expect(screen.getByText('Hello')).toHaveStyle({ fontSize: '24px' });
    expect(screen.getByRole('button', { name: 'Speak phrase: Hello' })).toBeInTheDocument();
  });
});
