import { useEffect, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const ConditionNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [text, setText] = useState(data.text || '');
    const [condition, setCondition] = useState(data.condition || '');

    useEffect(() => {
        if (isMenuOpen) {
            setText(data.text || '');
            setCondition(data.condition || '');
        }
    }, [isMenuOpen, data.text, data.condition]);

    const handleSave = () => {
        setNodes(nodes => nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, text, condition } } : node
        ));
        setIsMenuOpen(false);
    };

    const nodeStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: `1.5px solid ${selected ? 'var(--ring)' : 'var(--foreground)'}`,
        position: 'relative',
        color: 'var(--card-foreground)',
    };

    const inputStyle = {
        width: '100%',
        padding: 8,
        border: '1px solid var(--border)',
        borderRadius: 4,
        background: 'var(--card)',
        color: 'var(--foreground)',
        boxSizing: 'border-box'
    };

    const buttonStyle = {
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: 'none',
        borderRadius: 4,
        padding: '8px 16px',
        cursor: 'pointer',
        marginTop: 10,
        width: '100%'
    };

    return (
        <div style={nodeStyle}>
            <NodeResizer isVisible={selected} minWidth={200} minHeight={150} lineStyle={{borderColor: 'var(--ring)'}} handleStyle={{backgroundColor: 'var(--ring)'}} />
            <Handle type="target" position={Position.Top} style={{ background: 'var(--foreground)' }} />

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ position: 'absolute', top: 5, right: 5, zIndex: 10, cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px', color: 'var(--foreground)' }}>
                ⋮
            </button>

            {isMenuOpen && (
                <div style={{
                    position: 'absolute',
                    top: 30,
                    right: 5,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    zIndex: 20,
                    padding: 15,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    width: 250
                }}>
                    <div style={{ fontWeight: 'bold' }}>Edit Condition</div>

                    <div>
                        <div style={{ marginBottom: 5, fontSize: 12, color: 'var(--muted-foreground)' }}>Description:</div>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter condition description..."
                            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                        />
                    </div>

                    <div>
                        <div style={{ marginBottom: 5, fontSize: 12, color: 'var(--muted-foreground)' }}>Condition:</div>
                        <input
                            type="text"
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            placeholder="Enter condition"
                            style={inputStyle}
                        />
                    </div>

                    <button onClick={handleSave} style={buttonStyle}>
                        Save
                    </button>
                </div>
            )}
            
            <div style={{ padding: 10, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>Condition</div>
                <div style={{ whiteSpace: 'pre-wrap', marginBottom: 10, flexGrow: 1, color: 'var(--muted-foreground)', overflowY: 'auto' }}>
                    {data.text || "No description."}
                </div>
                <div style={{
                    background: 'var(--secondary)',
                    padding: 8,
                    borderRadius: 4,
                    fontSize: 14,
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                    wordBreak: 'break-all'
                }}>
                    <code>{data.condition || "No condition."}</code>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} style={{ background: 'var(--foreground)' }} />
        </div>
    );
};

export default ConditionNode;
