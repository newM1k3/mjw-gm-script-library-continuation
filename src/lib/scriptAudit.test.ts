import { describe, expect, it } from 'vitest';
import { runAllAudits, runAudit } from './scriptAudit';
import type { AppState, HintLadder, Room, Script, ScriptVersion } from '../types';

const baseDate = '2026-01-01T00:00:00.000Z';
const currentDate = '2026-01-02T00:00:00.000Z';
const draftDate = '2026-01-03T00:00:00.000Z';

function room(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    name: 'Clockwork Vault',
    theme: 'Victorian heist',
    durationMinutes: 60,
    difficulty: 'medium',
    status: 'active',
    notes: 'Keep intro brisk.',
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  };
}

function script(overrides: Partial<Script>): Script {
  return {
    id: 'script-1',
    roomId: 'room-1',
    title: 'Opening Brief',
    scriptType: 'pre_game_brief',
    audience: 'players',
    status: 'current',
    currentVersionId: 'version-1',
    tags: ['opening'],
    createdAt: baseDate,
    updatedAt: currentDate,
    ...overrides,
  };
}

function version(overrides: Partial<ScriptVersion>): ScriptVersion {
  return {
    id: 'version-1',
    scriptId: 'script-1',
    versionNumber: '1.0',
    bodyMarkdown: 'Welcome to the Clockwork Vault.',
    requiredBlocks: ['Safety confirmation'],
    optionalBlocks: [],
    toneNotes: 'Warm and confident.',
    changeSummary: 'Approved launch script.',
    approvalStatus: 'approved',
    approvedBy: 'Ops Lead',
    approvedAt: currentDate,
    createdAt: currentDate,
    ...overrides,
  };
}

function hintLadder(overrides: Partial<HintLadder> = {}): HintLadder {
  return {
    id: 'hint-1',
    roomId: 'room-1',
    puzzleLabel: 'Gear Cabinet',
    stageLabel: 'Act I',
    triggerCondition: 'Team has inspected the cabinet twice.',
    hints: [
      { level: 1, text: 'Look for repeated gear markings.', spoilerLevel: 'low' },
      { level: 2, text: 'Match the brass gears by size.', spoilerLevel: 'medium' },
    ],
    notes: 'Do not reveal the full sequence first.',
    createdAt: baseDate,
    updatedAt: currentDate,
    ...overrides,
  };
}

function readyState(overrides: Partial<AppState> = {}): AppState {
  const preGameScript = script({
    id: 'pre-game-script',
    title: 'Pre-Game Briefing',
    scriptType: 'pre_game_brief',
    currentVersionId: 'pre-game-current',
  });
  const safetyScript = script({
    id: 'safety-script',
    title: 'Safety Briefing',
    scriptType: 'safety_brief',
    currentVersionId: 'safety-current',
  });

  const state: AppState = {
    rooms: [room()],
    scripts: [preGameScript, safetyScript],
    scriptVersions: [
      version({
        id: 'pre-game-current',
        scriptId: 'pre-game-script',
        versionNumber: '1.0',
        bodyMarkdown: 'Welcome to the Clockwork Vault. Confirm safety before entering.',
      }),
      version({
        id: 'safety-current',
        scriptId: 'safety-script',
        versionNumber: '1.0',
        bodyMarkdown: 'No running. Use the emergency exit if instructed.',
        requiredBlocks: ['Emergency exit', 'No force'],
      }),
    ],
    hintLadders: [hintLadder()],
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
        notes: '',
      },
      {
        id: 'ack-safety',
        staffId: 'staff-1',
        scriptId: 'safety-script',
        versionId: 'safety-current',
        acknowledgedAt: currentDate,
        notes: '',
      },
    ],
  };

  return { ...state, ...overrides };
}

function issueDescriptions(state: AppState): string[] {
  return runAudit(state, state.rooms[0]).issues.map((issue) => issue.description);
}

describe('script readiness audits', () => {
  it('flags an active room that is missing a current pre-game briefing', () => {
    const state = readyState({ scripts: readyState().scripts.filter((item) => item.scriptType !== 'pre_game_brief') });

    expect(issueDescriptions(state)).toContain('Active room "Clockwork Vault" has no current pre-game briefing.');
  });

  it('flags an active room that is missing a current safety briefing', () => {
    const state = readyState({ scripts: readyState().scripts.filter((item) => item.scriptType !== 'safety_brief') });

    expect(issueDescriptions(state)).toContain('Active room "Clockwork Vault" has no current safety briefing.');
  });

  it('flags an active room with no hint ladder coverage', () => {
    const state = readyState({ hintLadders: [] });

    expect(issueDescriptions(state)).toContain('Active room "Clockwork Vault" has no hint ladders.');
  });

  it('flags a script that has no current approved version', () => {
    const noCurrentScript = script({ id: 'training-script', title: 'Training Note', scriptType: 'training_note', currentVersionId: null });
    const state = readyState({ scripts: [...readyState().scripts, noCurrentScript] });

    expect(issueDescriptions(state)).toContain('Script "Training Note" has no current approved version.');
  });

  it('flags staff who acknowledged an older script version but not the current one', () => {
    const state = readyState({
      scriptVersions: [
        ...readyState().scriptVersions,
        version({ id: 'pre-game-old', scriptId: 'pre-game-script', versionNumber: '0.9', createdAt: baseDate }),
      ],
      acknowledgements: [
        readyState().acknowledgements[1],
        {
          id: 'ack-old-pre-game',
          staffId: 'staff-1',
          scriptId: 'pre-game-script',
          versionId: 'pre-game-old',
          acknowledgedAt: baseDate,
          notes: '',
        },
      ],
    });

    expect(issueDescriptions(state)).toContain('Jordan GM acknowledged an older version of "Pre-Game Briefing" but not the current version.');
  });

  it('flags a newer draft waiting behind the current approved script', () => {
    const state = readyState({
      scriptVersions: [
        ...readyState().scriptVersions,
        version({
          id: 'pre-game-draft',
          scriptId: 'pre-game-script',
          versionNumber: '1.1',
          approvalStatus: 'draft',
          approvedAt: null,
          createdAt: draftDate,
          changeSummary: 'Draft with updated pacing.',
        }),
      ],
    });

    expect(issueDescriptions(state)).toContain('Script "Pre-Game Briefing" has a draft version (v1.1) newer than the current approved version.');
  });

  it('flags pronunciation terms that lack phonetic spelling', () => {
    const state = readyState({
      pronunciationTerms: [{ ...readyState().pronunciationTerms[0], phonetic: '   ' }],
    });

    expect(issueDescriptions(state)).toContain('Term "Aethelred" is missing a phonetic spelling.');
  });

  it('flags a hint ladder that jumps directly to high-spoiler guidance', () => {
    const state = readyState({
      hintLadders: [hintLadder({ hints: [{ level: 1, text: 'The full answer is 1847.', spoilerLevel: 'high' }] })],
    });

    expect(issueDescriptions(state)).toContain('Hint ladder "Gear Cabinet" jumps straight to high-spoiler hints with no low or medium hints.');
  });

  it('flags scripts that are not attached to any existing room', () => {
    const orphanScript = script({ id: 'orphan-script', roomId: 'missing-room', title: 'Floating Script' });
    const state = readyState({ scripts: [...readyState().scripts, orphanScript] });

    expect(issueDescriptions(state)).toContain('Script "Floating Script" is not attached to any room.');
  });

  it('flags an operational risk when no active staff have acknowledged current scripts', () => {
    const state = readyState({ acknowledgements: [] });

    expect(issueDescriptions(state)).toContain('No active staff have acknowledged any current script versions for "Clockwork Vault".');
  });

  it('keeps issue IDs unique across rooms when all rooms are audited together', () => {
    const secondRoom = room({ id: 'room-2', name: 'Signal Station' });
    const state = readyState({
      rooms: [room(), secondRoom],
      scripts: [],
      scriptVersions: [],
      hintLadders: [],
      pronunciationTerms: [],
      acknowledgements: [],
    });

    const issueIds = runAllAudits(state).flatMap((result) => result.issues.map((issue) => issue.id));
    const uniqueIssueIds = new Set(issueIds);

    expect(uniqueIssueIds.size).toBe(issueIds.length);
  });
});
