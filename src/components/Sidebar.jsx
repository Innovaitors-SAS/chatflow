function Sidebar() {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div style={{
            width: 250,
            background: '#f0f0f0',
            padding: 15,
            borderLeft: '1px solid #ddd'
        }}>
            <h3>Componentes</h3>
            <div
                onDragStart={(event) => onDragStart(event, 'condition')}
                draggable
                style={{
                    padding: 10,
                    margin: '10px 0',
                    background: 'white',
                    borderRadius: 5,
                    cursor: 'grab',
                    border: '1px solid #ddd'
                }}
            >
                Condition Node
            </div>
            <div
                onDragStart={(event) => onDragStart(event, 'decision')}
                draggable
                style={{
                    padding: 10,
                    margin: '10px 0',
                    background: 'white',
                    borderRadius: 5,
                    cursor: 'grab',
                    border: '1px solid #ddd'
                }}
            >
                Decision Node
            </div>
            <div
                onDragStart={(event) => onDragStart(event, 'exit')}
                draggable
                style={{
                    padding: 10,
                    margin: '10px 0',
                    background: 'white',
                    borderRadius: 5,
                    cursor: 'grab',
                    border: '1px solid #ddd'
                }}
            >
                Exit Node
            </div>
        </div>
    );
}

export default Sidebar;