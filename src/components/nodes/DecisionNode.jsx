import { useEffect, useRef, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const DecisionNode = ({ id, data, selected }) => {
    const { setNodes, getEdges } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [options, setOptions] = useState(data.options || ['Sí', 'No']);
    const nodeRef = useRef(null);

    const handleAddOption = () => setOptions([...options, `Opción ${options.length + 1}`]);
    const handleRemoveOption = (index) => setOptions(options.filter((_, i) => i !== index));
    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSave = () => {
        setNodes(nodes => nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, options } } : node
        ));
        setIsEditing(false);
    };

    // Actualizar handles cuando cambian las opciones
    useEffect(() => {
        setNodes(nodes => nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, options } } : node
        ));
    }, [options, id, setNodes]);

    return (
        <div
            ref={nodeRef}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#ffecb3',
                transform: 'rotate(45deg)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: selected ? '2px solid #2196f3' : '2px solid transparent',
                position: 'relative'
            }}
        >
            <NodeResizer isVisible={selected} keepAspectRatio minWidth={100} minHeight={100} />
            <Handle type="target" position={Position.Top} />

            <div style={{ transform: 'rotate(-45deg)', width: '100%', height: '100%' }}>
                {isEditing ? (
                    <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {options.map((option, index) => (
                            <div key={index} style={{ display: 'flex', gap: 4 }}>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    style={{ flex: 1, padding: 4 }}
                                />
                                <button
                                    onClick={() => handleRemoveOption(index)}
                                    style={{
                                        background: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={handleAddOption}
                            style={{
                                background: '#4caf50',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4
                            }}
                        >
                            + Añadir opción
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                background: '#2196f3',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4
                            }}
                        >
                            Guardar
                        </button>
                    </div>
                ) : (
                    <div
                        onDoubleClick={() => setIsEditing(true)}
                        style={{
                            textAlign: 'center',
                            padding: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            height: '100%',
                            justifyContent: 'center'
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>Decisión</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {options.map((option, index) => (
                                <div key={index} style={{
                                    background: 'rgba(255,255,255,0.3)',
                                    padding: '2px 4px',
                                    borderRadius: 4,
                                    fontSize: 12
                                }}>
                                    {option}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {options.map((option, index) => (
                <Handle
                    key={index}
                    type="source"
                    position={Position.Bottom}
                    id={`option-${index}`}
                    data={{ label: option }}
                    style={{
                        left: `${(index + 1) * (100 / (options.length + 1))}%`,
                        background: '#ff9800',
                        width: 8,
                        height: 8
                    }}
                />
            ))}
        </div>
    );
};

export default DecisionNode;
