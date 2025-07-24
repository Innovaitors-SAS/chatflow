import { useEffect, useRef, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const DecisionNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [options, setOptions] = useState(data.options || ['Yes', 'No']);
    const nodeRef = useRef(null);

    const handleAddOption = () => setOptions([...options, `Option ${options.length + 1}`]);
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
                backgroundColor: 'var(--card)',
                transform: 'rotate(45deg)',
                border: `1.5px solid ${selected ? 'var(--ring)' : 'var(--foreground)'}`,
                color: 'var(--card-foreground)',
            }}
        >
            <NodeResizer isVisible={selected} keepAspectRatio minWidth={100} minHeight={100} lineStyle={{borderColor: 'var(--ring)'}} handleStyle={{backgroundColor: 'var(--ring)'}} />
            <Handle type="target" position={Position.Top} style={{ background: 'var(--foreground)' }}/>

            <div style={{ transform: 'rotate(-45deg)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isEditing ? (
                    <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, width: '80%' }}>
                        {options.map((option, index) => (
                            <div key={index} style={{ display: 'flex', gap: 4 }}>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    style={{ flex: 1, padding: 4, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '4px' }}
                                />
                                <button
                                    onClick={() => handleRemoveOption(index)}
                                    style={{ background: 'var(--destructive)', color: 'var(--destructive-foreground)', border: 'none', cursor: 'pointer', borderRadius: '4px', width: '24px' }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={handleAddOption}
                            style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', cursor: 'pointer', padding: 4, borderRadius: '4px' }}
                        >
                            + Add Option
                        </button>
                        <button
                            onClick={handleSave}
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '4px' }}
                        >
                            Save
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
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>Decision</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {options.map((option, index) => (
                                <div key={index} style={{
                                    background: 'var(--secondary)',
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
                    style={{
                        left: `${(index + 1) * (100 / (options.length + 1))}%`,
                        background: 'var(--foreground)',
                        width: 8,
                        height: 8
                    }}
                />
            ))}
        </div>
    );
};

export default DecisionNode;
