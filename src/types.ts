
export enum Attire {
  FORMAL_SUIT = "Formal Suit",
  BUSINESS_CASUAL = "Business Casual",
  SMART_CASUAL = "Smart Casual",
  TECH_FOUNDER = "Tech Founder",
}

export enum Background {
  OFFICE = "Modern Office",
  STUDIO_GRAY = "Studio Gray",
  STUDIO_WHITE = "Studio White",
  CITY_BLUR = "Blurred Cityscape",
  LIBRARY = "Classic Library",
}

export enum Mood {
  CONFIDENT = "Confident & Approachable",
  SERIOUS = "Serious & Professional",
  FRIENDLY = "Warm & Friendly",
  CREATIVE = "Creative & Dynamic",
}

export enum CameraAngle {
  FRONT = "Front Facing",
  PROFILE_LEFT = "30° Profile Left",
  PROFILE_RIGHT = "30° Profile Right",
  SLIGHT_UP = "Slightly Upward",
}

export enum EyeContact {
  LOOKING_AT_CAMERA = "Looking at Camera",
  NOT_LOOKING_AT_CAMERA = "Looking Away",
}

export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT = "3:4",
  LANDSCAPE = "4:3",
  STORY = "9:16",
}

export interface GenerationPreset {
  attire: Attire;
  background: Background;
  mood: Mood;
  cameraAngle: CameraAngle;
  eyeContact: EyeContact;
  aspectRatio: AspectRatio;
}

export interface GeneratedImage {
  id: string;
  url: string;
  preset: GenerationPreset;
}
