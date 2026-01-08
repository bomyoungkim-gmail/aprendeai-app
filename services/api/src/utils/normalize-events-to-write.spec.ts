import { normalizeEventsToWrite } from './normalize-events-to-write';

describe('normalizeEventsToWrite', () => {
  it('should return empty array for null/undefined/non-array', () => {
    expect(normalizeEventsToWrite(null)).toEqual([]);
    expect(normalizeEventsToWrite(undefined)).toEqual([]);
    expect(normalizeEventsToWrite({} as any)).toEqual([]);
  });

  it('should skip non-object items', () => {
    expect(normalizeEventsToWrite(['string' as any, 123 as any])).toEqual([]);
  });

  it('should normalize "type" to "eventType"', () => {
    const input = [{ type: 'TEST_EVENT', payload: { foo: 'bar' } }];
    const output = normalizeEventsToWrite(input);
    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      eventType: 'TEST_EVENT',
      payloadJson: { foo: 'bar' },
    });
  });

  it('should prefer "eventType" over "type"', () => {
    const input = [{ type: 'OLD', eventType: 'NEW', payload: {} }];
    const output = normalizeEventsToWrite(input);
    expect(output[0].eventType).toBe('NEW');
  });

  it('should normalize keys for payloadJson', () => {
    const input = [
      { eventType: 'A', payload_json: { a: 1 } },
      { eventType: 'B', data: { b: 2 } },
      { eventType: 'C', meta: { c: 3 } },
      { eventType: 'D' }, // missing payload
    ];
    const output = normalizeEventsToWrite(input);
    expect(output[0].payloadJson).toEqual({ a: 1 });
    expect(output[1].payloadJson).toEqual({ b: 2 });
    expect(output[2].payloadJson).toEqual({ c: 3 });
    expect(output[3].payloadJson).toEqual({});
  });

  it('should handle domain if present', () => {
    const input = [{ eventType: 'E', domain: '  educator  ' }];
    const output = normalizeEventsToWrite(input);
    expect(output[0].domain).toBe('educator');
  });

  it('should filter items without any event type', () => {
    const input = [{ payload: {} }]; // No type
    const output = normalizeEventsToWrite(input);
    expect(output).toEqual([]);
  });
});
