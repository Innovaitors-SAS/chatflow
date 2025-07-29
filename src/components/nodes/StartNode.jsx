import { useEffect, useState, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const StartNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [alarmCode, setAlarmCode] = useState(data.alarmCode || '');
    const [alarmType, setAlarmType] = useState(data.alarmType || 'warning');
    const nodeRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (nodeRef.current && !nodeRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    useEffect(() => {
        if (isMenuOpen) {
            setAlarmCode(data.alarmCode || '');
            setAlarmType(data.alarmType || 'warning');
        }
    }, [isMenuOpen, data.alarmCode, data.alarmType]);

    const handleSave = () => {
        const newText = `Alarm ${alarmCode}`;
        setNodes(nodes => nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, text: newText, alarmCode, alarmType } } : node
        ));
        setIsMenuOpen(false);
    };

    const handleAlarmCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 4) {
            setAlarmCode(value);
        }
    };

    const nodeStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--card)',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: `4px solid ${data.isTested ? 'var(--tested)' : (selected ? 'var(--ring)' : 'var(--foreground)')}`,
        position: 'relative',
        color: 'var(--card-foreground)',
        opacity: data.isDimmed ? 0.3 : 1,
        transition: 'opacity 0.2s, border-color 0.2s',
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

    const inputStyle = {
        padding: 4,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        color: 'var(--foreground)',
        width: '100%',
        boxSizing: 'border-box'
    };

    return (
        <div ref={nodeRef} style={nodeStyle} onDoubleClick={() => setIsMenuOpen(true)}>
            <NodeResizer isVisible={selected} minWidth={80} minHeight={80} keepAspectRatio lineStyle={{borderColor: 'var(--ring)', borderWidth: 2}} handleStyle={{backgroundColor: 'var(--ring)', width: 12, height: 12}} />
            
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 10,
                cursor: 'pointer',
                background: 'var(--card)',
                border: '2px solid var(--border)',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                lineHeight: 1,
                color: 'var(--foreground)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            }}>
                ⋮
            </button>

            {isMenuOpen && (
                <div className="nodrag" style={{
                    position: 'absolute',
                    top: 28,
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
                    <div>
                        <div style={{ marginBottom: 5, fontSize: 12, color: 'var(--muted-foreground)' }}>Alarm Code:</div>
                        <input
                            type="text"
                            value={alarmCode}
                            onChange={handleAlarmCodeChange}
                            placeholder="4-digit code"
                            style={inputStyle}
                            maxLength={4}
                        />
                    </div>
                    <div>
                        <div style={{ marginBottom: 5, fontSize: 12, color: 'var(--muted-foreground)' }}>Alarm Type:</div>
                        <select value={alarmType} onChange={(e) => setAlarmType(e.target.value)} style={inputStyle}>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
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

            <Handle type="source" position={Position.Bottom} style={{ background: 'var(--foreground)', width: 15, height: 15, borderRadius: 4, border: '2px solid var(--card)' }} />
        </div>
    );
};

export default StartNode;
