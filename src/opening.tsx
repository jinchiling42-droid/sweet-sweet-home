import { useRef, useState, type CSSProperties } from 'react';
import { local, type Lang } from './game';
import { openingObjects, openingScene, openingTitle, type OpeningAction, type OpeningObjectConfig } from './opening-config';
import './opening.css';

function placement(item: { x: number; y: number; width: number }): CSSProperties {
  const { crop } = openingScene;
  return {
    left: `${(item.x - crop.x) / crop.width * 100}%`,
    top: `${(item.y - crop.y) / crop.height * 100}%`,
    width: `${item.width / crop.width * 100}%`,
  };
}

function roomHighlight(config: OpeningObjectConfig): CSSProperties {
  const { room } = openingScene;
  const height = config.roomRegionHeight!;
  return {
    backgroundImage: `url("${room.image}")`,
    backgroundSize: `${room.width / config.width * 100}% ${room.height / height * 100}%`,
    backgroundPosition: `${config.x / (room.width - config.width) * 100}% ${config.y / (room.height - height) * 100}%`,
    maskImage: `url("${config.image}")`,
  };
}

function OpeningObject({ config, candle, disabled, lang, onSelect }: {
  config: OpeningObjectConfig;
  candle: boolean;
  disabled: boolean;
  lang: Lang;
  onSelect: () => void;
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

  return <button type="button" aria-label={label} disabled={disabled}
    className={`opening-object${config.roomRegionHeight ? ' opening-room-object' : ''}${hovered ? ' is-hovered' : ''}`}
    data-opening-object={config.id}
    data-opening-state={candle && config.candleImage ? 'lit' : 'default'}
    style={{ ...placement(config), zIndex: config.layer, opacity: config.opacity,
      '--object-brightness': config.hoverBrightness } as CSSProperties}
    onPointerEnter={event => setHovered(isVisibleAt(event.clientX, event.clientY))}
    onPointerMove={event => setHovered(isVisibleAt(event.clientX, event.clientY))}
    onPointerLeave={() => setHovered(false)}
    onClick={event => {
      // Keyboard activation is preserved. Pointer clicks use the sprite's native alpha.
      if (event.detail === 0 || isVisibleAt(event.clientX, event.clientY)) onSelect();
    }}>
    <img ref={image} src={src} alt="" draggable={false} style={{ imageRendering: config.imageRendering }}
      className={config.roomRegionHeight ? 'opening-hotspot-mask' : undefined}
      onLoad={event => rememberAlpha(event.currentTarget)}/>
    {config.roomRegionHeight && <span aria-hidden="true" className="opening-room-highlight" style={roomHighlight(config)}/>}
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
  const actions: Record<OpeningAction, () => void> = { start: onStart, inspectCake: onCake };

  return <main className={`opening-room${starting ? ' opening-entering' : ''}`}
    style={{ '--opening-ratio': openingScene.crop.width / openingScene.crop.height,
      '--opening-background': openingScene.background } as CSSProperties}>
    <div className="opening-stage">
      <img className="opening-room-image" src={openingScene.room.image} alt="" draggable={false}
        style={placement({ x: 0, y: 0, width: openingScene.room.width })}/>
      <h1 className="opening-title" aria-label={openingTitle.lines.join(' ')} style={placement(openingTitle)}>
        {openingTitle.image ? <img src={openingTitle.image} alt={openingTitle.lines.join(' ')}/>
          : openingTitle.lines.map(line => <span key={line}>{line}</span>)}
      </h1>
      {openingObjects.map(config => <div key={config.id} className="opening-item-slot">
        <OpeningObject config={config} {...{ candle, lang }} disabled={starting}
          onSelect={actions[config.action]}/>
      </div>)}
      {notice && <p className="opening-status" role="status">{notice}</p>}
    </div>
  </main>;
}
