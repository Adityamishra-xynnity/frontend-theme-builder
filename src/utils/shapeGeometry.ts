export type ShapeSvgSpec =
  | { kind: "polygon"; points: string }
  | { kind: "path"; d: string; viewBox?: string; noFill?: boolean }
  | { kind: "rect"; rx: number }
  | { kind: "circle" };

function toPointsString(pts: { x: number; y: number }[], width: number, height: number): string {
  if (pts.length === 0) return "";
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const sw = maxX - minX;
  const sh = maxY - minY;
  if (sw <= 0 || sh <= 0) {
    return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  }
  return pts
    .map((p) => `${(((p.x - minX) / sw) * width).toFixed(1)},${(((p.y - minY) / sh) * height).toFixed(1)}`)
    .join(" ");
}

function createPolygonPts(sides: number, width: number, height: number) {
  const safeSides = Math.max(3, Math.min(12, sides));
  return Array.from({ length: safeSides }, (_, index) => {
    const angle = (Math.PI * 2 * index) / safeSides - Math.PI / 2;
    return {
      x: width / 2 + Math.cos(angle) * (width / 2),
      y: height / 2 + Math.sin(angle) * (height / 2),
    };
  });
}

function createStarPts(points: number, width: number, height: number, innerRatio: number) {
  const count = Math.max(4, Math.min(32, points));
  return Array.from({ length: count * 2 }, (_, index) => {
    const outer = index % 2 === 0;
    const angle = (Math.PI * index) / count - Math.PI / 2;
    const ratio = outer ? 1 : innerRatio;
    return {
      x: width / 2 + Math.cos(angle) * (width / 2) * ratio,
      y: height / 2 + Math.sin(angle) * (height / 2) * ratio,
    };
  });
}

function createCogPts(teeth: number, width: number, height: number) {
  const count = Math.max(4, Math.min(24, teeth)) * 4;
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const step = i % 4;
    const r = step === 0 || step === 3 ? 1 : 0.78;
    return {
      x: width / 2 + Math.cos(angle) * (width / 2) * r,
      y: height / 2 + Math.sin(angle) * (height / 2) * r,
    };
  });
}

function createFlowerPts(petals: number, width: number, height: number) {
  const count = Math.max(4, Math.min(16, petals)) * 24;
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count;
    const r = 0.68 + 0.32 * Math.cos(petals * angle);
    return {
      x: width / 2 + Math.cos(angle) * (width / 2) * r,
      y: height / 2 + Math.sin(angle) * (height / 2) * r,
    };
  });
}

function createOrganicPts(variant: number, width: number, height: number) {
  return Array.from({ length: 80 }, (_, i) => {
    const angle = (i / 80) * Math.PI * 2;
    const wave =
      Math.sin(angle * (variant + 2)) * 0.09 +
      Math.cos(angle * (variant + 3)) * 0.06;
    const r = 0.83 + wave;
    return {
      x: width / 2 + Math.cos(angle) * (width / 2) * r,
      y: height / 2 + Math.sin(angle) * (height / 2) * r,
    };
  });
}

const FLOWER_MAP: Record<string, number> = {
  flower: 6,
  "flower-5": 5,
  "flower-6": 6,
  "flower-8": 8,
  "flower-12": 12,
  "flower-daisy": 12,
  "flower-sunflower": 16,
  "flower-rose": 10,
  "flower-lotus": 8,
  "flower-lily": 6,
  "flower-tulip": 5,
  "flower-hibiscus": 5,
  "flower-cherry-blossom": 5,
  petal: 5,
  "petal-rounded": 6,
  "petal-pointed": 4,
};

const ORGANIC_MAP: Record<string, number> = {
  "organic-blob": 1,
  "organic-blob-2": 2,
  "organic-blob-3": 3,
  "organic-cloud": 4,
  "organic-splash": 5,
  "organic-pebble": 6,
};

export function getShapeSvgSpec(
  type: string,
  width: number,
  height: number,
  shapeSides?: number,
): ShapeSvgSpec | null {
  if (/^star(?:-outline|-\d+)?$/.test(type) || /^square-star-\d+$/.test(type)) {
    const match = type.match(/(\d+)$/);
    const points = match ? Number(match[1]) : 5;
    const isSquareStar = type.startsWith("square-star");
    const innerRatio = isSquareStar || points >= 16 ? 41 / 75 : 34 / 75;
    return { kind: "polygon", points: toPointsString(createStarPts(points, width, height, innerRatio), width, height) };
  }

  if (
    type === "polygon" ||
    type === "pentagon" ||
    type === "hexagon" ||
    type === "heptagon" ||
    type === "octagon"
  ) {
    const sides =
      shapeSides ??
      (type === "pentagon" ? 5 : type === "hexagon" ? 6 : type === "heptagon" ? 7 : type === "octagon" ? 8 : 6);
    return { kind: "polygon", points: toPointsString(createPolygonPts(sides, width, height), width, height) };
  }

  const cog = type.match(/^cog-(4|6|8|10|12|16|20|24)$/);
  if (cog) {
    return { kind: "polygon", points: toPointsString(createCogPts(Number(cog[1]), width, height), width, height) };
  }

  if (FLOWER_MAP[type]) {
    return { kind: "polygon", points: toPointsString(createFlowerPts(FLOWER_MAP[type], width, height), width, height) };
  }

  if (ORGANIC_MAP[type]) {
    return { kind: "polygon", points: toPointsString(createOrganicPts(ORGANIC_MAP[type], width, height), width, height) };
  }

  if (type === "flow-process") return { kind: "rect", rx: 0 };
  if (type === "flow-terminator") return { kind: "rect", rx: Math.min(width, height) / 2 };
  if (type === "rounded-bubble") return { kind: "rect", rx: Math.min(24, Math.min(width, height) / 2) };
  if (type === "flow-connector") return { kind: "circle" };

  if (type === "flow-decision") {
    return {
      kind: "polygon",
      points: toPointsString(
        [
          { x: width / 2, y: 0 },
          { x: width, y: height / 2 },
          { x: width / 2, y: height },
          { x: 0, y: height / 2 },
        ],
        width,
        height,
      ),
    };
  }

  if (type === "flow-io") {
    return {
      kind: "polygon",
      points: toPointsString(
        [
          { x: width * 0.2, y: 0 },
          { x: width, y: 0 },
          { x: width * 0.8, y: height },
          { x: 0, y: height },
        ],
        width,
        height,
      ),
    };
  }

  if (type === "flow-preparation") {
    return {
      kind: "polygon",
      points: toPointsString(
        [
          { x: width * 0.25, y: 0 },
          { x: width * 0.75, y: 0 },
          { x: width, y: height / 2 },
          { x: width * 0.75, y: height },
          { x: width * 0.25, y: height },
          { x: 0, y: height / 2 },
        ],
        width,
        height,
      ),
    };
  }

  if (type === "flow-manual-input") {
    return {
      kind: "polygon",
      points: toPointsString(
        [
          { x: 0, y: height * 0.25 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
        width,
        height,
      ),
    };
  }

  if (type === "thought-bubble") {
    return {
      kind: "path",
      d: "M 30 15 C 5 15 0 45 15 60 C 0 85 25 105 50 95 C 70 120 100 105 105 90 C 135 100 155 80 145 60 C 170 35 145 10 125 20 C 105 -5 70 0 60 15 C 50 10 40 10 30 15 Z",
      viewBox: "4 -1 151 108",
    };
  }

  if (type === "vine") {
    return {
      kind: "path",
      d: "M 0 100 Q 40 80 30 50 Q 20 20 60 15 Q 100 10 95 45 Q 90 75 130 70 Q 165 65 150 30",
      viewBox: "0 12 162 90",
      noFill: true,
    };
  }

  const paths: Record<string, string> = {
    "organic-wave": `M 0 ${height * 0.39} Q ${width * 0.25} 0 ${width * 0.5} ${height * 0.39} T ${width} ${height * 0.39} L ${width} ${height} L 0 ${height} Z`,
    "organic-wave-2": `M 0 ${height * 0.5} C ${width * 0.17} 0 ${width * 0.33} ${height} ${width * 0.5} ${height * 0.5} S ${width * 0.83} 0 ${width} ${height * 0.5} L ${width} ${height} L 0 ${height} Z`,
    leaf: `M 0 ${height} Q ${width * 0.2} 0 ${width} 0 Q ${width * 0.9} ${height * 0.8} 0 ${height} Z`,
    "leaf-rounded": `M 0 ${height} Q ${width * 0.1} 0 ${width} 0 Q ${width} ${height} 0 ${height} Z`,
    "leaf-pointed": `M 0 ${height} Q ${width * 0.2} 0 ${width} 0 Q ${width * 0.7} ${height * 0.8} 0 ${height} Z`,
    "leaf-pair": `M 0 ${height} Q ${width * 0.1} 0 ${width * 0.5} 0 Q ${width * (70 / 150)} ${height * 0.8} 0 ${height} Z M ${width * 0.5} ${height} Q ${width * 0.6} 0 ${width} 0 Q ${width * (145 / 150)} ${height * 0.8} ${width * 0.5} ${height} Z`,
    "flow-document": `M 0 0 L ${width} 0 L ${width} ${height * 0.8} Q ${width * 0.75} ${height} ${width * 0.5} ${height * 0.85} Q ${width * 0.25} ${height * 0.65} 0 ${height * 0.85} Z`,
    "speech-bubble": `M 0 0 L ${width} 0 L ${width} ${height * 0.8} L ${width * 0.3} ${height * 0.8} L ${width * 0.15} ${height} L ${width * 0.18} ${height * 0.8} L 0 ${height * 0.8} Z`,
    "chat-bubble": `M ${width * 0.1} 0 L ${width * 0.9} 0 Q ${width} 0 ${width} ${height * 0.15} L ${width} ${height * 0.7} Q ${width} ${height * 0.85} ${width * 0.85} ${height * 0.85} L ${width * 0.3} ${height * 0.85} L ${width * 0.15} ${height} L ${width * 0.18} ${height * 0.85} L ${width * 0.1} ${height * 0.85} Q 0 ${height * 0.85} 0 ${height * 0.7} L 0 ${height * 0.15} Q 0 0 ${width * 0.1} 0 Z`,
  };

  if (paths[type]) {
    return { kind: "path", d: paths[type] };
  }

  return null;
}
