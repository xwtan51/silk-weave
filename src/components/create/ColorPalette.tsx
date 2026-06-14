import type { SwatchColor } from '../../data/colors';

interface ColorPaletteProps {
  colors: SwatchColor[];
  activeColor: string;
  onColorChange: (hex: string) => void;
}

export default function ColorPalette({
  colors,
  activeColor,
  onColorChange,
}: ColorPaletteProps) {
  return (
    <div className="flex justify-center gap-2.5">
      {colors.map((c) => (
        <button
          key={c.hex}
          onClick={() => onColorChange(c.hex)}
          className={`w-8 h-8 rounded-full shadow-sm transition-all ${
            activeColor === c.hex
              ? 'scale-125 ring-2 ring-charcoal/20 ring-offset-2 ring-offset-paper'
              : 'hover:scale-110 active:scale-95'
          }`}
          style={{ backgroundColor: c.hex }}
          title={c.hex}
        />
      ))}
    </div>
  );
}
