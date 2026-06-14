import { useTranslation } from 'react-i18next';
import CloudPattern, { cloudPathIds } from '../svgs/CloudPattern';
import RuyiPattern, { ruyiPathIds } from '../svgs/RuyiPattern';
import DragonPattern, { dragonPathIds } from '../svgs/DragonPattern';
import HuiwenPattern, { huiwenPathIds } from '../svgs/HuiwenPattern';
import CustomPattern from '../svgs/CustomPattern';
import type { Pattern } from '../../types';

interface SvgCanvasProps {
  svgId: Pattern['svgId'];
  fillColors: Record<string, string>;
  onPathClick: (pathId: string) => void;
}

const COMPONENTS = {
  cloud: CloudPattern,
  ruyi: RuyiPattern,
  dragon: DragonPattern,
  huiwen: HuiwenPattern,
} as const;

const PATH_IDS = {
  cloud: cloudPathIds,
  ruyi: ruyiPathIds,
  dragon: dragonPathIds,
  huiwen: huiwenPathIds,
} as const;

export default function SvgCanvas({
  svgId,
  fillColors,
  onPathClick,
  customPattern,
}: SvgCanvasProps & { customPattern?: Pattern }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl border border-charcoal/5 shadow-sm">
      <div id="fill-canvas" className="p-4">
        {svgId === 'custom' && customPattern?.customPaths ? (
          <CustomPattern
            variant="outline"
            fillColors={fillColors}
            onPathClick={onPathClick}
            paths={customPattern.customPaths}
            viewBox={customPattern.customViewBox}
          />
        ) : (
          (() => {
            if (svgId in COMPONENTS) {
              const Svg = COMPONENTS[svgId as keyof typeof COMPONENTS];
              return (
                <Svg
                  variant="outline"
                  fillColors={fillColors}
                  onPathClick={onPathClick}
                />
              );
            }
            return null;
          })()
        )}
      </div>
      <p className="text-center text-[10px] text-charcoal/30 pb-2">
        {t('create.fillHint')}
      </p>
    </div>
  );
}

export { PATH_IDS };
