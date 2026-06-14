export interface SwatchColor {
  hex: string;
  name?: string;
}

export interface Theme {
  id: string;
  name?: string;
  desc?: string;
  colors: SwatchColor[];
}

export const themes: Theme[] = [
  {
    id: 'imperial',
    colors: [
      { hex: '#FF4C00' }, { hex: '#F0C239' }, { hex: '#D9B611' },
      { hex: '#2EDFA3' }, { hex: '#622A1D' },
    ],
  },
  {
    id: 'celadon',
    colors: [
      { hex: '#8DD4E8' }, { hex: '#D6ECF0' }, { hex: '#1685A9' },
      { hex: '#425065' }, { hex: '#F3F9F1' },
    ],
  },
  {
    id: 'silk',
    colors: [
      { hex: '#F3A694' }, { hex: '#F47983' }, { hex: '#9D2933' },
      { hex: '#E4C6D0' }, { hex: '#A4ABD6' },
    ],
  },
  {
    id: 'botanical',
    colors: [
      { hex: '#BCE672' }, { hex: '#789262' }, { hex: '#E8C547' },
      { hex: '#F9906F' }, { hex: '#A4E2C6' },
    ],
  },
  {
    id: 'ink',
    colors: [
      { hex: '#1C1C1C' }, { hex: '#3C3C3C' }, { hex: '#8C8C8C' },
      { hex: '#C4C4C4' }, { hex: '#FFFFFF' },
    ],
  },
  {
    id: 'dunhuang',
    colors: [
      { hex: '#2E6B7A' }, { hex: '#4A8C6F' }, { hex: '#C4823B' },
      { hex: '#D64B2E' }, { hex: '#D4A853' },
    ],
  },
];
