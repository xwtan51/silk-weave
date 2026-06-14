export interface UserProfile {
  id: string;
  name: string;
  color: string;
  bio: string;
}

export const users: UserProfile[] = [
  { id: 'ink',      name: '墨迹未干',      color: '#2E5C4E', bio: '以墨为友，笔耕不辍。' },
  { id: 'wanderer', name: '纹样旅人', color: '#C24B36', bio: '在传统纹样中漫游，寻找历史的痕迹。' },
  { id: 'sea',      name: '海丝坊', color: '#3B6999', bio: '海丝之路，纹样之美。' },
  { id: 'plum',     name: '梅花工坊', color: '#C24B36', bio: '一剪寒梅，纹中傲骨。' },
  { id: 'grid',     name: '格律诗人',        color: '#425065', bio: '在规矩中寻找自由。' },
  { id: 'phoenix',  name: '火羽笔',       color: '#FF4C00', bio: '用笔尖点燃纹样的灵魂。' },
  { id: 'crane',    name: '云中鹤',      color: '#8DD4E8', bio: '云深不知处，纹自天上来。' },
  { id: 'weaver',   name: '素手织',     color: '#D6ECF0', bio: '一梭一线，织就千年。' },
  { id: 'rhythm',   name: '墨韵生',       color: '#622A1D', bio: '墨分五色，纹有千变。' },
  { id: 'fence',    name: '东篱下',  color: '#BCE672', bio: '采菊东篱下，悠然见纹样。' },
  // English-speaking users
  { id: 'emma',     name: 'Emma Orna',     color: '#D4A853', bio: 'Textile designer — in love with pattern languages.' },
  { id: 'kai',      name: 'Kai Mueller',   color: '#5C3D4A', bio: 'Berlin-based illustrator discovering Chinese aesthetics.' },
  { id: 'sofia',    name: 'Sofia Reyes',   color: '#F3A694', bio: 'Pattern hoarder & digital nomad.' },
  { id: 'oliver',   name: 'Oliver Chen',   color: '#1685A9', bio: 'Half Chinese, half British — bridging two worlds in ink.' },
  { id: 'yuki',     name: 'Yuki Tanaka',   color: '#A4E2C6', bio: 'Japanese pattern lover exploring Chinese motifs.' },
  // zh-TW users
  { id: 'ming',     name: '大明風華',  color: '#C24B36', bio: '從故宮找到靈感，用紋樣說故事。' },
  { id: 'lan',      name: '蘭亭墨客', color: '#789262', bio: '寫字畫紋，皆為修行。' },
  { id: 'zhen',     name: '針線情緣', color: '#E4C6D0', bio: '一針一線，繡出文化的溫度。' },
  { id: 'shan',     name: '山水之間',  color: '#8DD4E8', bio: '遊走山水，擷取天地間的紋理。' },
  { id: 'yeh',      name: '夜雨寄北',     color: '#425065', bio: '夜雨敲窗，靈感乍現。' },
  // ja users
  { id: 'sakura',   name: '桜井美咲', color: '#F47983', bio: '着物の文様に魅了されて、デジタルで再創作しています。' },
  { id: 'akira',    name: '田中明',   color: '#1685A9', bio: '伝統文様をモダンにアレンジするのが好きです。' },
  { id: 'nara',     name: '奈良の鹿',      color: '#BCE672', bio: '正倉院の宝物からインスピレーションを得ています。' },
  { id: 'kyoto',    name: '京都屋',       color: '#D4A853', bio: '京友禅の色彩を世界に届けたい。' },
  { id: 'edo',      name: '江戸の粋',       color: '#622A1D', bio: '粋でいきな江戸文様を現代に。' },
  { id: 'self',     name: '你',            color: '#2E5C4E', bio: '' },
  // Korean users
  { id: 'seoul',   name: '서울빛',    color: '#FF4C00', bio: '한국의 전통 문양에서 영감을 받아 디자인합니다.' },
  { id: 'hanbok',  name: '한복이야기',   color: '#F47983', bio: '한복의 아름다움을 디지털로 옮깁니다.' },
  { id: 'joseon',  name: '조선의달',    color: '#D4A853', bio: '달항아리처럼 둥근 마음을 담아.' },
  { id: 'gureum',  name: '구름산책',     color: '#8DD4E8', bio: '구름 문양을 따라 걷는 즐거움.' },
  { id: 'bomnal',  name: '봄날의꽃',  color: '#F3A694', bio: '봄날의 설렘을 문양에 담아.' },
  // French users
  { id: 'paris',   name: 'Atelier Paris',  color: '#425065', bio: 'Créer des ponts entre l\'art décoratif français et les motifs chinois.' },
  { id: 'lyon',    name: 'Soie de Lyon',   color: '#E4C6D0', bio: 'La soie lyonnaise rencontre les motifs orientaux.' },
  { id: 'marseille', name: 'Marseille Bleu', color: '#1685A9', bio: 'Le bleu de la Méditerranée inspire mes créations.' },
  { id: 'bordeaux', name: 'Bordeaux Rouge', color: '#9D2933', bio: 'La couleur du vin et la passion du motif.' },
  { id: 'lille',   name: 'Lille Nord',     color: '#789262', bio: 'Tissage du Nord — tradition et modernité.' },
  // Spanish users
  { id: 'madrid',  name: 'Madrid Sol',     color: '#F0C239', bio: 'El sol de Madrid brilla en cada diseño.' },
  { id: 'barna',   name: 'Barcelona Gòtic', color: '#C24B36', bio: 'Los patrones góticos se encuentran con los motivos orientales.' },
  { id: 'sevilla', name: 'Sevilla Azul',   color: '#3B6999', bio: 'Azulejos y patrones — el alma de Andalucía.' },
  { id: 'valencia',name: 'València Taronja',color: '#F9906F', bio: 'El color de las naranjas y la alegría mediterránea.' },
  { id: 'bilbao',  name: 'Bilbao Gris',    color: '#8C8C8C', bio: 'La geometría vasca se funde con los patrones asiáticos.' },
  // Russian users
  { id: 'moscow',  name: 'Москва Золотая',   color: '#D4A853', bio: 'Русские узоры встречаются с китайской эстетикой.' },
  { id: 'spb',     name: 'Петербург Белый',    color: '#D6ECF0', bio: 'Белые ночи вдохновляют мои орнаменты.' },
  { id: 'siberia', name: 'Сибирский Кедр', color: '#789262', bio: 'Таёжные мотивы в каждой линии.' },
  { id: 'kazan',   name: 'Казанский Кот',     color: '#F9906F', bio: 'Татарский орнамент + китайский узор = любовь.' },
  { id: 'volgograd', name: 'Волга-Река',   color: '#3B6999', bio: 'Течение Волги вдохновляет мои линии.' },
  // Arabic users
  { id: 'dubai',   name: 'نور دبي',    color: '#F0C239', bio: 'أنسج الشرق والغرب في زخارف رقمية.' },
  { id: 'cairo',   name: 'قاهرة الخط',  color: '#622A1D', bio: 'الخط العربي يلتقي بالزخرفة الصينية.' },
  { id: 'riyadh',  name: 'رياض الخزامى', color: '#E4C6D0', bio: 'زخارف نجدية ممتزجة بجمال الشرق الأقصى.' },
  { id: 'amman',   name: 'عمان البيضاء',   color: '#D6ECF0', bio: 'البيوت البيضاء في عمّان تنبض بالزخارف.' },
  { id: 'fez',     name: 'زليج فاس',   color: '#1685A9', bio: 'الزليج المغربي وحوار الحضارات عبر الزخرفة.' },
  { id: 'lotus', name: '莲花居士', color: '#F47983', bio: '以纹会友，以墨传情。' },
  { id: 'bamboo2', name: '竹里馆', color: '#789262', bio: '独坐幽篁里，弹琴复长啸。' },
  { id: 'aurora', name: 'Aurora Moon', color: '#8DD4E8', bio: 'Digital artist exploring pattern languages across cultures.' },
  { id: 'jasper', name: 'Jasper Cole', color: '#D4A853', bio: 'Architecture student fascinated by ornamental geometry.' },
  { id: 'tea', name: '茶韻堂', color: '#BCE672', bio: '一盞清茶，一方紋樣。' },
  { id: 'coral', name: '珊瑚礁', color: '#F0C239', bio: '從海洋汲取靈感的紋樣創作者。' },
  { id: 'ume', name: '梅の花', color: '#F47983', bio: '梅一輪、文様に心を込めて。' },
  { id: 'fuji', name: '富士見', color: '#3B6999', bio: '富士山のように大きく、美しい文様を。' },
  { id: 'hangang', name: '한강별빛', color: '#8DD4E8', bio: '한강의 별빛을 문양에 담습니다.' },
  { id: 'jeju', name: '제주바람', color: '#789262', bio: '제주의 바람과 돌을 닮은 문양.' },
  { id: 'nice', name: 'Nice Azure', color: '#3B6999', bio: 'La Méditerranée inspire mes créations.' },
  { id: 'stras', name: 'Strasbourg Blanc', color: '#D6ECF0', bio: 'Entre Rhin et motifs, je crée des ponts.' },
  { id: 'granada', name: 'Granada Mora', color: '#C24B36', bio: 'Patrones andalusíes con alma china.' },
  { id: 'cadiz', name: 'Cádiz Sal', color: '#F0C239', bio: 'La sal del mar y la seda de oriente.' },
  { id: 'ural', name: 'Уральский Самоцвет', color: '#789262', bio: 'Уральские сказы в каждом узоре.' },
  { id: 'baikal', name: 'Байкал Лёд', color: '#3B6999', bio: 'Глубина Байкала в линиях и цветах.' },
  { id: 'medina', name: 'المدينة المنورة', color: '#D4A853', bio: 'أنماط من قلب المدينة القديمة.' },
  { id: 'sharjah', name: 'الشارقة فن', color: '#1685A9', bio: 'الفن الإماراتي يلتقي بالزخرفة الصينية.' },
];

export function getUserById(id: string): UserProfile | undefined {
  return users.find((u) => u.id === id);
}

export function getUserByAuthorName(name: string): UserProfile | undefined {
  return users.find((u) => u.name === name);
}
