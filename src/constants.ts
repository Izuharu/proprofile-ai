import { Attire, Background } from './types';

export const ATTIRE_IMAGES: Record<Attire, string> = {
  [Attire.FORMAL_SUIT]: "/img/formal-suit.png",
  [Attire.BUSINESS_CASUAL]: "/img/business-casual.png",
  [Attire.SMART_CASUAL]: "/img/smart-casual.png",
  [Attire.TECH_FOUNDER]: "/img/tech-founder.png",
};

export const BACKGROUND_IMAGES: Record<Background, string> = {
  [Background.OFFICE]: "/img/modern-office.png",
  [Background.STUDIO_GRAY]: "/img/studio-gray.png",
  [Background.STUDIO_WHITE]: "/img/studio-white.png",
  [Background.CITY_BLUR]: "/img/cityscape.png",
  [Background.LIBRARY]: "/img/library.png",
};
