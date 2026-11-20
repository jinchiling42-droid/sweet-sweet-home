import React from 'react';
export function RetroIcon({ kind }: { kind: string }) {
  const folder = ['records', 'hidden', 'detail'].includes(kind);
  return (
    <svg
      className="retro-icon"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      stroke="#26394c"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      {folder ? (
        <>
          <path d="M7 16h21l5 6h24v32H7z" fill="#819fba" />
          <path d="M12 18h17l5 5h20v25H12z" fill="#f1f3ed" />
          <path d="M6 29h52l-5 27H10z" fill="#aec9df" />
          <path d="M10 34h44M11 38h42" stroke="#dcebf4" />
          {kind === 'hidden' ? (
            <>
              <rect x="25" y="39" width="14" height="12" fill="#edf0eb" />
              <path d="M28 39v-5a4 4 0 018 0v5" />
            </>
          ) : (
            <path d="M26 42h12m-6-6v12" />
          )}
        </>
      ) : kind === 'notes' ? (
        <>
          <path d="M14 6h31l7 8v44H14z" fill="#f1f2e8" />
          <path
            d="M44 6v11h8M20 25h24M20 32h24M20 39h19M20 46h22"
            stroke="#68859f"
          />
          <path d="M10 11v43" />
        </>
      ) : kind === 'video' ? (
        <>
          <rect x="6" y="13" width="51" height="40" rx="2" fill="#91a7bc" />
          <rect x="14" y="20" width="35" height="26" fill="#d7e5ed" />
          <path d="M27 25l13 8-13 8z" fill="#476c91" />
          <path d="M9 18v6m0 8v6m0 8v3m45-31v6m0 8v6m0 8v3" />
        </>
      ) : kind === 'calc' ? (
        <>
          <rect x="14" y="6" width="37" height="53" rx="3" fill="#b3c2cd" />
          <path d="M20 12h25v12H20z" fill="#edf3ed" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect
              key={i}
              x={21 + (i % 3) * 9}
              y={30 + Math.floor(i / 3) * 8}
              width="5"
              height="4"
              fill="#f1f2ee"
            />
          ))}
        </>
      ) : kind === 'ipod' ? (
        <>
          <rect x="16" y="5" width="32" height="54" rx="5" fill="#dce7ed" />
          <rect x="21" y="11" width="22" height="17" rx="2" fill="#a2bdd0" />
          <path d="M34 16v7m0-7 4 2" />
          <circle cx="31" cy="23" r="2.5" fill="#26394c" />
          <circle cx="32" cy="43" r="11" fill="#f5f6f2" />
          <circle cx="32" cy="43" r="4" fill="#afc4d3" />
        </>
      ) : kind === 'mine' ? (
        <>
          <rect x="9" y="10" width="46" height="46" fill="#d4e0e6" />
          <path d="M9 25h46M9 40h46M24 10v46M40 10v46" stroke="#7992a7" />
          <circle cx="32" cy="33" r="7" fill="#425a70" />
          <path d="M32 22v22M21 33h22" />
        </>
      ) : (
        <>
          <path d="M8 19h48v33H8z" fill="#9eb3c7" />
          <path d="M13 24h38v21H13z" fill="#e3edf0" />
          <path d="M26 52v6m12-6v6H20m6-26h12m-6-6v12" />
          <path d="M12 14h40" />
        </>
      )}
    </svg>
  );
}
export function Room({
  starting,
  onStart,
  onCake,
  lang,
  notice,
}: {
  starting: boolean;
  onStart: () => void;
  onCake: () => void;
  lang: string;
  notice: string;
}) {
  return (
    <div className={'room illustrated-room ' + (starting ? 'entering' : '')}>
      <div className="room-heading">
        <h1>
          Sweet
          <br />
          Sweet Home
        </h1>
        <p>
          {lang === 'ko'
            ? '잠시 머물러도 괜찮은 곳.'
            : '一个可以暂时停留的地方。'}
        </p>
      </div>
      <svg
        className="room-drawing"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".55" fill="#304659" opacity=".18" />
          </pattern>
        </defs>
        <path fill="#aabccb" d="M0 0h1440v900H0z" />
        <path fill="#c6d2db" d="M0 0h1440v525H0z" />
        <path fill="#8da4b7" d="M970 0h470v525H970z" />
        <g stroke="#344b60" strokeWidth="3">
          <path d="M1015-5h360v414h-360z" fill="#526f8a" />
          <path d="M1033 0h304v393h-304z" fill="#a6c5db" />
          <path d="M1178 0v393M1033 211h304" strokeWidth="8" />
          <path
            d="M1033 276l55-75 58 31 53-112 76 33 62-55v295h-304z"
            fill="#819eb6"
            stroke="none"
          />
          <path
            d="M1033 330l94-48 78 30 62-86 70 33v134h-304z"
            fill="#6a88a2"
            stroke="none"
          />
          <path d="M1178 0v393M1033 211h304" strokeWidth="8" />
          <path d="M1000 414h390v17h-390z" fill="#dce5e7" />
          <path d="M0 505h1440l140 395H-140z" fill="#a9bbc7" />
          <path d="M0 555h1440M0 864h1440" />
          <path d="M0 864h1440v36H0z" fill="#6c8499" />
        </g>
        <path
          fill="#f3f7fa"
          opacity=".27"
          d="M1040 430h310l100 360-415-103-286-159z"
        />
        <path
          fill="none"
          opacity=".22"
          stroke="#334e63"
          strokeWidth="2"
          d="M8 584c156-7 337-1 486 0m-83 253c187 5 428-9 605-1M24 809c81 1 136-7 235-1m101-286c114 11 296-7 408 3M147 533l286 4m663-73 279 1M1065 434l232 2"
        />
        <path fill="url(#dots)" d="M0 0h1440v900H0z" />
      </svg>
      <button
        className="laptop"
        onClick={onStart}
        aria-label={lang === 'ko' ? '컴퓨터 켜기' : '打开电脑'}
        disabled={starting}
      >
        <span className="screen">
          <span className="screen-top">SWEET OS</span>
          <span className="screen-logo">
            <RetroIcon kind="settings" />
          </span>
          <strong>Sweet Sweet Home</strong>
          <span className="screen-rule" />
          <small>{lang === 'ko' ? '화면을 눌러 시작' : '点击屏幕进入'}</small>
        </span>
        <span className="keyboard">
          <i />
          <b />
        </span>
      </button>
      <button
        className="cake"
        onClick={onCake}
        aria-label={lang === 'ko' ? '케이크 살펴보기' : '查看蛋糕'}
      >
        <svg
          viewBox="0 0 160 130"
          fill="none"
          stroke="#30465a"
          strokeWidth="2.5"
        >
          <ellipse cx="79" cy="103" rx="71" ry="20" fill="#7d94a7" />
          <ellipse cx="77" cy="98" rx="68" ry="19" fill="#e2e9eb" />
          <path d="M36 50l49-28 43 47-4 32-88-15z" fill="#c6c1ba" />
          <path d="M36 62l90 17M36 74l89 17" stroke="#f0eee4" strokeWidth="9" />
          <path d="M36 50l49-28 43 47-92-16z" fill="#f0eee4" />
          <path d="M36 50v36l88 15 4-32" />
          <path d="M75 38c-15-18 11-27 17-9 5 13-11 15-17 9z" fill="#9d6f78" />
          <path d="M81 26l1-8" />
        </svg>
        <small>{lang === 'ko' ? '케이크' : '蛋糕'}</small>
      </button>
      <div className="room-caption" role="status">
        {notice ||
          (lang === 'ko'
            ? '컴퓨터를 켜고, 남겨진 이야기를 살펴보세요.'
            : '打开电脑，查看留在这里的故事。')}
      </div>
    </div>
  );
}
