// Plain data so both server pages and client components can read it.
export type RoutineKind = 'reset' | 'eye';

export type Step = {
  title: string;
  how: string;
  seconds: number;
  cues: string[];
  /** Live camera feedback shown during the step. */
  check?: 'head' | 'tilt' | 'blinks';
};

export const ROUTINES: Record<RoutineKind, { title: string; short: string; steps: Step[] }> = {
  reset: {
    title: 'Peregangan 60 detik',
    short: 'Peregangan',
    steps: [
      {
        title: 'Tarik dagu',
        how: 'Pandangan tetap lurus. Tarik dagu lurus ke belakang, seolah membuat dagu ganda.',
        seconds: 15,
        cues: ['Tarik dagu, tahan', 'Lepaskan', 'Tarik dagu, tahan', 'Lepaskan', 'Tarik dagu, tahan', 'Lepaskan'],
        check: 'head',
      },
      {
        title: 'Putar bahu',
        how: 'Lingkaran pelan: angkat ke arah telinga, tarik ke belakang, lalu turunkan.',
        seconds: 15,
        cues: ['Naik', 'Ke belakang', 'Turun', 'Naik', 'Ke belakang', 'Turun', 'Naik', 'Ke belakang', 'Turun'],
      },
      {
        title: 'Regang leher samping',
        how: 'Bahu tetap turun. Biarkan kepala miring karena beratnya sendiri.',
        seconds: 15,
        cues: ['Telinga kiri ke bahu kiri', 'Telinga kanan ke bahu kanan'],
        check: 'tilt',
      },
      {
        title: 'Fokus jauh dan kedip penuh',
        how: 'Lihat benda terjauh yang terlihat, idealnya 6 meter atau lebih. Pejamkan mata penuh setiap berkedip.',
        seconds: 15,
        cues: ['Lihat jauh', 'Kedip penuh, pelan', 'Lihat jauh', 'Kedip penuh, pelan'],
        check: 'blinks',
      },
    ],
  },
  eye: {
    title: 'Istirahat mata 20 detik',
    short: 'Istirahat mata',
    steps: [
      {
        title: 'Lihat sejauh 6 meter',
        how: 'Ke luar jendela kalau bisa. Lemaskan pandangan dan kedipkan mata penuh beberapa kali.',
        seconds: 20,
        cues: ['Lihat jauh', 'Tetap lihat jauh', 'Kedip penuh, pelan', 'Hampir selesai'],
        check: 'blinks',
      },
    ],
  },
};
