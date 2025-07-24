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

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#ffcdd2',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: selected ? '2px solid #2196f3' : '2px solid transparent',
            position: 'relative'
        }}>
            <NodeResizer isVisible={selected} keepAspectRatio minWidth={80} minHeight={80} />
            <Handle type="target" position={Position.Top} />

            {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Texto de salida"
                        style={{ padding: 4 }}
                    />
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Guardar
                    </button>
                </div>
            ) : (
                <div onDoubleClick={handleEdit} style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontWeight: 'bold' }}>Exit</div>
                    <div>{text || "Doble clic para editar"}</div>
                </div>
            )}
        </div>
    );
};

export default GoToExitNode;
