import { useState } from 'react';
import { useReactFlow } from 'reactflow';

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data.label || '');
    const { setEdges } = useReactFlow();

    const edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

    const handleSave = () => {
        setEdges(edges => edges.map(edge =>
            edge.id === id ? { ...edge, data: { ...edge.data, label } } : edge
        ));
        setIsEditing(false);
    };

    return (
        <>
            <path
                id={id}
                d={edgePath}
                style={{
                    stroke: selected ? '#ff5722' : '#bdbdbd',
                    strokeWidth: 2,
                    fill: 'none'
                }}
            />
            <foreignObject
                width="100"
                height="40"
                x={(sourceX + targetX) / 2 - 50}
                y={(sourceY + targetY) / 2 - 20}
                requiredExtensions="http://www.w3.org/1999/xhtml"
            >
                <div style={{
                    position: 'relative',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {isEditing ? (
                        <div style={{
                            display: 'flex',
                            background: 'white',
                            borderRadius: 4,
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                autoFocus
                                style={{
                                    border: 'none',
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    minWidth: 80
                                }}
                            />
                            <button
                                onClick={handleSave}
                                style={{
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0 8px'
                                }}
                            >
                                ✓
                            </button>
                        </div>
                    ) : (
                        <div
                            onDoubleClick={() => setIsEditing(true)}
                            style={{
                                background: selected ? '#2196f3' : 'white',
                                color: selected ? 'white' : 'black',
                                padding: '4px 8px',
                                borderRadius: 4,
                                border: '1px solid #ddd',
                                fontSize: 12,
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                        >
                            {label || "Doble clic para editar"}
                        </div>
                    )}
                </div>
            </foreignObject>
        </>
    );
};

export default CustomEdge;