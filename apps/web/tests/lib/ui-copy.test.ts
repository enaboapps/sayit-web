import { UI_COPY } from '@/lib/ui-copy';

describe('core product terminology', () => {
  it('keeps approved concepts and actions consistently capitalized', () => {
    expect(UI_COPY).toEqual({
      board: 'Board',
      boards: 'Boards',
      phrase: 'Phrase',
      phrases: 'Phrases',
      type: 'Type',
      speak: 'Speak',
      stop: 'Stop',
      clear: 'Clear',
      liveTyping: 'Live Typing',
      fixText: 'Fix Text',
      moreActions: 'More Actions',
      saveAsPhrase: 'Save as Phrase',
    });
  });
});
