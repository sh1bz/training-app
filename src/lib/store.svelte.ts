import type {
  ExerciseTemplate,
  Program,
  ProgramColor,
  Session,
  SessionExercise,
  WorkoutTemplate
} from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

const PALETTE: ProgramColor[] = ['blue', 'green', 'orange', 'purple', 'pink', 'teal', 'yellow', 'red'];

const seedPrograms: Program[] = [
  {
    id: 'p_push_pull_legs',
    name: 'Push Pull Legs',
    description: '6-day classic split for hypertrophy',
    emoji: '🏋️',
    color: 'orange',
    daysPerWeek: 6,
    workouts: [
      {
        id: 'w_push',
        name: 'Push',
        exercises: [
          { id: 'e1', name: 'Barbell Bench Press', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, workingWeight: 80, restSeconds: 180 },
          { id: 'e2', name: 'Overhead Press', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, workingWeight: 50, restSeconds: 150 },
          { id: 'e3', name: 'Incline Dumbbell Press', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, workingWeight: 28, restSeconds: 120 },
          { id: 'e4', name: 'Cable Tricep Pushdown', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, workingWeight: 30, restSeconds: 90 },
          { id: 'e5', name: 'Lateral Raise', targetSets: 4, targetRepsMin: 12, targetRepsMax: 15, workingWeight: 10, restSeconds: 60 }
        ]
      },
      {
        id: 'w_pull',
        name: 'Pull',
        exercises: [
          { id: 'e6', name: 'Deadlift', targetSets: 3, targetRepsMin: 5, targetRepsMax: 5, workingWeight: 140, restSeconds: 240 },
          { id: 'e7', name: 'Pull-Ups', targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, workingWeight: 0, restSeconds: 150 },
          { id: 'e8', name: 'Barbell Row', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, workingWeight: 70, restSeconds: 150 },
          { id: 'e9', name: 'Face Pulls', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, workingWeight: 25, restSeconds: 60 },
          { id: 'e10', name: 'Bicep Curl', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, workingWeight: 14, restSeconds: 90 }
        ]
      },
      {
        id: 'w_legs',
        name: 'Legs',
        exercises: [
          { id: 'e11', name: 'Back Squat', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, workingWeight: 100, restSeconds: 210 },
          { id: 'e12', name: 'Romanian Deadlift', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, workingWeight: 90, restSeconds: 180 },
          { id: 'e13', name: 'Leg Press', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, workingWeight: 180, restSeconds: 150 },
          { id: 'e14', name: 'Walking Lunge', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, workingWeight: 20, restSeconds: 90 },
          { id: 'e15', name: 'Standing Calf Raise', targetSets: 4, targetRepsMin: 12, targetRepsMax: 15, workingWeight: 60, restSeconds: 60 }
        ]
      }
    ]
  },
  {
    id: 'p_upper_lower',
    name: 'Upper / Lower',
    description: '4-day balanced strength split',
    emoji: '💪',
    color: 'blue',
    daysPerWeek: 4,
    workouts: [
      {
        id: 'w_upper_a',
        name: 'Upper A',
        exercises: [
          { id: 'ea1', name: 'Bench Press', targetSets: 4, targetRepsMin: 5, targetRepsMax: 6, workingWeight: 85, restSeconds: 180 },
          { id: 'ea2', name: 'Pendlay Row', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, workingWeight: 70, restSeconds: 150 },
          { id: 'ea3', name: 'Overhead Press', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, workingWeight: 50, restSeconds: 150 },
          { id: 'ea4', name: 'Chin-Ups', targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, workingWeight: 0, restSeconds: 120 }
        ]
      },
      {
        id: 'w_lower_a',
        name: 'Lower A',
        exercises: [
          { id: 'el1', name: 'Squat', targetSets: 4, targetRepsMin: 5, targetRepsMax: 6, workingWeight: 100, restSeconds: 210 },
          { id: 'el2', name: 'Romanian Deadlift', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, workingWeight: 90, restSeconds: 180 },
          { id: 'el3', name: 'Bulgarian Split Squat', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, workingWeight: 20, restSeconds: 120 }
        ]
      }
    ]
  }
];

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const seedSessions: Session[] = [
  {
    id: 's1',
    programId: 'p_push_pull_legs',
    programName: 'Push Pull Legs',
    workoutId: 'w_push',
    workoutName: 'Push',
    startedAt: daysAgo(2),
    endedAt: daysAgo(2),
    exercises: [
      {
        templateId: 'e1',
        name: 'Barbell Bench Press',
        targetRepsMin: 6,
        targetRepsMax: 8,
        restSeconds: 180,
        sets: [
          { weight: 80, reps: 8, done: true },
          { weight: 80, reps: 7, done: true },
          { weight: 80, reps: 6, done: true },
          { weight: 75, reps: 8, done: true }
        ]
      },
      {
        templateId: 'e2',
        name: 'Overhead Press',
        targetRepsMin: 8,
        targetRepsMax: 10,
        restSeconds: 150,
        sets: [
          { weight: 50, reps: 10, done: true },
          { weight: 50, reps: 9, done: true },
          { weight: 50, reps: 8, done: true }
        ]
      }
    ]
  },
  {
    id: 's2',
    programId: 'p_push_pull_legs',
    programName: 'Push Pull Legs',
    workoutId: 'w_legs',
    workoutName: 'Legs',
    startedAt: daysAgo(4),
    endedAt: daysAgo(4),
    exercises: [
      {
        templateId: 'e11',
        name: 'Back Squat',
        targetRepsMin: 6,
        targetRepsMax: 8,
        restSeconds: 210,
        sets: [
          { weight: 100, reps: 8, done: true },
          { weight: 100, reps: 7, done: true },
          { weight: 100, reps: 6, done: true },
          { weight: 95, reps: 8, done: true }
        ]
      }
    ]
  }
];

class Store {
  programs = $state<Program[]>(seedPrograms);
  sessions = $state<Session[]>(seedSessions);
  activeSessionId = $state<string | null>(null);

  get activeSession(): Session | null {
    if (!this.activeSessionId) return null;
    return this.sessions.find((s) => s.id === this.activeSessionId) ?? null;
  }

  getProgram(id: string): Program | undefined {
    return this.programs.find((p) => p.id === id);
  }

  getWorkout(programId: string, workoutId: string): WorkoutTemplate | undefined {
    return this.getProgram(programId)?.workouts.find((w) => w.id === workoutId);
  }

  getSession(id: string): Session | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  // ── Program mutations ────────────────────────────────

  createProgram(input: { name: string; description: string; emoji: string }): Program {
    const program: Program = {
      id: `p_${uid()}`,
      name: input.name.trim() || 'New Program',
      description: input.description.trim(),
      emoji: input.emoji || '🏋️',
      color: PALETTE[this.programs.length % PALETTE.length],
      daysPerWeek: 0,
      workouts: []
    };
    this.programs = [...this.programs, program];
    return program;
  }

  updateProgram(
    id: string,
    patch: Partial<Pick<Program, 'name' | 'description' | 'emoji' | 'color' | 'daysPerWeek'>>
  ) {
    this.programs = this.programs.map((p) => (p.id === id ? { ...p, ...patch } : p));
  }

  deleteProgram(id: string) {
    this.programs = this.programs.filter((p) => p.id !== id);
  }

  // ── Workout mutations ────────────────────────────────

  addWorkout(programId: string, name = 'New Workout'): WorkoutTemplate | null {
    const program = this.getProgram(programId);
    if (!program) return null;
    const workout: WorkoutTemplate = { id: `w_${uid()}`, name, exercises: [] };
    this.programs = this.programs.map((p) =>
      p.id === programId ? { ...p, workouts: [...p.workouts, workout] } : p
    );
    return workout;
  }

  updateWorkout(programId: string, workoutId: string, patch: Partial<Pick<WorkoutTemplate, 'name'>>) {
    this.programs = this.programs.map((p) =>
      p.id !== programId
        ? p
        : {
            ...p,
            workouts: p.workouts.map((w) => (w.id === workoutId ? { ...w, ...patch } : w))
          }
    );
  }

  removeWorkout(programId: string, workoutId: string) {
    this.programs = this.programs.map((p) =>
      p.id !== programId ? p : { ...p, workouts: p.workouts.filter((w) => w.id !== workoutId) }
    );
  }

  // ── Exercise mutations ───────────────────────────────

  addExercise(programId: string, workoutId: string, name = 'New Exercise'): ExerciseTemplate | null {
    const ex: ExerciseTemplate = {
      id: `e_${uid()}`,
      name,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      workingWeight: 0,
      restSeconds: 120
    };
    let added: ExerciseTemplate | null = null;
    this.programs = this.programs.map((p) => {
      if (p.id !== programId) return p;
      return {
        ...p,
        workouts: p.workouts.map((w) => {
          if (w.id !== workoutId) return w;
          added = ex;
          return { ...w, exercises: [...w.exercises, ex] };
        })
      };
    });
    return added;
  }

  updateExercise(
    programId: string,
    workoutId: string,
    exerciseId: string,
    patch: Partial<ExerciseTemplate>
  ) {
    this.programs = this.programs.map((p) => {
      if (p.id !== programId) return p;
      return {
        ...p,
        workouts: p.workouts.map((w) => {
          if (w.id !== workoutId) return w;
          return {
            ...w,
            exercises: w.exercises.map((e) => (e.id === exerciseId ? { ...e, ...patch } : e))
          };
        })
      };
    });
  }

  removeExercise(programId: string, workoutId: string, exerciseId: string) {
    this.programs = this.programs.map((p) => {
      if (p.id !== programId) return p;
      return {
        ...p,
        workouts: p.workouts.map((w) =>
          w.id !== workoutId ? w : { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
        )
      };
    });
  }

  // ── Session lifecycle ────────────────────────────────

  startWorkout(programId: string, workoutId: string): Session | null {
    const program = this.getProgram(programId);
    if (!program) return null;
    const workout = program.workouts.find((w) => w.id === workoutId);
    if (!workout) return null;

    const exercises: SessionExercise[] = workout.exercises.map((e) => ({
      templateId: e.id,
      name: e.name,
      targetRepsMin: e.targetRepsMin,
      targetRepsMax: e.targetRepsMax,
      restSeconds: e.restSeconds,
      sets: Array.from({ length: e.targetSets }, () => ({
        weight: e.workingWeight ?? 0,
        reps: 0,
        done: false
      }))
    }));

    const session: Session = {
      id: `s_${uid()}`,
      programId,
      programName: program.name,
      workoutId,
      workoutName: workout.name,
      startedAt: new Date().toISOString(),
      exercises
    };

    this.sessions = [session, ...this.sessions];
    this.activeSessionId = session.id;
    return session;
  }

  updateSet(
    sessionId: string,
    exerciseIdx: number,
    setIdx: number,
    patch: Partial<{ weight: number; reps: number; done: boolean }>
  ) {
    this.sessions = this.sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const exercises = s.exercises.map((ex, ei) => {
        if (ei !== exerciseIdx) return ex;
        const sets = ex.sets.map((set, si) =>
          si === setIdx ? { ...set, ...patch } : set
        );
        return { ...ex, sets };
      });
      return { ...s, exercises };
    });
  }

  addSet(sessionId: string, exerciseIdx: number) {
    this.sessions = this.sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const exercises = s.exercises.map((ex, ei) => {
        if (ei !== exerciseIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { weight: last?.weight ?? 0, reps: 0, done: false }]
        };
      });
      return { ...s, exercises };
    });
  }

  removeSet(sessionId: string, exerciseIdx: number, setIdx: number) {
    this.sessions = this.sessions.map((s) => {
      if (s.id !== sessionId) return s;
      const exercises = s.exercises.map((ex, ei) => {
        if (ei !== exerciseIdx) return ex;
        return { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) };
      });
      return { ...s, exercises };
    });
  }

  finishWorkout(sessionId: string) {
    this.sessions = this.sessions.map((s) =>
      s.id === sessionId ? { ...s, endedAt: new Date().toISOString() } : s
    );
    if (this.activeSessionId === sessionId) this.activeSessionId = null;
  }

  cancelWorkout(sessionId: string) {
    this.sessions = this.sessions.filter((s) => s.id !== sessionId);
    if (this.activeSessionId === sessionId) this.activeSessionId = null;
  }
}

export const store = new Store();

export const formatRest = (s: number) => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec === 0 ? `${m}m` : `${m}m ${sec}s`;
};
