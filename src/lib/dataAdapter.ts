import PocketBase from 'pocketbase';

import {
  Acknowledgement,
  AppState,
  HintLadder,
  PronunciationTerm,
  Room,
  Script,
  ScriptVersion,
  StaffMember,
} from '../types';
import { sampleData } from '../data/sampleData';

export type DataMode = 'demo' | 'pocketbase';

export interface AuditMetadata {
  lastGeneratedAt?: string;
  lastSavedAt?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface PersistenceAdapter {
  mode: DataMode;
  label: string;
  isDemo: boolean;
  loadAppState(): Promise<AppState>;
  saveAppState(state: AppState): Promise<void>;
  resetDemoData?(): Promise<AppState>;
  loadRooms(): Promise<Room[]>;
  saveRooms(rooms: Room[]): Promise<void>;
  loadScripts(): Promise<Script[]>;
  saveScripts(scripts: Script[]): Promise<void>;
  loadScriptVersions(): Promise<ScriptVersion[]>;
  saveScriptVersions(scriptVersions: ScriptVersion[]): Promise<void>;
  loadHintLadders(): Promise<HintLadder[]>;
  saveHintLadders(hintLadders: HintLadder[]): Promise<void>;
  loadPronunciationTerms(): Promise<PronunciationTerm[]>;
  savePronunciationTerms(pronunciationTerms: PronunciationTerm[]): Promise<void>;
  loadStaffMembers(): Promise<StaffMember[]>;
  saveStaffMembers(staffMembers: StaffMember[]): Promise<void>;
  loadAcknowledgements(): Promise<Acknowledgement[]>;
  saveAcknowledgements(acknowledgements: Acknowledgement[]): Promise<void>;
  loadAuditMetadata(): Promise<AuditMetadata>;
  saveAuditMetadata(metadata: AuditMetadata): Promise<void>;
}

const STORAGE_KEY = 'gm_script_library_v1';
const AUDIT_METADATA_KEY = 'gm_script_library_audit_metadata_v1';

const emptyState: AppState = {
  rooms: [],
  scripts: [],
  scriptVersions: [],
  hintLadders: [],
  pronunciationTerms: [],
  staffMembers: [],
  acknowledgements: [],
};

function normalizeState(state: Partial<AppState> | null | undefined): AppState {
  return {
    rooms: state?.rooms ?? [],
    scripts: state?.scripts ?? [],
    scriptVersions: state?.scriptVersions ?? [],
    hintLadders: state?.hintLadders ?? [],
    pronunciationTerms: state?.pronunciationTerms ?? [],
    staffMembers: state?.staffMembers ?? [],
    acknowledgements: state?.acknowledgements ?? [],
  };
}

function readLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    // Fall through to seeded demo data, preserving the previous storage behavior.
  }
  return sampleData;
}

function writeLocalState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

function updateLocalState(updater: (state: AppState) => AppState): void {
  writeLocalState(updater(readLocalState()));
}

function readLocalAuditMetadata(): AuditMetadata {
  try {
    const raw = localStorage.getItem(AUDIT_METADATA_KEY);
    if (raw) return JSON.parse(raw) as AuditMetadata;
  } catch {
    // Ignore malformed metadata and return an empty object.
  }
  return {};
}

function writeLocalAuditMetadata(metadata: AuditMetadata): void {
  localStorage.setItem(AUDIT_METADATA_KEY, JSON.stringify(metadata));
}

export const localStorageAdapter: PersistenceAdapter = {
  mode: 'demo',
  label: 'Demo localStorage',
  isDemo: true,
  async loadAppState() {
    return readLocalState();
  },
  async saveAppState(state) {
    writeLocalState(state);
  },
  async resetDemoData() {
    writeLocalState(sampleData);
    return sampleData;
  },
  async loadRooms() {
    return readLocalState().rooms;
  },
  async saveRooms(rooms) {
    updateLocalState((state) => ({ ...state, rooms }));
  },
  async loadScripts() {
    return readLocalState().scripts;
  },
  async saveScripts(scripts) {
    updateLocalState((state) => ({ ...state, scripts }));
  },
  async loadScriptVersions() {
    return readLocalState().scriptVersions;
  },
  async saveScriptVersions(scriptVersions) {
    updateLocalState((state) => ({ ...state, scriptVersions }));
  },
  async loadHintLadders() {
    return readLocalState().hintLadders;
  },
  async saveHintLadders(hintLadders) {
    updateLocalState((state) => ({ ...state, hintLadders }));
  },
  async loadPronunciationTerms() {
    return readLocalState().pronunciationTerms;
  },
  async savePronunciationTerms(pronunciationTerms) {
    updateLocalState((state) => ({ ...state, pronunciationTerms }));
  },
  async loadStaffMembers() {
    return readLocalState().staffMembers;
  },
  async saveStaffMembers(staffMembers) {
    updateLocalState((state) => ({ ...state, staffMembers }));
  },
  async loadAcknowledgements() {
    return readLocalState().acknowledgements;
  },
  async saveAcknowledgements(acknowledgements) {
    updateLocalState((state) => ({ ...state, acknowledgements }));
  },
  async loadAuditMetadata() {
    return readLocalAuditMetadata();
  },
  async saveAuditMetadata(metadata) {
    writeLocalAuditMetadata(metadata);
  },
};

type PocketBaseRecord = Record<string, unknown> & {
  id: string;
  created?: string;
  updated?: string;
};

type AppEntity =
  | Room
  | Script
  | ScriptVersion
  | HintLadder
  | PronunciationTerm
  | StaffMember
  | Acknowledgement;

const collections = {
  rooms: 'gms_rooms',
  scripts: 'gms_scripts',
  scriptVersions: 'gms_script_versions',
  hintLadders: 'gms_hint_ladders',
  pronunciationTerms: 'gms_pronunciation_terms',
  staffMembers: 'gms_staff_members',
  acknowledgements: 'gms_acknowledgements',
  auditMetadata: 'gms_audit_metadata',
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asJsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function recordTimestamp(record: PocketBaseRecord, field: 'createdAt' | 'updatedAt', fallbackField: 'created' | 'updated'): string {
  return asString(record[field], asString(record[fallbackField], new Date().toISOString()));
}

export function mapPocketBaseRoom(record: PocketBaseRecord): Room {
  return {
    id: record.id,
    name: asString(record.name),
    theme: asString(record.theme),
    durationMinutes: asNumber(record.durationMinutes),
    difficulty: asString(record.difficulty, 'medium') as Room['difficulty'],
    status: asString(record.status, 'inactive') as Room['status'],
    notes: asString(record.notes),
    createdAt: recordTimestamp(record, 'createdAt', 'created'),
    updatedAt: recordTimestamp(record, 'updatedAt', 'updated'),
  };
}

export function mapPocketBaseScript(record: PocketBaseRecord): Script {
  return {
    id: record.id,
    roomId: asString(record.roomId),
    title: asString(record.title),
    scriptType: asString(record.scriptType, 'training_note') as Script['scriptType'],
    audience: asString(record.audience),
    status: asString(record.status, 'draft') as Script['status'],
    currentVersionId: asNullableString(record.currentVersionId),
    tags: asStringArray(record.tags),
    createdAt: recordTimestamp(record, 'createdAt', 'created'),
    updatedAt: recordTimestamp(record, 'updatedAt', 'updated'),
  };
}

export function mapPocketBaseScriptVersion(record: PocketBaseRecord): ScriptVersion {
  return {
    id: record.id,
    scriptId: asString(record.scriptId),
    versionNumber: asString(record.versionNumber),
    bodyMarkdown: asString(record.bodyMarkdown),
    requiredBlocks: asStringArray(record.requiredBlocks),
    optionalBlocks: asStringArray(record.optionalBlocks),
    toneNotes: asString(record.toneNotes),
    changeSummary: asString(record.changeSummary),
    approvalStatus: asString(record.approvalStatus, 'draft') as ScriptVersion['approvalStatus'],
    approvedBy: asString(record.approvedBy),
    approvedAt: asNullableString(record.approvedAt),
    createdAt: recordTimestamp(record, 'createdAt', 'created'),
  };
}

export function mapPocketBaseHintLadder(record: PocketBaseRecord): HintLadder {
  return {
    id: record.id,
    roomId: asString(record.roomId),
    puzzleLabel: asString(record.puzzleLabel),
    stageLabel: asString(record.stageLabel),
    triggerCondition: asString(record.triggerCondition),
    hints: asJsonArray<HintLadder['hints'][number]>(record.hints),
    notes: asString(record.notes),
    createdAt: recordTimestamp(record, 'createdAt', 'created'),
    updatedAt: recordTimestamp(record, 'updatedAt', 'updated'),
  };
}

export function mapPocketBasePronunciationTerm(record: PocketBaseRecord): PronunciationTerm {
  return {
    id: record.id,
    roomId: asString(record.roomId),
    term: asString(record.term),
    phonetic: asString(record.phonetic),
    meaning: asString(record.meaning),
    context: asString(record.context),
    deliveryNote: asString(record.deliveryNote),
    audioNoteUrl: asString(record.audioNoteUrl),
    createdAt: recordTimestamp(record, 'createdAt', 'created'),
    updatedAt: recordTimestamp(record, 'updatedAt', 'updated'),
  };
}

export function mapPocketBaseStaffMember(record: PocketBaseRecord): StaffMember {
  return {
    id: record.id,
    name: asString(record.name),
    role: asString(record.role),
    active: asBoolean(record.active, true),
    notes: asString(record.notes),
  };
}

export function mapPocketBaseAcknowledgement(record: PocketBaseRecord): Acknowledgement {
  return {
    id: record.id,
    staffId: asString(record.staffId),
    scriptId: asString(record.scriptId),
    versionId: asString(record.versionId),
    acknowledgedAt: asString(record.acknowledgedAt),
    notes: asString(record.notes),
  };
}

function toPocketBaseRecord(entity: AppEntity): Record<string, unknown> {
  const fields: Record<string, unknown> = { ...entity };
  delete fields.id;
  return fields;
}

async function saveCollection<T extends AppEntity>(
  pb: PocketBase,
  collectionName: string,
  entities: T[]
): Promise<void> {
  const collection = pb.collection(collectionName);
  const existingRecords = await collection.getFullList<PocketBaseRecord>();
  const nextIds = new Set(entities.map((entity) => entity.id));

  await Promise.all(
    entities.map((entity) => {
      const payload = toPocketBaseRecord(entity);
      const exists = existingRecords.some((record) => record.id === entity.id);
      return exists
        ? collection.update(entity.id, payload)
        : collection.create({ id: entity.id, ...payload });
    })
  );

  await Promise.all(
    existingRecords
      .filter((record) => !nextIds.has(record.id))
      .map((record) => collection.delete(record.id))
  );
}

function createPocketBaseAdapter(url: string): PersistenceAdapter {
  const pb = new PocketBase(url);

  return {
    mode: 'pocketbase',
    label: 'PocketBase',
    isDemo: false,
    async loadAppState() {
      const [
        rooms,
        scripts,
        scriptVersions,
        hintLadders,
        pronunciationTerms,
        staffMembers,
        acknowledgements,
      ] = await Promise.all([
        this.loadRooms(),
        this.loadScripts(),
        this.loadScriptVersions(),
        this.loadHintLadders(),
        this.loadPronunciationTerms(),
        this.loadStaffMembers(),
        this.loadAcknowledgements(),
      ]);

      return {
        rooms,
        scripts,
        scriptVersions,
        hintLadders,
        pronunciationTerms,
        staffMembers,
        acknowledgements,
      };
    },
    async saveAppState(state) {
      await Promise.all([
        this.saveRooms(state.rooms),
        this.saveScripts(state.scripts),
        this.saveScriptVersions(state.scriptVersions),
        this.saveHintLadders(state.hintLadders),
        this.savePronunciationTerms(state.pronunciationTerms),
        this.saveStaffMembers(state.staffMembers),
        this.saveAcknowledgements(state.acknowledgements),
      ]);
    },
    async loadRooms() {
      const records = await pb.collection(collections.rooms).getFullList<PocketBaseRecord>({ sort: 'created' });
      return records.map(mapPocketBaseRoom);
    },
    async saveRooms(rooms) {
      await saveCollection(pb, collections.rooms, rooms);
    },
    async loadScripts() {
      const records = await pb.collection(collections.scripts).getFullList<PocketBaseRecord>({ sort: 'created' });
      return records.map(mapPocketBaseScript);
    },
    async saveScripts(scripts) {
      await saveCollection(pb, collections.scripts, scripts);
    },
    async loadScriptVersions() {
      const records = await pb.collection(collections.scriptVersions).getFullList<PocketBaseRecord>({ sort: 'created' });
      return records.map(mapPocketBaseScriptVersion);
    },
    async saveScriptVersions(scriptVersions) {
      await saveCollection(pb, collections.scriptVersions, scriptVersions);
    },
    async loadHintLadders() {
      const records = await pb.collection(collections.hintLadders).getFullList<PocketBaseRecord>({ sort: 'created' });
      return records.map(mapPocketBaseHintLadder);
    },
    async saveHintLadders(hintLadders) {
      await saveCollection(pb, collections.hintLadders, hintLadders);
    },
    async loadPronunciationTerms() {
      const records = await pb.collection(collections.pronunciationTerms).getFullList<PocketBaseRecord>({ sort: 'created' });
      return records.map(mapPocketBasePronunciationTerm);
    },
    async savePronunciationTerms(pronunciationTerms) {
      await saveCollection(pb, collections.pronunciationTerms, pronunciationTerms);
    },
    async loadStaffMembers() {
      const records = await pb.collection(collections.staffMembers).getFullList<PocketBaseRecord>({ sort: 'created' });
      return records.map(mapPocketBaseStaffMember);
    },
    async saveStaffMembers(staffMembers) {
      await saveCollection(pb, collections.staffMembers, staffMembers);
    },
    async loadAcknowledgements() {
      const records = await pb.collection(collections.acknowledgements).getFullList<PocketBaseRecord>({ sort: 'created' });
      return records.map(mapPocketBaseAcknowledgement);
    },
    async saveAcknowledgements(acknowledgements) {
      await saveCollection(pb, collections.acknowledgements, acknowledgements);
    },
    async loadAuditMetadata() {
      try {
        const record = await pb.collection(collections.auditMetadata).getOne<PocketBaseRecord>('global');
        return { ...(record.metadata as AuditMetadata), lastSavedAt: asString(record.lastSavedAt) };
      } catch {
        return {};
      }
    },
    async saveAuditMetadata(metadata) {
      const payload = { id: 'global', metadata, lastSavedAt: new Date().toISOString() };
      try {
        await pb.collection(collections.auditMetadata).update('global', payload);
      } catch {
        await pb.collection(collections.auditMetadata).create(payload);
      }
    },
  };
}

function resolveDataMode(): DataMode {
  return import.meta.env.VITE_DATA_MODE === 'pocketbase' ? 'pocketbase' : 'demo';
}

export function createDataAdapter(): PersistenceAdapter {
  const mode = resolveDataMode();
  const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL;

  if (mode === 'pocketbase' && pocketBaseUrl) {
    return createPocketBaseAdapter(pocketBaseUrl);
  }

  return localStorageAdapter;
}

export const dataAdapter = createDataAdapter();
export const initialEmptyAppState = emptyState;
