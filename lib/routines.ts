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
    title: 'Stretching 60 detik',
    short: 'Stretching',
    steps: [
      {
        title: 'Tarik dagu',
        how: 'Pandangan tetap lurus, tarik dagu ke belakang kayak lagi bikin dagu dobel.',
        seconds: 15,
        cues: ['Tarik dagu, tahan', 'Lepas', 'Tarik dagu, tahan', 'Lepas', 'Tarik dagu, tahan', 'Lepas'],
        check: 'head',
      },
      {
        title: 'Putar bahu',
        how: 'Pelan-pelan: angkat ke telinga, tarik ke belakang, terus turunin.',
        seconds: 15,
        cues: ['Naik', 'Ke belakang', 'Turun', 'Naik', 'Ke belakang', 'Turun', 'Naik', 'Ke belakang', 'Turun'],
      },
      {
        title: 'Leher ke samping',
        how: 'Bahu tetap turun. Biarin kepala miring sendiri karena beratnya.',
        seconds: 15,
        cues: ['Telinga kiri ke bahu kiri', 'Telinga kanan ke bahu kanan'],
        check: 'tilt',
      },
      {
        title: 'Lihat jauh, kedip penuh',
        how: 'Lihat benda paling jauh yang kelihatan, kalau bisa 6 meter lebih. Tiap kedip, merem penuh.',
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
        title: 'Lihat yang jauh',
        how: 'Ke luar jendela kalau bisa. Santaiin mata, terus kedip penuh beberapa kali.',
        seconds: 20,
        cues: ['Lihat jauh', 'Terus lihat jauh', 'Kedip penuh, pelan', 'Dikit lagi'],
        check: 'blinks',
      },
    ],
  },
};
