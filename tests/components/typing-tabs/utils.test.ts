import { generateLabelFromText, createDefaultTab, validateTabLabel, MAX_TABS, MAX_LABEL_LENGTH } from '@/app/components/typing-tabs/utils';

// Mock nanoid to avoid ESM issues
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-id'),
}));

describe('typing-tabs utils', () => {
  describe('constants', () => {
    it('has MAX_TABS constant', () => {
      expect(MAX_TABS).toBe(10);
    });

    it('has MAX_LABEL_LENGTH constant', () => {
      expect(MAX_LABEL_LENGTH).toBe(20);
    });
  });

  describe('generateLabelFromText', () => {
    it('returns "Message N" for empty text', () => {
      expect(generateLabelFromText('', 1)).toBe('Message 1');
      expect(generateLabelFromText('', 5)).toBe('Message 5');
    });

    it('returns "Message N" for whitespace-only text', () => {
      expect(generateLabelFromText('   ', 1)).toBe('Message 1');
      expect(generateLabelFromText('\n\t  ', 2)).toBe('Message 2');
    });

    it('returns short text as-is', () => {
      expect(generateLabelFromText('Hello', 1)).toBe('Hello');
      expect(generateLabelFromText('Test message', 1)).toBe('Test message');
    });

    it('truncates text longer than MAX_LABEL_LENGTH with ellipsis', () => {
      const longText = 'This is a very long text that exceeds twenty characters';
      const result = generateLabelFromText(longText, 1);

      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(MAX_LABEL_LENGTH + 3); // +3 for '...'
    });

    it('uses first line for multiline text', () => {
      const multiline = 'First line\nSecond line\nThird line';
      expect(generateLabelFromText(multiline, 1)).toBe('First line');
    });

    it('truncates first line if longer than MAX_LABEL_LENGTH', () => {
      const multiline = 'This is a very long first line that exceeds limit\nSecond line';
      const result = generateLabelFromText(multiline, 1);

      expect(result).toBe('This is a very long ...');
    });

    it('trims whitespace from text', () => {
      expect(generateLabelFromText('  Hello  ', 1)).toBe('Hello');
      expect(generateLabelFromText('\n\tTest\n', 1)).toBe('Test');
    });

    it('handles text exactly at MAX_LABEL_LENGTH', () => {
      const exactLength = 'a'.repeat(MAX_LABEL_LENGTH);
      const result = generateLabelFromText(exactLength, 1);

      expect(result).toBe(exactLength);
      expect(result).not.toContain('...');
    });

    it('adds ellipsis for text one character over limit', () => {
      const overByOne = 'a'.repeat(MAX_LABEL_LENGTH + 1);
      const result = generateLabelFromText(overByOne, 1);

      expect(result).toBe('a'.repeat(MAX_LABEL_LENGTH) + '...');
    });
  });

  describe('createDefaultTab', () => {
    it('creates tab with all required fields', () => {
      const tab = createDefaultTab(1);

      expect(tab).toHaveProperty('id');
      expect(tab).toHaveProperty('label');
      expect(tab).toHaveProperty('text');
      expect(tab).toHaveProperty('createdAt');
      expect(tab).toHaveProperty('lastModified');
      expect(tab).toHaveProperty('isCustomLabel');
    });

    it('has an ID field', () => {
      const tab = createDefaultTab(1);

      expect(tab.id).toBeDefined();
      expect(typeof tab.id).toBe('string');
    });

    it('sets default text to empty string', () => {
      const tab = createDefaultTab(1);
      expect(tab.text).toBe('');
    });

    it('uses provided text when given', () => {
      const tab = createDefaultTab(1, 'Initial text');
      expect(tab.text).toBe('Initial text');
    });

    it('generates label from text', () => {
      const tab = createDefaultTab(1, 'Hello world');
      expect(tab.label).toBe('Hello world');
    });

    it('generates "Message N" label for empty text', () => {
      const tab = createDefaultTab(3);
      expect(tab.label).toBe('Message 3');
    });

    it('sets isCustomLabel to false', () => {
      const tab = createDefaultTab(1);
      expect(tab.isCustomLabel).toBe(false);
    });

    it('sets createdAt timestamp', () => {
      const before = Date.now();
      const tab = createDefaultTab(1);
      const after = Date.now();

      expect(tab.createdAt).toBeGreaterThanOrEqual(before);
      expect(tab.createdAt).toBeLessThanOrEqual(after);
    });

    it('sets lastModified timestamp', () => {
      const before = Date.now();
      const tab = createDefaultTab(1);
      const after = Date.now();

      expect(tab.lastModified).toBeGreaterThanOrEqual(before);
      expect(tab.lastModified).toBeLessThanOrEqual(after);
    });

    it('createdAt and lastModified are initially equal', () => {
      const tab = createDefaultTab(1);
      expect(tab.createdAt).toBe(tab.lastModified);
    });
  });

  describe('validateTabLabel', () => {
    it('returns trimmed label for valid input', () => {
      expect(validateTabLabel('Test')).toBe('Test');
      expect(validateTabLabel('My Tab')).toBe('My Tab');
    });

    it('trims whitespace', () => {
      expect(validateTabLabel('  Test  ')).toBe('Test');
      expect(validateTabLabel('\n\tTab\n')).toBe('Tab');
    });

    it('returns "Message" for empty string', () => {
      expect(validateTabLabel('')).toBe('Message');
    });

    it('returns "Message" for whitespace-only string', () => {
      expect(validateTabLabel('   ')).toBe('Message');
      expect(validateTabLabel('\n\t  ')).toBe('Message');
    });

    it('truncates labels longer than MAX_LABEL_LENGTH', () => {
      const longLabel = 'a'.repeat(MAX_LABEL_LENGTH + 10);
      const result = validateTabLabel(longLabel);

      expect(result.length).toBe(MAX_LABEL_LENGTH);
      expect(result).toBe('a'.repeat(MAX_LABEL_LENGTH));
    });

    it('keeps labels exactly at MAX_LABEL_LENGTH', () => {
      const exactLabel = 'a'.repeat(MAX_LABEL_LENGTH);
      const result = validateTabLabel(exactLabel);

      expect(result).toBe(exactLabel);
    });

    it('handles labels with spaces that need truncation', () => {
      const longLabel = 'This is a very long label that needs truncation';
      const result = validateTabLabel(longLabel);

      expect(result.length).toBe(MAX_LABEL_LENGTH);
      expect(result).toBe('This is a very long ');
    });
  });
});
