import { useEffect, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Stroke } from '@/data/types';
import { colors, radius } from '@/theme';

/** Zeichnungen werden in einem festen 1000×1000-Raster gespeichert – so sehen sie überall gleich aus. */
export const GRID = 1000;

function pathOf(points: [number, number][]) {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  // Ein einzelner Tipp wird ein kurzer Strich, sonst wäre er unsichtbar.
  if (rest.length === 0) return `M${first[0]} ${first[1]} L${first[0] + 0.5} ${first[1] + 0.5}`;
  return `M${first[0]} ${first[1]} ` + rest.map(([x, y]) => `L${x} ${y}`).join(' ');
}

/** Zeigt gespeicherte Striche in beliebiger Größe (quadratisch). */
export function DrawingView({ strokes, style }: { strokes: Stroke[]; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.paper, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${GRID} ${GRID}`}>
        {strokes.map((s, i) => (
          <Path
            key={i}
            d={pathOf(s.p)}
            stroke={s.c}
            strokeWidth={s.w}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}

/** Zeichenfläche: mit dem Finger malen, Farbe und Stärke kommen von außen. */
export function DrawingCanvas({
  strokes,
  onChange,
  color,
  width,
  onDrawing,
}: {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
  color: string;
  width: number;
  /** Meldet, solange ein Finger malt – damit die umgebende ScrollView dann stillhält. */
  onDrawing?: (active: boolean) => void;
}) {
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [size, setSize] = useState(1);
  // Werte für die Gesten-Handler, die nur einmal erstellt werden (kein Re-Render nötig).
  const [box] = useState(() => ({
    size: 1,
    color,
    width,
    strokes,
    onChange,
    onDrawing,
    current: null as Stroke | null,
  }));

  useEffect(() => {
    Object.assign(box, { color, width, strokes, onChange, onDrawing, size });
  }, [box, color, width, strokes, onChange, onDrawing, size]);

  const [responder] = useState(() => {
    const toGrid = (x: number, y: number): [number, number] => {
      const size = box.size;
      const clamp = (v: number) => Math.max(0, Math.min(GRID, Math.round((v / size) * GRID)));
      return [clamp(x), clamp(y)];
    };
    const update = (stroke: Stroke | null) => {
      box.current = stroke;
      setCurrent(stroke);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        box.onDrawing?.(true);
        const { locationX, locationY } = e.nativeEvent;
        update({ c: box.color, w: box.width, p: [toGrid(locationX, locationY)] });
      },
      onPanResponderMove: (e) => {
        const stroke = box.current;
        if (!stroke) return;
        const point = toGrid(e.nativeEvent.locationX, e.nativeEvent.locationY);
        const last = stroke.p[stroke.p.length - 1];
        // Nur Punkte mit etwas Abstand speichern – hält die Zeichnung klein.
        if (Math.hypot(point[0] - last[0], point[1] - last[1]) < 4) return;
        update({ ...stroke, p: [...stroke.p, point] });
      },
      onPanResponderRelease: () => {
        const stroke = box.current;
        if (stroke) box.onChange([...box.strokes, stroke]);
        update(null);
        box.onDrawing?.(false);
      },
      onPanResponderTerminate: () => {
        update(null);
        box.onDrawing?.(false);
      },
    });
  });

  const onLayout = (e: LayoutChangeEvent) => {
    setSize(e.nativeEvent.layout.width || 1);
  };

  return (
    <View onLayout={onLayout} {...responder.panHandlers} style={styles.canvas}>
      {/* Keine Touches an die Striche – so bezieht sich locationX/Y immer auf die ganze Fläche. */}
      <DrawingView strokes={current ? [...strokes, current] : strokes} style={styles.fill} />
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { backgroundColor: '#FFFFFF', borderRadius: radius.md, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
  canvas: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
