import { useEffect, useRef } from 'react';

const YamlViewer = ({ yamlString, lineMap, selectedNodeIds }) => {
    const lineRefs = useRef({});

    useEffect(() => {
        lineRefs.current = {};
    }, [yamlString]);

    const highlightedLines = new Set();
    let firstHighlightedLine = -1;

    if (yamlString && selectedNodeIds && selectedNodeIds.size > 0 && lineMap) {
        for (const nodeId of selectedNodeIds) {
            const range = lineMap.get(nodeId);
            if (range) {
                for (let i = range.start; i <= range.end; i++) {
                    highlightedLines.add(i);
                    if (firstHighlightedLine === -1) {
                        firstHighlightedLine = i;
                    }
                }
            }
        }
    }

    useEffect(() => {
        if (firstHighlightedLine !== -1 && lineRefs.current[firstHighlightedLine]) {
            lineRefs.current[firstHighlightedLine].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [firstHighlightedLine]);

    if (!yamlString) {
        return <div className="yaml-placeholder">Flow YAML will appear here...</div>;
    }

    const lines = yamlString.split('\n');

    return (
        <pre className="yaml-viewer">
            <code>
                {lines.map((line, index) => {
                    const lineNumber = index + 1;
                    return (
                        <div
                            key={lineNumber}
                            ref={el => (lineRefs.current[lineNumber] = el)}
                            className={`yaml-line ${highlightedLines.has(lineNumber) ? 'highlighted' : ''}`}
                        >
                            <span className="line-number">{lineNumber}</span>
                            <span className="line-content">{line}</span>
                        </div>
                    );
                })}
            </code>
        </pre>
    );
};

function Sidebar({ yaml, lineMap, selectedNodeIds, isVisible, width, onToggle, onWidthChange }) {
    const sidebarRef = useRef(null);
    const isResizing = useRef(false);

    const onMouseDown = () => {
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!isResizing.current) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 200) {
                onWidthChange(newWidth);
            }
        };

        const onMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        if (isVisible) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isVisible, onWidthChange]);

    if (!isVisible) {
        return null;
    }

    return (
        <aside ref={sidebarRef} style={{
            width: `${width}px`,
            background: 'var(--sidebar-bg)',
            backdropFilter: 'blur(8px)',
            padding: '15px',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            transition: 'width 0.2s ease-in-out'
        }}>
            <div
                onMouseDown={onMouseDown}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 5,
                    height: '100%',
                    cursor: 'col-resize',
                    zIndex: 10
                }}
            />
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
                <h3 style={{
                    margin: 0,
                    color: 'var(--muted-foreground)',
                    fontWeight: '600'
                }}>
                    YAML Output
                </h3>
                <button
                    onClick={onToggle}
                    title="Hide Sidebar"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '24px',
                        lineHeight: 1,
                        color: 'var(--muted-foreground)',
                    }}
                >
                    &times;
                </button>
            </header>
            <div className="yaml-container">
                 <YamlViewer yamlString={yaml} lineMap={lineMap} selectedNodeIds={selectedNodeIds} />
            </div>
        </aside>
    );
}

export default Sidebar;
