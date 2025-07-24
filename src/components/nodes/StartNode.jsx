import { useEffect, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const StartNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [text, setText] = useState(data.text || '');

    useEffect(() => {
        if (isMenuOpen) {
            setText(data.text || '');
        }
    }, [isMenuOpen, data.text]);

    const handleSave = () => {
        setNodes(nodes => nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, text } } : node
        ));
        setIsMenuOpen(false);
    };

    const nodeStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--card)',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: `2px solid ${selected ? 'var(--ring)' : 'var(--foreground)'}`,
        position: 'relative',
        color: 'var(--card-foreground)',
        opacity: data.isDimmed ? 0.3 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: data.isDimmed ? 'none' : 'auto',
    };

    const buttonStyle = {
        padding: '4px 8px',
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%'
    };

    return (
        <div style={nodeStyle}>
            <NodeResizer isVisible={selected} minWidth={100} minHeight={50} lineStyle={{borderColor: 'var(--ring)'}} handleStyle={{backgroundColor: 'var(--ring)'}} />
            
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px', color: 'var(--foreground)' }}>
                ⋮
            </button>

            {isMenuOpen && (
                <div style={{
                    position: 'absolute',
                    top: 35,
                    right: 10,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    zIndex: 20,
                    padding: 15,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    width: 200,
                    textAlign: 'left',
                    pointerEvents: 'all'
                }}>
                    <div style={{ fontWeight: 'bold' }}>Edit Start</div>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Start text"
                        style={{ padding: 4, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--foreground)', width: '100%', boxSizing: 'border-box' }}
                    />
                    <button
                        onClick={handleSave}
                        style={buttonStyle}
                    >
                        Save
                    </button>
                </div>
            )}

            <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Start</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{data.text || "Workflow Start"}</div>
            </div>

            <Handle type="source" position={Position.Bottom} style={{ background: 'var(--foreground)' }} />
        </div>
    );
};

export default StartNode;
