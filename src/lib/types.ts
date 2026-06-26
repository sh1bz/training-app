export type ExerciseTemplate = {
  id: string;
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  workingWeight: number;
  restSeconds: number;
  notes?: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: ExerciseTemplate[];
};

export type ProgramColor =
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple'
  | 'pink'
  | 'teal'
  | 'yellow'
  | 'red';

export type Program = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: ProgramColor;
  daysPerWeek: number;
  workouts: WorkoutTemplate[];
};

export type LoggedSet = {
  weight: number;
  reps: number;
  done: boolean;
};

export type SessionExercise = {
  templateId: string;
  name: string;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  sets: LoggedSet[];
};

export type Session = {
  id: string;
  programId: string;
  programName: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  endedAt?: string;
  exercises: SessionExercise[];
  coachNotes?: string[];
};

// ── AI Coach ───────────────────────────────────────────

export type CoachActionId =
  | 'easier'
  | 'harder'
  | 'shorter'
  | 'longer'
  | 'no-equipment'
  | 'gym-busy'
  | 'variations';

export type CoachChange = {
  exercise: string;
  /** Set/load change description, e.g. "4→3 sets". */
  detail?: string;
  /** Replacement exercise name, when this is a swap. */
  to?: string;
};

export type CoachResult = {
  title: string;
  summary: string;
  changes: CoachChange[];
  /** The rebuilt exercise list to apply to the active session. */
  exercises: SessionExercise[];
};
