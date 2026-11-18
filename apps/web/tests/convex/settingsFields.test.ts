import { describe, expect, test } from '@jest/globals';
import schema from '@/convex/schema';
import { initializeSettings, updateSettings } from '@/convex/userSettings';

type FieldJson = { fieldType: { type: string; value?: unknown }; optional: boolean };
type ObjectJson = { type: 'object'; value: Record<string, FieldJson> };

function tableFields(): Record<string, FieldJson> {
  const exported = JSON.parse((schema as unknown as { export(): string }).export());
  const table = exported.tables.find((t: { tableName: string }) => t.tableName === 'userSettings');
  return (table.documentType as ObjectJson).value;
}

function argFields(fn: unknown): Record<string, FieldJson> {
  return (JSON.parse((fn as { exportArgs(): string }).exportArgs()) as ObjectJson).value;
}

// Fields only one side has on purpose.
const TABLE_ONLY = ['userId', 'updatedAt'];
const ARGS_ONLY = ['prepareSpeechWhileTyping']; // removed setting old clients still send

describe('synced settings fields', () => {
  test('both mutations accept every stored setting, and nothing else new', () => {
    const stored = Object.keys(tableFields()).filter((name) => !TABLE_ONLY.includes(name)).sort();
    const update = Object.keys(argFields(updateSettings)).filter((name) => !ARGS_ONLY.includes(name)).sort();
    const create = Object.keys(argFields(initializeSettings)).filter((name) => !ARGS_ONLY.includes(name)).sort();

    expect(update).toEqual(stored);
    expect(create).toEqual(stored.filter((name) => name !== 'lastSyncedAt'));
  });

  test('updateSettings makes every setting optional', () => {
    const optional = Object.entries(argFields(updateSettings))
      .filter(([name]) => name !== 'lastSyncedAt')
      .every(([, field]) => field.optional);
    expect(optional).toBe(true);
  });

  test('settings added after launch are optional in the table but required to create', () => {
    const table = tableFields();
    const create = argFields(initializeSettings);
    for (const name of ['doubleEnterEnabled', 'doubleEnterAction', 'doubleEnterTimeoutMs', 'aiReplySuggestionsEnabled', 'messageCaptureMode']) {
      expect(table[name].optional).toBe(true);
      expect(create[name].optional).toBe(false);
    }
  });
});
