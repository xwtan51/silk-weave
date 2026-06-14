import type { Pattern } from '../types';

export const patterns: Pattern[] = [
  {
    id: 'huiwen',
    name: '回纹',
    dynasty: '商代',
    meaning: '源远流长',
    scene: '建筑',
    story: '回纹是中国最古老的纹样之一，得名于"回"字——连续不断的线条回环往复，象征永恒与生生不息。三千多年前的青铜器上已有回纹，至今仍见于门框、窗棂、瓷器边饰——仿佛一个无声的约定：好运终会回还。',
    source: '故宫博物院',
    svgId: 'huiwen',
  },
  {
    id: 'cloud',
    name: '祥云纹',
    dynasty: '明代',
    meaning: '吉祥如意',
    scene: '建筑',
    story: '祥云纹流畅的曲线象征着福运绵延，飘入寻常生活。在中国传统艺术中，云带来甘霖、承载丰收，也是仙人遨游天地的座驾。从帝王龙袍到庙宇梁柱、再到历代瓷器，祥云纹无处不在。',
    source: '故宫博物院',
    svgId: 'cloud',
  },
  {
    id: 'ruyi',
    name: '如意纹',
    dynasty: '唐代',
    meaning: '和谐美满',
    scene: '服饰',
    story: '如意最初是一种挠背工具，后演变为象征权威与祝福的礼器。它心形的圆润头部代表"万事如意"。千百年来，恋人们互赠如意形饰物作为信物，节庆时家家户户摆放如意以求阖家和谐。',
    source: '故宫博物院',
    svgId: 'ruyi',
  },
  {
    id: 'dragon',
    name: '团龙纹',
    dynasty: '宋代',
    meaning: '力量与守护',
    scene: '器物',
    story: '不同于西方神话中的喷火巨龙，中国龙是掌管水与天空的守护神——智慧、仁慈，为农田带来甘霖。团龙纹将龙身盘绕成圆形，象征完整、护佑与滋养万物的沉静力量。',
    source: '故宫博物院',
    svgId: 'dragon',
  },
];

export function getPatternById(id: string): Pattern | undefined {
  return patterns.find((p) => p.id === id);
}
