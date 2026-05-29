export type RoomStatus = 'active' | 'inactive' | 'maintenance' | 'retired';
export type RoomDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type ScriptType =
  | 'pre_game_brief'
  | 'safety_brief'
  | 'story_intro'
  | 'character_intro'
  | 'hint_ladder'
  | 'mid_game_intervention'
  | 'post_game_debrief'
  | 'reset_note'
  | 'training_note';

export type ScriptStatus =
  | 'draft'
  | 'in_review'
  | 'current'
  | 'archived'
  | 'needs_update';

export type ApprovalStatus = 'draft' | 'in_review' | 'approved' | 'rejected';

export type SpoilerLevel = 'low' | 'medium' | 'high';

export type IssueSeverity = 'critical' | 'warning' | 'improvement';

export type StaffPermissionLevel = 'owner' | 'manager' | 'lead_gm' | 'gm' | 'trainee' | 'viewer';

export type AcknowledgementSource = 'gm_mode' | 'staff_training' | 'manager_review' | 'import' | 'manual';

export type AuditEventAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'make-current'
  | 'acknowledge'
  | 'export'
  | 'import';

export type AuditEventEntityType =
  | 'room'
  | 'script'
  | 'script_version'
  | 'hint_ladder'
  | 'pronunciation_term'
  | 'staff_member'
  | 'acknowledgement'
  | 'room_packet'
  | 'app_state';

export interface ProductionScopedRecord {
  /** Reserved for future multi-organization support. The current app remains single-organization. */
  organizationId?: string;
}

export interface Room extends ProductionScopedRecord {
  id: string;
  name: string;
  theme: string;
  durationMinutes: number;
  difficulty: RoomDifficulty;
  status: RoomStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Script extends ProductionScopedRecord {
  id: string;
  roomId: string;
  title: string;
  scriptType: ScriptType;
  audience: string;
  status: ScriptStatus;
  currentVersionId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScriptVersion extends ProductionScopedRecord {
  id: string;
  scriptId: string;
  versionNumber: string;
  bodyMarkdown: string;
  requiredBlocks: string[];
  optionalBlocks: string[];
  toneNotes: string;
  changeSummary: string;
  approvalStatus: ApprovalStatus;
  approvedBy: string;
  approvedAt: string | null;
  createdAt: string;
  createdBy?: string;
  submittedBy?: string;
  reviewedBy?: string;
  rejectedAt?: string | null;
  safetyBlockChecksum?: string;
  previousVersionId?: string | null;
}

export interface HintStep {
  level: number;
  text: string;
  spoilerLevel: SpoilerLevel;
}

export interface HintLadder extends ProductionScopedRecord {
  id: string;
  roomId: string;
  puzzleLabel: string;
  stageLabel: string;
  triggerCondition: string;
  hints: HintStep[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PronunciationTerm extends ProductionScopedRecord {
  id: string;
  roomId: string;
  term: string;
  phonetic: string;
  meaning: string;
  context: string;
  deliveryNote: string;
  audioNoteUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember extends ProductionScopedRecord {
  id: string;
  name: string;
  role: string;
  active: boolean;
  notes: string;
  email?: string;
  authUserId?: string | null;
  permissionLevel?: StaffPermissionLevel;
  invitedAt?: string | null;
  lastLoginAt?: string | null;
}

export interface Acknowledgement extends ProductionScopedRecord {
  id: string;
  staffId: string;
  scriptId: string;
  versionId: string;
  acknowledgedAt: string;
  notes: string;
  acknowledgementTextSnapshot?: string;
  ipAddress?: string;
  userAgent?: string;
  source?: AcknowledgementSource;
  supersededByVersionId?: string | null;
  revokedAt?: string | null;
  revokedBy?: string | null;
}

export interface AuditEvent extends ProductionScopedRecord {
  id: string;
  action: AuditEventAction;
  entityType: AuditEventEntityType;
  entityId: string;
  roomId?: string | null;
  scriptId?: string | null;
  versionId?: string | null;
  staffId?: string | null;
  actorStaffId?: string | null;
  actorAuthUserId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ScriptReadinessIssue {
  id: string;
  roomId: string;
  severity: IssueSeverity;
  category: string;
  description: string;
  recommendation: string;
}

export interface ScriptReadinessResult {
  roomId: string;
  score: number;
  issues: ScriptReadinessIssue[];
  criticalCount: number;
  warningCount: number;
  improvementCount: number;
  generatedAt: string;
}

export interface AppState {
  rooms: Room[];
  scripts: Script[];
  scriptVersions: ScriptVersion[];
  hintLadders: HintLadder[];
  pronunciationTerms: PronunciationTerm[];
  staffMembers: StaffMember[];
  acknowledgements: Acknowledgement[];
  auditEvents?: AuditEvent[];
}
