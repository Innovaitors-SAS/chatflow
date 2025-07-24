import { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const ConditionNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.text || '');
    const [condition, setCondition] = useState(data.condition || '');

    const handleSave = () => {
        setNodes(nodes => nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, text, condition } } : node
        ));
        setIsEditing(false);
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#e3f2fd',
            borderRadius: 8,
            border: selected ? '2px solid #2196f3' : '1px solid #90caf9',
            position: 'relative'
        }}>
            <NodeResizer isVisible={selected} minWidth={200} minHeight={150} />
            <Handle type="target" position={Position.Top} />

            {isEditing ? (
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 'bold' }}>Condition</div>

                    <div>
                        <div style={{ marginBottom: 5 }}>Description:</div>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter condition description..."
                            style={{
                                width: '100%',
                                minHeight: 80,
                                padding: 8,
                                border: '1px solid #ddd',
                                borderRadius: 4,
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div>
                        <div style={{ marginBottom: 5 }}>Condition:</div>
                        <input
                            type="text"
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            placeholder="Enter condition"
                            style={{
                                width: '100%',
                                padding: 8,
                                border: '1px solid #ddd',
                                borderRadius: 4
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        style={{
                            background: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            marginTop: 10
                        }}
                    >
                        Save
                    </button>
                </div>
            ) : (
                <div
                    onDoubleClick={() => setIsEditing(true)}
                    style={{ padding: 10 }}
                >
                    <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Condition</div>
                    <div style={{ whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                        {text || "Double click to edit"}
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.5)',
                        padding: 8,
                        borderRadius: 4,
                        fontSize: 14
                    }}>
                        {condition || "No condition specified"}
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default ConditionNode;
