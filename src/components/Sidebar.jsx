import { useEffect, useRef } from 'react';

function Sidebar({ yaml, isVisible, width, onToggle, onWidthChange }) {
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
            if (newWidth >= 200 && newWidth <= 800) {
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
            background: 'var(--secondary)',
            padding: '15px',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0
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
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
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
        </aside>
    );
}

export default Sidebar;
