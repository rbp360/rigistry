'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateDefaultRig, loadRigNodes, replaceRigNodes } from '@/lib/db';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';

interface GearNode {
  id: string;
  kind: 'guitar' | 'amp' | 'pedal';
  x: number;
  y: number;
}

const palette: Array<Pick<GearNode, 'kind'>> = [
  { kind: 'guitar' },
  { kind: 'amp' },
  { kind: 'pedal' },
];

function NodeView({ node, onDrag }: { node: GearNode; onDrag: (id: string, x: number, y: number) => void }) {
  const color = node.kind === 'guitar' ? '#eab308' : node.kind === 'amp' ? '#06b6d4' : '#a78bfa';
  return (
    <Group
      x={node.x}
      y={node.y}
      draggable
      onDragEnd={(e) => onDrag(node.id, e.target.x(), e.target.y())}
    >
      <Rect width={120} height={60} fill={color} cornerRadius={8} shadowBlur={4} />
      <Text text={node.kind.toUpperCase()} fill="#111827" x={8} y={20} fontStyle="bold" />
    </Group>
  );
}

export default function RigBuilderPage() {
  const [nodes, setNodes] = useState<GearNode[]>([]);
  const { user } = useAuth();

  const onDrag = (id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const addNode = (kind: GearNode['kind']) => {
    setNodes((prev) => [
      ...prev,
      {
        id: `${kind}-${Date.now()}`,
        kind,
        x: 240 + Math.random() * 400,
        y: 80 + Math.random() * 280,
      },
    ]);
  };

  const stageSize = useMemo(() => ({ width: 900, height: 500 }), []);

  const save = async () => {
    if (!user) {
      alert('Please sign in to save your rig.');
      return;
    }
    const rig = await getOrCreateDefaultRig(user.uid);
    if (!rig?.id) return;
    await replaceRigNodes(
      rig.id,
      nodes.map((n) => ({
        id: n.id,
        rigId: rig.id!,
        kind: n.kind,
        x: n.x,
        y: n.y,
      }))
    );
    alert('Saved!');
  };

  const load = async () => {
    if (!user) {
      alert('Please sign in to load your rig.');
      return;
    }
    const rig = await getOrCreateDefaultRig(user.uid);
    if (!rig?.id) return;
    const docs = await loadRigNodes(rig.id);
    setNodes(
      docs.map((d) => ({ id: d.id!, kind: d.kind as GearNode['kind'], x: d.x, y: d.y }))
    );
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Rig Builder (prototype)</h1>
      <p>Drag items onto the board. This is a client-only prototype using Konva.js.</p>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 200 }}>
          <h3>Palette</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {palette.map((p) => (
              <button key={p.kind} onClick={() => addNode(p.kind)}>
                Add {p.kind}
              </button>
            ))}
            <hr />
            <button onClick={save} disabled={!user}>
              Save rig {user ? '' : '(sign in)'}
            </button>
            <button onClick={load} disabled={!user}>
              Load rig {user ? '' : '(sign in)'}
            </button>
          </div>
        </div>
        <div style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 8 }}>
          <Stage width={stageSize.width} height={stageSize.height}>
            <Layer>
              {/* Board background */}
              <Rect width={stageSize.width} height={stageSize.height} fill="#0b1220" />
              {nodes.map((n) => (
                <NodeView key={n.id} node={n} onDrag={onDrag} />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </main>
  );
}
