export interface ManualPageData {
  type: 'cover' | 'cover-inside' | 'text' | 'channels' | 'schematic' | 'colophon' | string;
  title: string;
  subtitle?: string;
  serial?: string;
  placeholder?: string;
  badge?: string;
  stamp?: string;
  category?: string;
  metadata?: Record<string, any>;
  sections?: Array<{
    heading?: string;
    body?: string;
    bullets?: string[];
    callout?: string;
  }>;
}

export interface ManualSpread {
  id: string;
  menuLabel: string;
  left: ManualPageData;
  right: ManualPageData;
}

export const manualSpreads: ManualSpread[] = [
  {
    id: "cover",
    menuLabel: "00. UNIT COVER & RATINGS",
    left: {
      type: "cover-inside",
      title: "[INSIDE COVER]",
      subtitle: "SAFETY & REGULATORY CLEARANCES",
      serial: "SEC-DOC-001/A",
      stamp: "QC-PASSED • 1996",
      placeholder: "Regulatory notes & handling specifications. Do not expose broadcast chassis to moisture or excessive RF interference. All internal adjustments must be performed by certified PlayListismo technicians.",
      sections: [
        {
          heading: "OPERATIONAL NOTICE",
          body: "This receiving unit operates on continuous composite broadcast logic. Frequency synthesized tuning is locked to master stream telemetry.",
          bullets: [
            "Supply Voltage: 120V / 240V Auto-sensing 50/60 Hz",
            "Linear Broadcast Timing: Non-buffered real-time sync",
            "Anode Potential: 25 kV max (Do not remove rear chassis cover)"
          ]
        },
        {
          heading: "HANDLING PROTOCOLS",
          body: "For optimum phosphor life, avoid sustained static patterns beyond operational test cycles. Clean screen face only with anti-static phosphor solution."
        }
      ]
    },
    right: {
      type: "cover",
      title: "PLAYLISTISMO CRT-90",
      subtitle: "OWNER'S INSTRUCTION MANUAL",
      serial: "PLIST-REV-1996",
      badge: "OFFICIAL OPERATING GUIDE",
      stamp: "BROADCAST SPEC 1996-B",
      placeholder: "Complete operating instructions, chassis architecture, and curation philosophy for the CRT-90 receiver unit.",
      sections: [
        {
          heading: "MANUAL SPECIFICATION",
          body: "PART NO: MN-CRT90-V3 • ARCHIVAL MONOGRAPH • EDITION 1996"
        }
      ]
    }
  },
  {
    id: "manifesto",
    menuLabel: "01. BROADCAST MANIFESTO",
    left: {
      type: "text",
      title: "DEFEATING THE ALGORITHM",
      subtitle: "LINEAR TRANSMISSION & CHANCE",
      serial: "MANIF-01-A",
      stamp: "CURATORIAL POLICY",
      placeholder: "Serendipity and linear broadcast copy. Rescuing the collective music video experience from engagement-driven recommendation black holes.",
      sections: [
        {
          heading: "THE LINEAR MANDATE",
          body: "The contemporary stream is fractured by endless micro-decisions and algorithmic entrapment. PlayListismo restores the lost virtue of continuous, unprompted discovery: you tune into a frequency already in motion, surrender control, and encounter the unpredicted."
        },
        {
          heading: "ANTI-FRICTIONLESS BROADCAST",
          body: "True cultural resonance requires patience and unexpected collisions. The broadcast runs uninterrupted, indifferent to metrics, honoring the music video as a self-contained cinematic art form.",
          callout: "« The algorithm serves you what you were yesterday. The linear signal introduces who you might become. »"
        }
      ]
    },
    right: {
      type: "text",
      title: "MUSIC VIDEO AS TOTAL ART",
      subtitle: "ARCHIVAL RESTORATION PHILOSOPHY",
      serial: "MANIF-01-B",
      stamp: "CANON & DIASPORA",
      placeholder: "Curation and archival philosophy. The music video is not promotional collateral; it is a synthesis of sonic experimentation, choreography, and visual syntax.",
      sections: [
        {
          heading: "CINEMATIC HERITAGE",
          body: "For four decades, the short-form music film served as the primary laboratory for avant-garde cinematography, lighting ingenuity, and cross-cultural hybridity. We treat each entry as a master tape worthy of museum-grade preservation."
        },
        {
          heading: "CONTINUOUS PHOSPHOR PURSUIT",
          body: "From 1980s low-budget VHS grain to 1990s 35mm optical prints and 2000s digital surrealism, our channels assemble an unbroken continuum of global visual music.",
          callout: "« Not a playlist. A living television station broadcasting across forgotten frequencies. »"
        }
      ]
    }
  },
  {
    id: "channels",
    menuLabel: "02. CHANNEL LINE-UP GUIDE",
    left: {
      type: "channels",
      title: "CHANNEL 01: OFFSTAGE",
      subtitle: "RAW PERFORMANCE & ARCHIVAL GIGS",
      serial: "CH-GUIDE-01",
      stamp: "FREQ: 54-60 MHz",
      placeholder: "Raw performance & live archives. Unvarnished soundboard direct captures, basement sessions, and telecast bootlegs.",
      sections: [
        {
          heading: "CURATORIAL FOCUS",
          body: "Direct live takes, acoustic unplugs, and rare rehearsal room tapes preserving genuine sweat and room acoustics."
        },
        {
          heading: "CHANNEL PARAMETERS",
          bullets: [
            "Audio: Stereo Direct Board Master / Linear PCM",
            "Video Matrix: 4:3 Raw Field Capture",
            "Rotation Policy: Non-repeating circular queue"
          ]
        }
      ]
    },
    right: {
      type: "channels",
      title: "SHIFT & SAZÓN",
      subtitle: "GLITCH, IDM & RHYTHMIC DIASPORA",
      serial: "CH-GUIDE-02",
      stamp: "FREQ: 66-72 MHz",
      placeholder: "Glitch/IDM and rhythmic diaspora notes. Polyrhythmic syncretism meeting electronic modular synthesis.",
      sections: [
        {
          heading: "SONIC TERRITORY",
          body: "From UK garage breakbeats and Latin American cumbia club mutations to Japanese footwork and Detroit electro."
        },
        {
          heading: "BROADCAST TIMING",
          bullets: [
            "Sync Mode: Phase-Locked Telemetry",
            "Cross-Modulation: Continuous Flow",
            "Visual Accents: Abstract glitch graphics and kinetic typography"
          ]
        }
      ]
    }
  },
  {
    id: "specs",
    menuLabel: "03. CONTROLS & SERVICE SPECS",
    left: {
      type: "schematic",
      title: "CHASSIS MAPPING",
      subtitle: "ISOMETRIC DECK & SIGNAL FLOW",
      serial: "SCHEM-REV-96",
      stamp: "BLUEPRINT // ARCH-01",
      placeholder: "Isometric 1px wireframe diagram and physical control deck mapping for the CRT-90 receiver unit.",
      sections: [
        {
          heading: "SUB-CHASSIS SPECIFICATIONS",
          body: "Dual-rail transformer with independent power decoupling for the video signal pipeline and audio preamp stage."
        },
        {
          heading: "HARDWARE DECK CONTROLS",
          bullets: [
            "Primary Tube: 4:3 High-Focus Phosphor Triad",
            "Rotary Master: Dual-Gang CRT Gain Potentiometer",
            "Mechanical Push Deck: Tactile snap-action momentary switches"
          ]
        }
      ]
    },
    right: {
      type: "colophon",
      title: "SERVICE NOTES",
      subtitle: "COLOPHON & TECHNICAL SPECIFICATIONS",
      serial: "SPEC-COLOPHON",
      stamp: "INSPECTED // OK",
      placeholder: "Colophon, tech stack & non-commercial notice. Engineered for continuous broadcast without algorithmic mediation.",
      sections: [
        {
          heading: "CORE ENGINE & STACK",
          body: "React 19 / TypeScript / Vite / Tailwind CSS / Supabase Realtime / YouTube & Vimeo Synchronized Embed Drivers."
        },
        {
          heading: "NON-COMMERCIAL NOTICE",
          body: "PlayListismo is an educational, archival, and non-profit cultural initiative celebrating the music video artform. All broadcast materials remain the copyrighted property of their respective creators.",
          callout: "CALIBRATION COMPLETE • REV. 1996 • NO RIGHTS RESERVED FOR MONETIZATION"
        }
      ]
    }
  }
];
