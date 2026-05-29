import { describe, expect, it } from 'vitest';
import { exportRoomJSON, exportRoomMarkdown } from './exporters';
import type { AppState } from '../types';

const baseDate = '2026-01-01T00:00:00.000Z';
const currentDate = '2026-01-02T00:00:00.000Z';

function exportReadyState(): AppState {
  return {
    rooms: [
      {
        id: 'room-1',
        name: 'Clockwork Vault',
        theme: 'Victorian heist',
        durationMinutes: 60,
        difficulty: 'medium',
        status: 'active',
        notes: 'Keep intro brisk.',
        createdAt: baseDate,
        updatedAt: currentDate,
      },
    ],
    scripts: [
      {
        id: 'pre-game-script',
        roomId: 'room-1',
        title: 'Pre-Game Briefing',
        scriptType: 'pre_game_brief',
        audience: 'players',
        status: 'current',
        currentVersionId: 'pre-game-current',
        tags: ['opening'],
        createdAt: baseDate,
        updatedAt: currentDate,
      },
      {
        id: 'safety-script',
        roomId: 'room-1',
        title: 'Safety Briefing',
        scriptType: 'safety_brief',
        audience: 'players',
        status: 'current',
        currentVersionId: 'safety-current',
        tags: ['safety'],
        createdAt: baseDate,
        updatedAt: currentDate,
      },
    ],
    scriptVersions: [
      {
        id: 'pre-game-current',
        scriptId: 'pre-game-script',
        versionNumber: '1.0',
        bodyMarkdown: 'Welcome to the Clockwork Vault. Confirm safety before entering.',
        requiredBlocks: ['Safety confirmation'],
        optionalBlocks: [],
        toneNotes: 'Warm and confident.',
        changeSummary: 'Approved launch script.',
        approvalStatus: 'approved',
        approvedBy: 'Ops Lead',
        approvedAt: currentDate,
        createdAt: currentDate,
      },
      {
        id: 'safety-current',
        scriptId: 'safety-script',
        versionNumber: '1.0',
        bodyMarkdown: 'No running. Use the emergency exit if instructed.',
        requiredBlocks: ['Emergency exit', 'No force'],
        optionalBlocks: [],
        toneNotes: 'Clear and firm.',
        changeSummary: 'Approved safety script.',
        approvalStatus: 'approved',
        approvedBy: 'Ops Lead',
        approvedAt: currentDate,
        createdAt: currentDate,
      },
    ],
    hintLadders: [
      {
        id: 'hint-1',
        roomId: 'room-1',
        puzzleLabel: 'Gear Cabinet',
        stageLabel: 'Act I',
        triggerCondition: 'Team has inspected the cabinet twice.',
        hints: [
          { level: 2, text: 'Match the brass gears by size.', spoilerLevel: 'medium' },
          { level: 1, text: 'Look for repeated gear markings.', spoilerLevel: 'low' },
        ],
        notes: 'Do not reveal the full sequence first.',
        createdAt: baseDate,
        updatedAt: currentDate,
      },
    ],
    pronunciationTerms: [
      {
        id: 'term-1',
        roomId: 'room-1',
        term: 'Aethelred',
        phonetic: 'ETH-el-red',
        meaning: 'Vault founder',
        context: 'Story introduction',
        deliveryNote: 'Say slowly the first time.',
        audioNoteUrl: '',
        createdAt: baseDate,
        updatedAt: currentDate,
      },
    ],
    staffMembers: [
      { id: 'staff-1', name: 'Jordan GM', role: 'Game Master', active: true, notes: '' },
    ],
    acknowledgements: [
      {
        id: 'ack-pre-game',
        staffId: 'staff-1',
        scriptId: 'pre-game-script',
        versionId: 'pre-game-current',
        acknowledgedAt: currentDate,
        notes: 'Ready to run.',
      },
      {
        id: 'ack-safety',
        staffId: 'staff-1',
        scriptId: 'safety-script',
        versionId: 'safety-current',
        acknowledgedAt: currentDate,
        notes: 'Ready to run.',
      },
    ],
  };
}

describe('room exports', () => {
  it('builds a JSON packet with the room, current scripts, operational references, audit output, and schema version', () => {
    const payload = JSON.parse(exportRoomJSON(exportReadyState(), 'room-1'));

    expect(payload.version).toBe('1.0');
    expect(payload.sourceApp).toBe('GM Script Library');
    expect(payload.room.name).toBe('Clockwork Vault');
    expect(payload.scripts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Pre-Game Briefing',
          currentVersion: expect.objectContaining({ bodyMarkdown: expect.stringContaining('Welcome to the Clockwork Vault') }),
        }),
        expect.objectContaining({
          title: 'Safety Briefing',
          currentVersion: expect.objectContaining({ bodyMarkdown: expect.stringContaining('No running') }),
        }),
      ])
    );
    expect(payload.hintLadders).toEqual(expect.arrayContaining([expect.objectContaining({ puzzleLabel: 'Gear Cabinet' })]));
    expect(payload.pronunciationGuide).toEqual(expect.arrayContaining([expect.objectContaining({ term: 'Aethelred', phonetic: 'ETH-el-red' })]));
    expect(payload.acknowledgements).toEqual(expect.arrayContaining([expect.objectContaining({ staffName: 'Jordan GM', versionId: 'pre-game-current' })]));
    expect(payload.scriptReadinessAudit).toEqual(expect.objectContaining({ roomId: 'room-1', score: 100, issues: [] }));
  });

  it('builds a Markdown packet with the room, current scripts, operational references, audit output, and schema version', () => {
    const markdown = exportRoomMarkdown(exportReadyState(), 'room-1');

    expect(markdown).toContain('# GM Script Library — Room Script Packet');
    expect(markdown).toContain('**Schema Version:** 1.0');
    expect(markdown).toContain('**Room:** Clockwork Vault');
    expect(markdown).toContain('## Script Readiness Score: 100/100');
    expect(markdown).toContain('### Safety Briefing');
    expect(markdown).toContain('No running. Use the emergency exit if instructed.');
    expect(markdown).toContain('### Pre-Game Briefing');
    expect(markdown).toContain('Welcome to the Clockwork Vault. Confirm safety before entering.');
    expect(markdown).toContain('## Hint Ladders');
    expect(markdown).toContain('### Gear Cabinet');
    expect(markdown).toContain('Look for repeated gear markings.');
    expect(markdown).toContain('## Pronunciation Guide');
    expect(markdown).toContain('**Phonetic:** ETH-el-red');
    expect(markdown).toContain('## Staff Acknowledgement Summary');
    expect(markdown).toContain('### Jordan GM (Game Master)');
    expect(markdown).toContain('- **Pre-Game Briefing:** Acknowledged');
  });
});
