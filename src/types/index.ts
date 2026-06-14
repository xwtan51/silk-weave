export interface CustomPath {
  id: string;
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface Pattern {
  id: string;
  name: string;
  dynasty: string;
  meaning: string;
  scene: string;
  story: string;
  source: string;
  svgId: 'cloud' | 'ruyi' | 'dragon' | 'huiwen' | 'custom';
  customPaths?: CustomPath[];
  customViewBox?: string;
  customImage?: string;
  authorName?: string;
  authorId?: string;
  publishedAt?: string;
  lang?: string;
  likesCount?: number;
  savesCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}
