import { useRef, useState, type CSSProperties } from 'react';
import { local, type Lang } from './game';
import { openingObjects, openingScene, openingTitle, type OpeningAction, type OpeningObjectConfig } from './opening-config';
import './opening.css';

function placement(item: { x: number; y: number; width: number }): CSSProperties {
  return {
    left: `${item.x / openingScene.width * 100}%`,
    top: `${item.y / openingScene.height * 100}%`,
    width: `${item.width / openingScene.width * 100}%`,
  };
}

function OpeningObject({ config, candle, disabled, lang, onSelect, onHover }: {
  config: OpeningObjectConfig;
  candle: boolean;
  disabled: boolean;
  lang: Lang;
  onSelect: () => void;
  onHover: (id: string, active: boolean) => void;
}) {
  const src = candle && config.candleImage ? config.candleImage : config.image;
  const label = local(candle && config.candleLabel ? config.candleLabel : config.label, lang);
  const image = useRef<HTMLImageElement>(null);
  const alpha = useRef<ImageData | null>(null);
  const [hovered, setHovered] = useState(false);

  function rememberAlpha(element: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = element.naturalWidth;
    canvas.height = element.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || !canvas.width || !canvas.height) return;
    context.drawImage(element, 0, 0);
    alpha.current = context.getImageData(0, 0, canvas.width, canvas.height);
  }

  function isVisibleAt(clientX: number, clientY: number) {
    const element = image.current;
    const mask = alpha.current;
    if (!element || !mask || !element.complete) return false;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const x = Math.floor((clientX - rect.left) / rect.width * mask.width);
    const y = Math.floor((clientY - rect.top) / rect.height * mask.height);
    return x >= 0 && y >= 0 && x < mask.width && y < mask.height &&
      mask.data[(y * mask.width + x) * 4 + 3] >= config.hitArea.alphaThreshold;
  }

  function changeHover(active: boolean) {
    setHovered(active);
    onHover(config.id, active);
  }

  return <button type="button" aria-label={label} disabled={disabled}
    className={`opening-object${hovered ? ' is-hovered' : ''}`}
    data-opening-object={config.id}
    data-opening-state={candle && config.candleImage ? 'lit' : 'default'}
    style={{ ...placement(config), zIndex: config.layer, opacity: config.opacity,
      '--object-brightness': config.hoverBrightness } as CSSProperties}
    onPointerEnter={event => changeHover(isVisibleAt(event.clientX, event.clientY))}
    onPointerMove={event => changeHover(isVisibleAt(event.clientX, event.clientY))}
    onPointerLeave={() => changeHover(false)}
    onClick={event => {
      // Keyboard activation is preserved. Pointer clicks use the sprite's native alpha.
      if (event.detail === 0 || isVisibleAt(event.clientX, event.clientY)) onSelect();
    }}>
    <img ref={image} src={src} alt="" draggable={false} style={{ imageRendering: config.imageRendering }}
      onLoad={event => rememberAlpha(event.currentTarget)}/>
  </button>;
}

export function OpeningRoom({ starting, candle, onStart, onCake, lang, notice }: {
  starting: boolean;
  candle: boolean;
  onStart: () => void;
  onCake: () => void;
  lang: Lang;
  notice: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const actions: Record<OpeningAction, () => void> = { start: onStart, inspectCake: onCake };
  const selected = openingObjects.find(object => object.id === hovered);
  const hint = selected
    ? local(candle && selected.candleLabel ? selected.candleLabel : selected.label, lang)
    : local(['컴퓨터를 켜세요.', '点击电脑开机。'], lang);

  return <main className={`opening-room${starting ? ' opening-entering' : ''}`}
    style={{ '--opening-ratio': openingScene.width / openingScene.height,
      '--opening-background': openingScene.background } as CSSProperties}>
    <div className="opening-stage">
      <div className="opening-table" aria-hidden="true"/>
      <h1 className="opening-title" aria-label={openingTitle.lines.join(' ')} style={placement(openingTitle)}>
        {openingTitle.image ? <img src={openingTitle.image} alt={openingTitle.lines.join(' ')}/>
          : openingTitle.lines.map(line => <span key={line}>{line}</span>)}
      </h1>
      {openingObjects.map(config => <div key={config.id} className="opening-item-slot">
        <OpeningObject config={config} {...{ candle, lang }} disabled={starting}
          onSelect={actions[config.action]}
          onHover={(id, on) => setHovered(current => on ? id : current === id ? null : current)}/>
      </div>)}
      <p className="opening-status" role="status">{notice || hint}</p>
    </div>
  </main>;
}
