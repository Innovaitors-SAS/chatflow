import { useEffect, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const DecisionNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [options, setOptions] = useState(data.options || ['Yes', 'No']);

    useEffect(() => {
        if (isMenuOpen) {
            setOptions(data.options || ['Yes', 'No']);
        }
    }, [isMenuOpen, data.options]);

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
        setIsMenuOpen(false);
    };

    return (
        <div
            onDoubleClick={() => setIsMenuOpen(true)}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--card)',
                transform: 'rotate(45deg)',
                border: `4px solid ${selected ? 'var(--ring)' : 'var(--foreground)'}`,
                color: 'var(--card-foreground)',
                opacity: data.isDimmed ? 0.3 : 1,
                transition: 'opacity 0.2s',
                pointerEvents: data.isDimmed ? 'none' : 'auto',
                position: 'relative'
            }}
        >
            {data.hasWarning && (
                <div
                    title="Not all options are connected"
                    style={{
                        position: 'absolute',
                        top: '15%',
                        left: '15%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        zIndex: 10,
                        width: 24,
                        height: 24,
                        cursor: 'help'
                    }}
                >
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: 'black',
                        color: 'yellow',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 'bold',
                        boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                    }}>
                        !
                    </div>
                </div>
            )}
            <NodeResizer isVisible={selected} keepAspectRatio minWidth={80} minHeight={80} lineStyle={{borderColor: 'var(--ring)', borderWidth: 2}} handleStyle={{backgroundColor: 'var(--ring)', width: 12, height: 12}} />
            <Handle type="target" position={Position.Top} style={{ background: 'var(--foreground)', width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--card)' }}/>

            <div style={{ transform: 'rotate(-45deg)', position: 'absolute', top: 5, right: 5, zIndex: 10 }}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px', color: 'var(--foreground)' }}>
                    ⋮
                </button>
            </div>

            {isMenuOpen && (
                <div style={{
                    position: 'absolute',
                    top: 30,
                    right: 5,
                    transform: 'rotate(-45deg)',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    zIndex: 20,
                    padding: 15,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    width: 200,
                    pointerEvents: 'all'
                }}>
                    <div style={{ fontWeight: 'bold' }}>Edit Options</div>
                    {(options || []).map((option, index) => (
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
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', padding: 4, borderRadius: '4px', marginTop: 8 }}
                    >
                        Save
                    </button>
                </div>
            )}

            <div style={{ transform: 'rotate(-45deg)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
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
                        {(data.options || []).map((option, index) => (
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
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="source"
                style={{ background: 'var(--foreground)', width: 15, height: 15, borderRadius: 4, border: '2px solid var(--card)' }}
            />
        </div>
    );
};

export default DecisionNode;
