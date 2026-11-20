// Plain data so both server pages and client components can read it.
export type RoutineKind = 'reset' | 'eye';

export type Step = { title: string; how: string; seconds: number; cues: string[]; check?: 'head' | 'blinks' };

export const ROUTINES: Record<RoutineKind, { title: string; steps: Step[] }> = {
  reset: {
    title: '60-second desk reset',
    steps: [
      {
        title: 'Chin tucks',
        how: 'Keep your eyes level and glide your chin straight back, as if making a double chin.',
        seconds: 15,
        cues: ['Chin back, hold', 'Release', 'Chin back, hold', 'Release', 'Chin back, hold', 'Release'],
        check: 'head',
      },
      {
        title: 'Shoulder rolls',
        how: 'Slow circles: lift toward your ears, squeeze back, drop down.',
        seconds: 15,
        cues: ['Up', 'Back', 'Down', 'Up', 'Back', 'Down', 'Up', 'Back', 'Down'],
      },
      {
        title: 'Side neck stretch',
        how: 'Shoulders stay down. Let your head tip sideways under its own weight.',
        seconds: 15,
        cues: ['Left ear toward left shoulder', 'Right ear toward right shoulder'],
      },
      {
        title: 'Far focus and full blinks',
        how: 'Look at the farthest thing you can see, ideally 6 m or more away. Close your eyes fully on each blink.',
        seconds: 15,
        cues: ['Look far away', 'Blink fully, slowly', 'Look far away', 'Blink fully, slowly'],
        check: 'blinks',
      },
    ],
  },
  eye: {
    title: '20-second eye break',
    steps: [
      {
        title: 'Look 6 m away',
        how: 'Out of a window if you can. Let your eyes soften and blink fully a few times.',
        seconds: 20,
        cues: ['Look far away', 'Keep your gaze far', 'Blink fully, slowly', 'Almost done'],
        check: 'blinks',
      },
    ],
  },
};
