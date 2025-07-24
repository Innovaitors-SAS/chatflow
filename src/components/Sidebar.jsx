function Sidebar() {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const nodeStyle = {
        padding: '10px 15px',
        margin: '10px 0',
        background: 'var(--background)',
        borderRadius: 'var(--radius)',
        cursor: 'grab',
        border: '1px solid var(--border)',
        color: 'var(--foreground)',
        textAlign: 'center',
        fontWeight: 500,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
    };

    return (
        <div style={{
            width: 250,
            background: 'var(--secondary)',
            padding: 15,
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column'
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
                style={nodeStyle}
            >
                Condition
            </div>
            <div
                onDragStart={(event) => onDragStart(event, 'decision')}
                draggable
                style={nodeStyle}
            >
                Decision
            </div>
            <div
                onDragStart={(event) => onDragStart(event, 'exit')}
                draggable
                style={nodeStyle}
            >
                Exit
            </div>
        </div>
    );
}

export default Sidebar;
