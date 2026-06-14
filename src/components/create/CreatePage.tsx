import { useState, useCallback, useRef, createElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../layout/Toast';
import { toPng } from 'html-to-image';
import { Download, Send, Sparkles, Loader2 } from 'lucide-react';
import ModeToggle, { type CreateMode } from './ModeToggle';
import PatternSelector from './PatternSelector';
import SvgCanvas from './SvgCanvas';
import ThemeSelector from './ThemeSelector';
import ColorPalette from './ColorPalette';
import Toolbar from './Toolbar';
import SharePanel from './SharePanel';
import DoodleCanvas, { type Stroke, BrushSizeSelector } from './DoodleCanvas';
import PublishPage from './PublishPage';
import CloudPattern from '../svgs/CloudPattern';
import RuyiPattern from '../svgs/RuyiPattern';
import DragonPattern from '../svgs/DragonPattern';
import HuiwenPattern from '../svgs/HuiwenPattern';
import CustomPattern from '../svgs/CustomPattern';
import { patterns } from '../../data/patterns';
import { themes } from '../../data/colors';
import { addUserPattern } from '../../data/storage';
import type { Pattern, CustomPath } from '../../types';

interface CreatePageProps {
  patternToColor: Pattern | null;
}

interface FillRecord {
  pathId: string;
  color: string;
}

const SVG_COMPONENTS = {
  cloud: CloudPattern,
  ruyi: RuyiPattern,
  dragon: DragonPattern,
  huiwen: HuiwenPattern,
  custom: CustomPattern,
} as const;

const DEFAULT_THEME = themes[0];
const WALLPAPER_W = 1242;
const WALLPAPER_H = 2688;

export default function CreatePage({ patternToColor }: CreatePageProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  /* ---- shared state ---- */
  const [mode, setMode] = useState<CreateMode>('fill');
  const [activeThemeId, setActiveThemeId] = useState(DEFAULT_THEME.id);
  const [activeColor, setActiveColor] = useState(DEFAULT_THEME.colors[0].hex);
  const [showShare, setShowShare] = useState(false);
  const [customThemes, setCustomThemes] = useState<typeof themes>([]);

  const allThemes = [...customThemes, ...themes];
  const activeTheme = allThemes.find((t) => t.id === activeThemeId) ?? DEFAULT_THEME;
  const initialPatternId = patternToColor?.svgId ?? 'cloud';
  const [selectedSvgId, setSelectedSvgId] = useState<Pattern['svgId']>(initialPatternId);

  const handleThemeChange = (id: string) => {
    setActiveThemeId(id);
    const theme = allThemes.find((t) => t.id === id);
    if (theme) setActiveColor(theme.colors[0].hex);
  };

  /* ---- fill mode state ---- */
  const [fillColors, setFillColors] = useState<Record<string, string>>({});
  const [fillHistory, setFillHistory] = useState<FillRecord[]>([]);

  const handlePathClick = useCallback(
    (pathId: string) => {
      setFillColors((prev) => ({ ...prev, [pathId]: activeColor }));
      setFillHistory((prev) => [
        ...prev,
        { pathId, color: fillColors[pathId] || 'transparent' },
      ]);
    },
    [activeColor, fillColors],
  );

  /* ---- doodle mode state ---- */
  const [doodleStrokes, setDoodleStrokes] = useState<Stroke[]>([]);
  const [brushSize, setBrushSize] = useState(4);
  const [eraser, setEraser] = useState(false);

  const handleAddStroke = useCallback((stroke: Stroke) => {
    setDoodleStrokes((prev) => [...prev, stroke]);
  }, []);

  /* ---- derived state ---- */
  const currentPattern = patterns.find((p) => p.svgId === selectedSvgId);
  const patternName = selectedSvgId !== 'custom' ? t(`pattern.${selectedSvgId}.name`) : (currentPattern?.name || '');

  /* ---- undo / reset (mode-aware) ---- */
  const canUndo = mode === 'fill' ? fillHistory.length > 0 : doodleStrokes.length > 0;

  const handleUndo = () => {
    if (mode === 'fill') {
      if (fillHistory.length === 0) return;
      const last = fillHistory[fillHistory.length - 1];
      setFillColors((prev) => {
        const next = { ...prev };
        delete next[last.pathId];
        return next;
      });
      setFillHistory((prev) => prev.slice(0, -1));
    } else {
      setDoodleStrokes((prev) => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    if (mode === 'fill') {
      setFillColors({});
      setFillHistory([]);
    } else {
      setDoodleStrokes([]);
    }
  };

  /* ---- wallpaper download ---- */
  const handleDownloadWallpaper = useCallback(async () => {
    try {
      let sourceUrl: string;

      if (mode === 'fill') {
        const el = document.querySelector('#fill-canvas') as HTMLElement | null;
        if (!el) return;
        sourceUrl = await toPng(el, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#F9F6F0',
        });
      } else {
        const canvas = document.querySelector('#doodle-canvas') as HTMLCanvasElement | null;
        if (!canvas) return;
        sourceUrl = canvas.toDataURL('image/png');
      }

      // Draw onto wallpaper-sized canvas
      const img = await loadImage(sourceUrl);
      const out = document.createElement('canvas');
      out.width = WALLPAPER_W;
      out.height = WALLPAPER_H;
      const ctx = out.getContext('2d')!;

      // Fill background
      ctx.fillStyle = '#F9F6F0';
      ctx.fillRect(0, 0, WALLPAPER_W, WALLPAPER_H);

      // Center the pattern, fit to 80% of the wallpaper width
      const scale = (WALLPAPER_W * 0.8) / img.width;
      const x = (WALLPAPER_W - img.width * scale) / 2;
      const y = (WALLPAPER_H - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Download
      out.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${patternName || 'pattern'}-wallpaper.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Wallpaper download failed', err);
    }
  }, [mode]);

  /* ---- AI palette ---- */
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleGeneratePalette = async () => {
    const p = aiPrompt.trim();
    if (!p || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/generate-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (data.colors?.length) {
        const newTheme = {
          id: `ai-${Date.now()}`,
          name: data.name || p.slice(0, 20),
          desc: `AI: ${p.slice(0, 40)}`,
          colors: data.colors.map((c: any) => ({ hex: c.hex, name: c.name || '' })),
        };
        setCustomThemes((prev) => [newTheme, ...prev].slice(0, 5));
        setActiveThemeId(newTheme.id);
        setActiveColor(data.colors[0].hex);
        setAiPrompt('');
      }
    } catch (e) {
      console.error('AI palette error', e);
      toast(t('ai.paletteFailed'), 'error');
    }
    setAiLoading(false);
  };

  /* ---- publish to gallery ---- */
  const [publishData, setPublishData] = useState<{ paths: CustomPath[]; viewBox?: string; imageUrl?: string; defaultTitle?: string } | null>(null);

  const handleOpenPublish = async () => {
    if (mode === 'fill') {
      const svg = document.querySelector('#fill-canvas svg') as SVGElement | null;
      if (!svg) return;
      const paths: CustomPath[] = [];
      svg.querySelectorAll('path[data-path-id]').forEach((el) => {
        const path = el as SVGPathElement;
        const id = path.getAttribute('data-path-id') || '';
        const d = path.getAttribute('d') || '';
        const fill = path.getAttribute('fill') || undefined;
        if (d) paths.push({ id, d, fill });
      });
      if (paths.length === 0) return;
      const fallback = t('create.myPattern');
      const name = currentPattern?.name || fallback;
      setPublishData({ paths, viewBox: svg.getAttribute('viewBox') || '0 0 1024 1024', defaultTitle: `${name} (${t('create.myVersion')})` });
    } else {
      // Convert doodle strokes to SVG paths
      const paths: CustomPath[] = [];
      for (let i = 0; i < doodleStrokes.length; i++) {
        const s = doodleStrokes[i];
        if (s.points.length < 2) continue;
        const d = s.points.map((p, j) => `${j === 0 ? 'M' : 'L'} ${(p.x / 100) * 1024} ${(p.y / 100) * 1024}`).join(' ');
        paths.push({ id: `doodle-${i}`, d, stroke: s.color, strokeWidth: s.width });
      }
      if (paths.length === 0) return;
      const fallback = t('create.myDoodle');
      setPublishData({ paths, viewBox: '0 0 1024 1024', defaultTitle: fallback });
    }
  };

  const handlePost = async (pattern: Pattern) => {
    await addUserPattern(pattern);
    setPublishData(null);
    toast(t('create.published'), 'success');
  };

  /* ---- artwork card download (fill mode) ---- */
  const artworkRef = useRef<HTMLDivElement>(null);
  const usedColors = [...new Set(Object.values(fillColors))];

  const handleSaveArtwork = async () => {
    if (mode === 'fill') {
      if (!artworkRef.current) return;
      try {
        const dataUrl = await toPng(artworkRef.current, { quality: 0.95, pixelRatio: 3, backgroundColor: '#F9F6F0' });
        const link = document.createElement('a');
        link.download = `${patternName || 'pattern'}-artwork.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) { console.error('Save artwork failed', err); }
    } else {
      const canvas = document.querySelector('#doodle-canvas') as HTMLCanvasElement | null;
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'my-doodle.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  /* ---- render ---- */
  return (
    <div className="min-h-full flex flex-col p-5 pb-8 gap-4">
      <h2 className="text-lg font-semibold text-charcoal text-center">
        {t('create.title')}
      </h2>

      <ModeToggle mode={mode} onChange={setMode} />

      {mode === 'fill' ? (
        <>
          <PatternSelector
            patterns={patterns}
            selectedSvgId={selectedSvgId}
            onChange={setSelectedSvgId}
          />
          <SvgCanvas
            svgId={selectedSvgId}
            fillColors={fillColors}
            onPathClick={handlePathClick}
            customPattern={currentPattern}
          />

          {/* Hidden artwork card for capture */}
          <div className="fixed left-[-9999px] top-0" aria-hidden="true">
            <div ref={artworkRef} className="bg-paper rounded-xl p-4 space-y-3" style={{ width: 300 }}>
              <div className="w-full h-44 bg-white rounded-lg flex items-center justify-center p-3">
                {selectedSvgId === 'custom' && currentPattern?.customPaths ? (
                  createElement(CustomPattern, {
                    variant: 'color',
                    fillColors,
                    paths: currentPattern.customPaths,
                    viewBox: currentPattern.customViewBox,
                  })
                ) : (
                  createElement(
                    SVG_COMPONENTS[selectedSvgId as keyof typeof SVG_COMPONENTS] as any,
                    { variant: 'color', fillColors },
                  )
                )}
              </div>
              <h2 className="text-base font-semibold text-charcoal text-center">
                {t('create.artworkTitle')}
              </h2>
              {usedColors.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-charcoal/30 text-center mb-1.5">
                    {t('create.artworkColorsUsed')}
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {usedColors.map((hex) => (
                      <span
                        key={hex}
                        className="w-6 h-6 rounded-md shadow-sm"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </>
      ) : (
        <>
          <DoodleCanvas
            strokes={doodleStrokes}
            activeColor={activeColor}
            brushSize={brushSize}
            eraser={eraser}
            onAddStroke={handleAddStroke}
          />
          <div className="flex items-center justify-center gap-3">
            <BrushSizeSelector size={brushSize} onChange={setBrushSize} />
            <button
              onClick={() => setEraser(!eraser)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                eraser ? 'bg-vermillion text-white' : 'bg-white text-charcoal/50 border border-charcoal/10'
              }`}
            >
              {t('create.eraser')}
            </button>
          </div>
        </>
      )}

      {/* Publish to gallery */}
      <button onClick={handleOpenPublish}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 active:scale-[0.98] transition-all">
        <Send size={15} />{t('create.publish')}
      </button>

      {/* Save Artwork */}
      <button onClick={handleSaveArtwork}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-jade text-white text-xs font-medium hover:bg-jade/90 active:scale-[0.98] transition-all">
        <Download size={15} />{t('create.saveArtwork')}
      </button>

      <ThemeSelector
        themes={allThemes}
        activeId={activeThemeId}
        onChange={handleThemeChange}
      />

      <ColorPalette
        colors={activeTheme.colors}
        activeColor={activeColor}
        onColorChange={setActiveColor}
      />

      {/* AI Palette Generator */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 bg-white rounded-lg border border-charcoal/10 px-3 py-2">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeneratePalette()}
              placeholder={t('ai.aiPlaceholder')}
              className="flex-1 bg-transparent text-xs text-charcoal placeholder:text-charcoal/25 outline-none"
            />
          </div>
          <button
            onClick={handleGeneratePalette}
            disabled={aiLoading || !aiPrompt.trim()}
            className="shrink-0 px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-40 transition-all flex items-center gap-1"
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {t('ai.aiGenerate')}
          </button>
        </div>
        {customThemes.length > 0 && (
          <p className="text-[10px] text-charcoal/30 text-center">
            {t('ai.aiHint')}
          </p>
        )}
      </div>

      {/* Wallpaper button */}
      <button
        onClick={handleDownloadWallpaper}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-vermillion text-white text-xs font-medium hover:bg-vermillion/90 active:scale-[0.98] transition-all"
      >
        <Download size={15} />
        {t('create.wallpaper')}
      </button>

      <Toolbar
        canUndo={canUndo}
        onUndo={handleUndo}
        onReset={handleReset}
        onShare={() => setShowShare(true)}
      />

      {showShare && <SharePanel onClose={() => setShowShare(false)} />}

      {publishData && (
        <PublishPage data={publishData} onPost={handlePost} onClose={() => setPublishData(null)} />
      )}
    </div>
  );
}

/* ---- helper ---- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
