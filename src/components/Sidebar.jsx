function Sidebar({ yaml }) {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const nodeBaseStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '15px auto',
        cursor: 'grab',
        color: 'var(--foreground)',
        fontWeight: 500,
        border: '3px solid var(--border)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
        background: 'rgba(244, 244, 245, 0.7)', // --secondary with transparency
    };

    const conditionStyle = {
        ...nodeBaseStyle,
        width: 96,
        height: 48,
        borderRadius: 'var(--radius)',
    };

    const decisionStyle = {
        ...nodeBaseStyle,
        width: 72,
        height: 72,
        transform: 'rotate(45deg)',
    };

    const decisionTextStyle = {
        transform: 'rotate(-45deg)',
    };

    const exitStyle = {
        ...nodeBaseStyle,
        width: 64,
        height: 64,
        borderRadius: '50%',
    };

    return (
        <div style={{
            width: 300,
            background: 'var(--secondary)',
            padding: 15,
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <h3 style={{
                textAlign: 'center',
                margin: '10px 0 20px',
                color: 'var(--muted-foreground)',
                fontWeight: '600'
            }}>
                Nodes
            </h3>
            <div
                onDragStart={(event) => onDragStart(event, 'condition')}
                draggable
                style={conditionStyle}
            >
                Condition
            </div>
            <div
                onDragStart={(event) => onDragStart(event, 'decision')}
                draggable
                style={decisionStyle}
            >
                <div style={decisionTextStyle}>Decision</div>
            </div>
            <div
                onDragStart={(event) => onDragStart(event, 'exit')}
                draggable
                style={exitStyle}
            >
                Exit
            </div>
            <h3 style={{
                textAlign: 'center',
                margin: '30px 0 10px',
                color: 'var(--muted-foreground)',
                fontWeight: '600'
            }}>
                YAML Output
            </h3>
            <textarea
                readOnly
                value={yaml || ''}
                placeholder="Flow YAML will appear here..."
                style={{
                    flexGrow: 1,
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    padding: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    resize: 'none',
                    minHeight: 150
                }}
            />
        </div>
    );
}

export default Sidebar;
