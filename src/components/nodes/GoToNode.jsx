import { useEffect, useState, useRef, useContext } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import { HistoryContext } from '../FlowDiagram';

const GoToNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [alarmCode, setAlarmCode] = useState(data.alarmCode || '');
    const nodeRef = useRef(null);
    const { takeSnapshot } = useContext(HistoryContext);

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
        }
    }, [isMenuOpen, data.alarmCode]);

    const handleSave = () => {
        takeSnapshot();
        setNodes(nodes => nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, alarmCode } } : node
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
        backgroundColor: data.hasWarning ? 'rgba(253, 224, 71, 0.2)' : 'var(--card)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: `4px solid ${data.isTested ? 'var(--tested)' : (selected ? 'var(--ring)' : 'var(--foreground)')}`,
        position: 'relative',
        color: 'var(--card-foreground)',
        opacity: data.isDimmed ? 0.3 : 1,
        transition: 'opacity 0.2s, border-color 0.2s, background-color 0.2s',
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
        <div ref={nodeRef} style={nodeStyle} onDoubleClick={() => setIsMenuOpen(true)}>
            {data.hasWarning && (
                <div
                    title={data.warningMessage || "This node has a configuration issue."}
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
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
            <NodeResizer isVisible={selected} keepAspectRatio minWidth={120} minHeight={40} lineStyle={{borderColor: 'var(--ring)', borderWidth: 2}} handleStyle={{backgroundColor: 'var(--ring)', width: 12, height: 12}} onResizeEnd={takeSnapshot} />
            <Handle type="target" position={Position.Top} style={{ background: 'var(--foreground)', width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--card)' }} />
            
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{
                position: 'absolute',
                top: -12,
                right: -12,
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
                    top: 16,
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
                    textAlign: 'left',
                    pointerEvents: 'all'
                }}>
                    <div style={{ fontWeight: 'bold' }}>Edit Go To</div>
                    <div style={{ marginBottom: 5, fontSize: 12, color: 'var(--muted-foreground)' }}>Alarm Code:</div>
                    <input
                        type="text"
                        value={alarmCode}
                        onChange={handleAlarmCodeChange}
                        placeholder="4-digit code"
                        style={{ padding: 4, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--foreground)', width: '100%', boxSizing: 'border-box' }}
                        maxLength={4}
                    />
                    <button
                        onClick={handleSave}
                        style={buttonStyle}
                    >
                        Save
                    </button>
                </div>
            )}

            <div style={{ textAlign: 'center', padding: 8 }}>
                <div style={{ fontWeight: 'bold' }}>GOTO</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{data.alarmCode || "No code"}</div>
            </div>
        </div>
    );
};

export default GoToNode;
