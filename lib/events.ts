export type EventDay = {
  id: string;
  date: string;
  weekday: string;
  motto: string;
  subtitle: string;
  vibeText: string;
  image: string;
  highlights: string[];
  reservationLink?: string;
  accentClassName?: string;
  djs: {
    headliner?: Array<{
      name: string;
      genre?: string;
      instagramUrl?: string;
    }>;
    support?: Array<{
      name: string;
      genre?: string;
      instagramUrl?: string;
    }>;
  };
  specials: Array<{
    title: string;
    time?: string;
    badge?: string;
    description: string;
    link?: string;
    ctaLabel?: string;
  }>;
};

const JHEEZ = {
  name: 'JHEEZ',
  genre: 'Afro House',
  instagramUrl: 'https://www.instagram.com/jheez.dj/',
};

const HOODDIVER = {
  name: 'Hooddiver',
  genre: 'Afro House',
  instagramUrl: 'https://www.instagram.com/hooddiver/',
};

const AUDIOKITCHEN = {
  name: 'Audio Kitchen',
  genre: 'House',
  instagramUrl: 'https://www.instagram.com/_audiokitchen_/',
};

const BASST = {
  name: 'BassT',
  genre: 'Open Format',
  instagramUrl: 'https://www.instagram.com/iambastii/',
};

const ARDEE = {
  name: 'Ardee',
  genre: 'Open Format',
  instagramUrl: 'https://www.instagram.com/ardeeatnite/',
};

const KENNETHB = {
  name: 'Kenneth B',
  genre: 'After-Show',
  instagramUrl: 'https://www.instagram.com/kennethb.ofc/',
};

const RIZZY = {
  name: 'RIZZY',
  genre: 'House',
  instagramUrl: 'https://www.instagram.com/rizzy.ofc/',
};

const SALVA = {
  name: 'Salvatore Mancuso',
  genre: 'EDM & House',
  instagramUrl: 'https://www.instagram.com/salvatoremancuso_official/',
};

const ANGELA = {
  name: 'Angela Kutscher',
  genre: 'Melodic Techno',
  instagramUrl: 'https://www.instagram.com/angela_kutscher/',
};

const LAURA = {
  name: 'Laura Zimmermann',
  genre: 'Electric Violinist',
  instagramUrl: 'https://www.instagram.com/laurazimmermann_violin/',
};

const MBP = {
  name: 'MBP',
  genre: 'House',
  instagramUrl: 'https://www.instagram.com/mbp.official/',
};

const KEVIN = {
  name: 'Kevin Albrecht',
  genre: 'Afro House',
  instagramUrl: 'https://www.instagram.com/kevin_albrecht_/',
};

const MAXNIKLAS = {
  name: 'Max Niklas',
  genre: 'EDM',
  instagramUrl: 'https://www.instagram.com/maxniklasmusic/',
};

const NICK = {
  name: 'NICK SELBMANN',
  genre: 'House',
  instagramUrl: 'https://www.instagram.com/nickselbmann/',
};

const RELOVA = {
  name: 'RELOVA',
  genre: 'House',
  instagramUrl: 'https://www.instagram.com/relova.official/',
};

const JASONWATS = {
  name: 'Jason Wats',
  genre: 'Techno',
  instagramUrl: 'https://www.instagram.com/jasonwats.ofc/',
};

const PANPOT = {
  name: 'PAN-POT',
  genre: 'Dance/Electronic',
  instagramUrl: 'https://www.instagram.com/panpotofficial/',
};

export const eventDays: EventDay[] = [
  {
    id: '2026-07-17',
    date: '17.07.2026',
    weekday: 'Freitag',
    motto: 'Opening AUDIO KITCHEN',
    subtitle: 'Der Auftakt ins Weinzelt 2026.',
    vibeText:
      'Zum Opening wird direkt klar, wohin die Reise geht: gute Weine, volle Energie und ein musikalischer Start mit echtem Nightlife-Charakter. Perfekt für alle, die den ersten Freitag direkt mitnehmen wollen.',
    highlights: ['Opening', 'Audio Kitchen'],
    reservationLink: '/reservation?date=17.07.26',
    image: '/events/audiokitchen.jpg',
    accentClassName: 'from-blue-50 via-white to-purple-50 border-blue-800/70',
    djs: {
      support: [JHEEZ, HOODDIVER, BASST, ARDEE],
      headliner: [AUDIOKITCHEN],
    },
    specials: [],
  },
  {
    id: '2026-07-18',
    date: '18.07.2026',
    weekday: 'Samstag',
    motto: 'Weindampfer Night',
    subtitle: 'Samstagabend mit bekanntem Vibe und viel Energie.',
    vibeText:
      'Die Weindampfer Night bringt genau den Mix, den man sich für einen Samstag auf der Rheinkirmes wünscht: tagsüber entspanntes Daydrinking, und in der Nacht sorgen die besten DJs vom Weindampfer für ein unvergessliches Erlebnis.',
    highlights: ['Weindampfer Night', 'Public Viewing'],
    reservationLink: '/reservation?date=18.07.26',
    image: '/events/weindampfer.jpg',
    accentClassName:
      'from-stone-100 via-stone-300 to-stone-50 border-stone-800/70',
    djs: {
      support: [JHEEZ, HOODDIVER, BASST, ARDEE, KENNETHB],
    },
    specials: [
      {
        title: 'Spiel um dritten Platz',
        time: '23:00',
        description:
          'Der Abend wird durch das Spiel um dritten Platz der Fußball WM zusätzlich aufgeladen und sorgt für besondere Stimmung im Zelt.',
      },
    ],
  },
  {
    id: '2026-07-19',
    date: '19.07.2026',
    weekday: 'Sonntag',
    motto: 'Kiesgrube im Weinzelt',
    subtitle: 'Sonntag mit Kultstatus, Clubkultur und echtem Kiesgrube-Vibe.',
    vibeText:
      'Wenn die Kiesgrube ins Weinzelt kommt, wird der Sonntag nicht leise, sondern legendär. Seit Jahrzehnten steht Kiesgrube für Freiheit, Haltung, kompromisslosen Sound und genau diese besondere Energie zwischen Exzess, Ritual und Ausnahmezustand. Ein Tag für alle, die Sonntage nicht absitzen, sondern feiern wollen.',
    highlights: ['Kiesgrube', 'PAN-POT', 'Tickets coming soon', 'WM Finale'],
    reservationLink: '/reservation?date=19.07.26',
    image: '/events/keezy.webp',
    djs: {
      headliner: [PANPOT],
    },
    accentClassName: 'from-red-100 via-white to-orange-50 border-red-800/70',
    specials: [
      {
        title: 'Kiesgrube im Weinzelt',
        time: 'ab 11:00',
        description:
          'Kiesgrube bringt ihren unverwechselbaren Sunday-Spirit ins Weinzelt: starke Musik, besondere Atmosphäre und ein Tag mit echtem Kultcharakter.',
      },
      {
        title: 'WM Finale',
        time: '21:00',
        description:
          'Gemeinsam schauen, anstoßen und den Abend mit besonderer Stimmung im Weinzelt erleben.',
      },
    ],
  },
  {
    id: '2026-07-20',
    date: '20.07.2026',
    weekday: 'Montag',
    motto: 'PINK MONDAY',
    subtitle:
      'Pink Monday mit Angela Kutscher, Laura Zimmermann und einem musikalischen Highlight, das man so nicht jeden Tag erlebt.',
    vibeText:
      'Pink Monday steht für Offenheit, Lebensfreude und ein Weinzelt voller Energie. Mit Angela Kutscher steht eine bekannte Düsseldorfer Techno-DJane am Pult, während Star-Violinistin Laura Zimmermann klassische Eleganz mit elektronischen Beats verbindet und mit ihrer Performance besondere Live-Momente schafft. Das Ergebnis ist ein Abend mit klarer Haltung, starker Präsenz und einer Atmosphäre, die sich spürbar von allen anderen Tagen unterscheidet.',
    highlights: [
      'Pink Monday',
      'Angela Kutscher',
      'Laura Zimmermann',
      'Live Music',
    ],
    reservationLink: '/reservation?date=20.07.26',
    accentClassName: 'from-rose-100 via-white to-orange-50 border-rose-300/70',
    image: '/events/laurazimmermann.jpg',
    djs: {
      support: [MBP],
      headliner: [ANGELA, LAURA],
    },
    specials: [],
  },
  {
    id: '2026-07-21',
    date: '21.07.2026',
    weekday: 'Dienstag',
    motto: 'MR. DÜSSELDORF',
    subtitle:
      'Lokaler Szeneabend mit Salvatore Mancuso und jeder Menge Düsseldorf.',
    vibeText:
      'Mr. Düsseldorf bringt lokalen Glamour, Szene-Publikum und genau die besondere Energie ins Weinzelt, die diesen Tag jedes Jahr so besonders macht. Mit Salvatore Mancuso rückt 2026 ein Headliner in den Fokus, der schon im letzten Jahr bei unseren Gästen extrem gut angekommen ist und mit seinen Sets voller überraschender Momente, starker Spannungsbögen und genreübergreifender Energie perfekt zu diesem Abend passt. Vielleicht wartet für alle Mr. Düsseldorf Karteninhaber an diesem Tag auch noch eine kleine Überraschung. Mehr dazu verraten wir bald.',
    highlights: ['Mr. Düsseldorf', 'Salvatore Mancuso'],
    reservationLink: '/reservation?date=21.07.26',
    image: '/events/mrdus.jpg',
    djs: {
      support: [JHEEZ, HOODDIVER, RIZZY, BASST],
      headliner: [SALVA],
    },
    specials: [],
  },
  {
    id: '2026-07-22',
    date: '22.07.2026',
    weekday: 'Mittwoch',
    motto: 'Kiesgrube presents: Palmenmarkt',
    subtitle:
      'Kiesgrube bringt mit Palmenmarkt einen einzigartigen Vibe ins Weinzelt.',
    vibeText:
      'Mit Palmenmarkt kommt am Mittwoch ein ganz besonderer Kiesgrube-Vibe ins Weinzelt. Zwischen guter Musik, sommerlicher Energie und einer Atmosphäre, die sich deutlich von den anderen Tagen abhebt, entsteht ein Abend mit ganz eigener Handschrift. Perfekt für alle, die unter der Woche Lust auf etwas Besonderes haben.',
    highlights: ['Kiesgrube', 'Palmenmarkt'],
    reservationLink: '/reservation?date=22.07.26',
    image: '/events/keezy.webp',
    djs: {
      support: [],
      headliner: [{ name: 'Kiesgrube', genre: 'TBA' }],
    },
    specials: [],
  },
  {
    id: '2026-07-23',
    date: '23.07.2026',
    weekday: 'Donnerstag',
    motto: 'LUNARO @ Weinzelt',
    subtitle: 'Die gehypte Eventreihe LUNARO bringt ihren Vibe ins Weinzelt.',
    vibeText:
      'Mit LUNARO kommt am Donnerstag eine Eventreihe ins Weinzelt, die in Düsseldorf längst für volle Abende und starken Sound bekannt ist. Viele kennen den Vibe aus den monatlichen Nächten im Hotel Hotel und dieses Jahr gibt es ihn auf der Rheinkirmes.',
    highlights: ['LUNARO'],
    reservationLink: '/reservation?date=23.07.26',
    accentClassName:
      'from-amber-900/10 via-orange-900/10 to-amber-800/20 border-amber-900/70',
    image: '/events/lunaro.jpg',
    djs: {
      support: [MAXNIKLAS],
      headliner: [KEVIN],
    },
    specials: [],
  },
  {
    id: '2026-07-24',
    date: '24.07.2026',
    weekday: 'Freitag',
    motto: 'AUDIO KITCHEN',
    subtitle: 'Der zweite große Freitag für alle, die es musikalisch lieben.',
    vibeText:
      'Am zweiten Freitag übernimmt erneut AUDIO KITCHEN und macht das Weinzelt zur Bühne. Wer elektronische Sets, gute Energie und spätes Weiterfeiern mag, ist hier genau richtig.',
    highlights: ['Audio Kitchen'],
    reservationLink: '/reservation?date=24.07.26',
    accentClassName:
      'from-blue-800/10 via-white to-purple-50 border-blue-800/70',
    image: '/events/audiokitchen.jpg',
    djs: {
      support: [KENNETHB, NICK],
      headliner: [AUDIOKITCHEN],
    },
    specials: [],
  },
  {
    id: '2026-07-25',
    date: '25.07.2026',
    weekday: 'Samstag',
    motto: 'CLOSING Saturday',
    subtitle:
      'Der letzte Samstag mit RELOVA als Headliner und maximaler Wochenendenergie.',
    vibeText:
      'Der letzte Samstag bündelt alles, was das Weinzelt über die Woche ausmacht: gute Leute, volle Tische, starke Musik und genau dieser letzte-Samstag-Vibe, bei dem niemand zu früh nach Hause will. Mit RELOVA steht dabei ein Headliner-Duo im Fokus, das mit eigenen Releases, starken Remixen und viel Momentum gerade richtig Fahrt aufgenommen hat. Ein perfekter Abschluss für alle, die den letzten Samstag nochmal voll mitnehmen wollen.',
    highlights: ['Closing Saturday', 'RELOVA'],
    reservationLink: '/reservation?date=25.07.26',
    image: '/events/relova.jpg',
    djs: {
      support: [ARDEE, JASONWATS],
      headliner: [RELOVA],
    },
    specials: [],
  },
  {
    id: '2026-07-26',
    date: '26.07.2026',
    weekday: 'Sonntag',
    motto: 'CLOSING Sunday',
    subtitle: 'Das Motto wird in den kommenden Tagen angekündigt.',
    vibeText:
      'Nur so viel Vorab: Auch dieses Jahr sind die legendären WINE WALKS wieder mit im Programm. Gemeinsam mit Sommelier, ausgewählten Weinen und dem perfekten Sonntag zwischen Carlsplatz, Rheinbrücke und Weinzelt.',
    highlights: ['Closing', 'WINE WALK'],
    reservationLink: '/reservation?date=26.07.26',
    image: '/events/winewalk.jpg',
    djs: {
      support: [],
      headliner: [],
    },
    specials: [
      {
        title: 'WINE WALK #1',
        time: '11:30',
        badge: 'inkl. Snack · 29 €',
        description:
          'Start am Carlsplatz bei Concept Riesling mit entspanntem Get-together und Aperitif. Danach geht es gemeinsam mit Sommelier und mehreren ausgewählten Weinen über die Rheinbrücke bis ins Weinzelt.',
        link: 'https://www.conceptriesling.com/collections/kirmes/products/wine-walk-zur-kirmes-1-walk-i-26-7-2026?variant=54333127360835',
        ctaLabel: 'Tickets 11:30',
      },
      {
        title: 'WINE WALK #2',
        time: '12:30',
        badge: 'inkl. Snack · 29 €',
        description:
          'Der zweite Walk des Tages mit Aperitif, geführtem Spaziergang, mehreren Wein-Stopps und entspanntem Finale im Weinzelt.',
        link: 'https://www.conceptriesling.com/collections/kirmes/products/wine-walk-zur-kirmes-2-walk-i-26-7-2026?variant=54333127786819',
        ctaLabel: 'Tickets 12:30',
      },
      {
        title: 'WINE WALK #3',
        time: '14:00',
        badge: 'ohne Essen · 19 €',
        description:
          'Die spätere Nachmittagsrunde für alle, die den Sonntag genussvoll und locker angehen wollen. Mit Sommelier, ausgewählten Weinen und Ziel im Weinzelt.',
        link: 'https://www.conceptriesling.com/collections/kirmes/products/wine-walk-zur-kirmes-3-walk-i-26-7-2026?variant=54333130408259',
        ctaLabel: 'Tickets 14:00',
      },
      {
        title: 'WINE WALK #4',
        time: '15:00',
        badge: 'ohne Essen · 19 €',
        description:
          'Die letzte WINE WALK Runde des Tages — perfekt für einen entspannten Sonntag mit Freunden, Wein und sommerlichem Kirmes-Vibe.',
        link: 'https://www.conceptriesling.com/collections/kirmes/products/wine-walk-zur-kirmes-4-walk-i-26-7-2026?variant=54333136535875',
        ctaLabel: 'Tickets 15:00',
      },
    ],
  },
];
