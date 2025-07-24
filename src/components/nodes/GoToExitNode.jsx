import { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const GoToExitNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.text || '');

    const handleEdit = () => setIsEditing(true);

    const handleSave = () => {
        setNodes(nodes => nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, text } } : node
        ));
        setIsEditing(false);
    };

    const nodeStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--card)',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: `1.5px solid ${selected ? 'var(--ring)' : 'var(--foreground)'}`,
        position: 'relative',
        color: 'var(--card-foreground)'
    };

    const buttonStyle = {
        padding: '4px 8px',
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    };

    return (
        <div style={nodeStyle}>
            <NodeResizer isVisible={selected} keepAspectRatio minWidth={80} minHeight={80} lineStyle={{borderColor: 'var(--ring)'}} handleStyle={{backgroundColor: 'var(--ring)'}} />
            <Handle type="target" position={Position.Top} style={{ background: 'var(--foreground)' }} />

            {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, alignItems: 'center' }}>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Exit text"
                        style={{ padding: 4, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--foreground)', textAlign: 'center', width: '80%' }}
                    />
                    <button
                        onClick={handleSave}
                        style={buttonStyle}
                    >
                        Save
                    </button>
                </div>
            ) : (
                <div onDoubleClick={handleEdit} style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontWeight: 'bold' }}>Exit</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{text || "Double click to edit"}</div>
                </div>
            )}
        </div>
    );
};

export default GoToExitNode;
