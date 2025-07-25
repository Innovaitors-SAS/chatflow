import { useCallback, useEffect, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const ConditionActionNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [text, setText] = useState(data.text || '');
    const [condition, setCondition] = useState(data.condition || '');
    const [action, setAction] = useState('none');
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (isMenuOpen) {
            setText(data.text || '');
            setCondition(data.condition || '');
            setAction(data.action || 'none');
            setFile(data.file || null);
        }
    }, [isMenuOpen, data.text, data.condition, data.action, data.file]);

    const handleSave = () => {
        setNodes(nodes => nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, text, condition, action, file: file ? { name: file.name, type: file.type, size: file.size } : null } } : node
        ));
        setIsMenuOpen(false);
    };

    const onFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    
    const handleFileDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const renderActionIcon = () => {
        let icon = null;
        let title = '';

        if (data.action === 'Create Ticket') {
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
            );
            title = 'Action: Create Ticket';
        } else if (data.action === 'Send File') {
            icon = (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
            );
            title = 'Action: Send File';
        }

        if (!icon) return null;

        return (
            <div
                title={title}
                style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 10,
                    width: 24,
                    height: 24,
                    background: 'var(--secondary)',
                    color: 'var(--foreground)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
            >
                {icon}
            </div>
        );
    };

    const nodeStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: `4px solid ${selected ? 'var(--ring)' : 'var(--foreground)'}`,
        position: 'relative',
        color: 'var(--card-foreground)',
        opacity: data.isDimmed ? 0.3 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: data.isDimmed ? 'none' : 'auto',
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

    const fileDropStyle = {
        border: '2px dashed var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        marginTop: '10px',
        color: 'var(--muted-foreground)'
    };

    return (
        <div style={nodeStyle} onDoubleClick={() => setIsMenuOpen(true)}>
            {renderActionIcon()}
            <NodeResizer isVisible={selected} minWidth={160} minHeight={120} keepAspectRatio lineStyle={{borderColor: 'var(--ring)', borderWidth: 2}} handleStyle={{backgroundColor: 'var(--ring)', width: 12, height: 12}} />
            <Handle type="target" position={Position.Top} style={{ background: 'var(--foreground)', width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--card)' }} />

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
                    width: 250,
                    pointerEvents: 'all',
                    maxHeight: 'calc(100vh - 50px)',
                    overflowY: 'auto'
                }}>
                    <div style={{ fontWeight: 'bold' }}>Edit Condition/Action</div>

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

                    <div>
                        <div style={{ marginBottom: 5, fontSize: 12, color: 'var(--muted-foreground)' }}>Action:</div>
                        <select value={action} onChange={(e) => setAction(e.target.value)} style={inputStyle}>
                            <option value="none">None</option>
                            <option value="Create Ticket">Create Ticket</option>
                            <option value="Send File">Send File</option>
                        </select>
                    </div>

                    {action === 'Send File' && (
                        <div>
                             <div style={{ marginBottom: 5, fontSize: 12, color: 'var(--muted-foreground)' }}>Upload File:</div>
                            <div style={fileDropStyle} onDrop={handleFileDrop} onDragOver={handleDragOver} onClick={() => document.getElementById(`file-input-${id}`).click()}>
                                {file ? `Selected: ${file.name}` : 'Drop file here, or click to select'}
                            </div>
                             <input id={`file-input-${id}`} type="file" onChange={onFileChange} style={{ display: 'none' }} />
                        </div>
                    )}

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
                    overflowWrap: 'break-word'
                }}>
                    <code>{data.condition || "No condition."}</code>
                </div>
                {data.action && data.action !== 'none' && (
                    <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)' }}>
                        Action: <strong>{data.action}</strong>
                        {data.action === 'Send File' && data.file && (
                            <div style={{fontSize: 10, overflowWrap: 'break-word'}}>File: {data.file.name}</div>
                        )}
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} style={{ background: 'var(--foreground)', width: 15, height: 15, borderRadius: 4, border: '2px solid var(--card)' }} />
        </div>
    );
};

export default ConditionActionNode;
