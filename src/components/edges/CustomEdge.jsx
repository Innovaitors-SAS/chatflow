import { useEffect, useState } from 'react';
import { getSmoothStepPath, useReactFlow } from 'reactflow';

const CustomEdge = ({ id, source, target, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, data, selected, markerEnd }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data.label || '');
    const { setEdges, getNode } = useReactFlow();

    const sourceNode = getNode(source);
    const isDecisionEdge = sourceNode?.type === 'decision';

    useEffect(() => {
        setLabel(data.label || '');
    }, [data.label]);

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 5,
    });

    const handleSave = () => {
        setEdges(edges => edges.map(edge =>
            edge.id === id ? { ...edge, data: { ...edge.data, label } } : edge
        ));
        setIsEditing(false);
    };

    const handleKeyDown = (evt) => {
        if (evt.key === 'Enter') {
            handleSave();
        }
    };

    const isHighlighted = data.isHighlighted && !data.isDimmed;
    const pathStyle = {
        stroke: data.isTested ? 'var(--tested)' : (selected || isHighlighted ? 'var(--ring)' : 'var(--foreground)'),
        strokeWidth: selected ? 5 : (isHighlighted ? 4 : 3),
        fill: 'none',
        strokeDasharray: '7 7',
        opacity: data.isDimmed ? 0.3 : 1,
        transition: 'opacity 0.2s, stroke 0.2s'
    };

    return (
        <>
            <path
                id={id}
                d={edgePath}
                className="animated-edge"
                style={pathStyle}
                markerEnd={markerEnd}
            />
            <foreignObject
                width="120"
                height="40"
                x={labelX - 60}
                y={labelY - 20}
                requiredExtensions="http://www.w3.org/1999/xhtml"
                style={{ pointerEvents: 'none', opacity: data.isDimmed ? 0.3 : 1, transition: 'opacity 0.2s' }}
            >
                <div
                    onDoubleClick={() => !isDecisionEdge && setIsEditing(true)}
                    style={{
                        pointerEvents: data.isDimmed ? 'none' : 'all',
                        position: 'relative',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'var(--foreground)'
                    }}>
                    {isEditing && !isDecisionEdge ? (
                        <div style={{
                            display: 'flex',
                            background: 'var(--background)',
                            borderRadius: 'var(--radius)',
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                style={{
                                    border: 'none',
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    minWidth: 80,
                                    background: 'var(--card)',
                                    color: 'var(--foreground)'
                                }}
                                spellCheck="true"
                                lang="es"
                            />
                            <button
                                onClick={handleSave}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'var(--primary-foreground)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0 8px'
                                }}
                            >
                                ✓
                            </button>
                        </div>
                    ) : (
                        label ? (
                            <div
                                style={{
                                    background: data.isTested ? 'var(--tested)' : (isHighlighted ? 'var(--ring)' : 'var(--secondary)'),
                                    color: data.isTested ? 'var(--primary-foreground)' : (isHighlighted ? 'var(--primary-foreground)' : 'var(--foreground)'),
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    border: isHighlighted ? '1px solid var(--ring)' : '1px solid var(--border)',
                                    fontSize: 12,
                                    fontWeight: isHighlighted ? 'bold' : 'normal',
                                    cursor: isDecisionEdge ? 'default' : 'pointer',
                                    textAlign: 'center',
                                    transition: 'background-color 0.2s, color 0.2s'
                                }}
                            >
                                {label}
                            </div>
                        ) : (selected && !isDecisionEdge && <div style={{
                                background: 'var(--secondary)',
                                padding: '2px 4px',
                                borderRadius: 4,
                                border: '1px dashed var(--border)',
                                fontSize: 10,
                                cursor: 'pointer',
                                color: 'var(--muted-foreground)'
                            }}>
                            + label
                        </div>)
                    )}
                </div>
            </foreignObject>
        </>
    );
};

export default CustomEdge;
