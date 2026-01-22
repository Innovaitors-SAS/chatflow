import React from 'react';

// Simplified node representations for the tutorial.
// These are designed to look like the real nodes without needing the React Flow context.

const StaticStartNode = ({ data }) => (
    <div style={{
        width: '100%', height: '100%', backgroundColor: 'var(--card)', borderRadius: '50%', display: 'flex',
        justifyContent: 'center', alignItems: 'center', border: `4px solid var(--foreground)`, position: 'relative', color: 'var(--card-foreground)'
    }}>
        <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Start</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{data.text || "Workflow Start"}</div>
        </div>
    </div>
);

const StaticConditionNode = ({ data }) => (
     <div style={{
        width: '100%', height: '100%', backgroundColor: 'var(--card)', borderRadius: 'var(--radius)',
        border: `4px solid var(--foreground)`, position: 'relative', color: 'var(--card-foreground)'
    }}>
        <div style={{ padding: 10, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>Condition</div>
            <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', marginBottom: 10, flexGrow: 1, color: 'var(--muted-foreground)', overflowY: 'auto', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {data.text || ""}
            </div>
            <div style={{
                background: 'var(--secondary)', padding: 8, borderRadius: 4, fontSize: '15px',
                border: '1px solid var(--border)', textAlign: 'center', overflowWrap: 'break-word', whiteSpace: 'pre-wrap'
            }}>
                <code>{data.condition || "No condition."}</code>
            </div>
        </div>
    </div>
);

const StaticDecisionNode = ({ data }) => (
    <div style={{
        width: '100%', height: '100%', backgroundColor: 'var(--card)', transform: 'rotate(45deg)',
        border: `4px solid var(--foreground)`, color: 'var(--card-foreground)', position: 'relative'
    }}>
        <div style={{ transform: 'rotate(-45deg)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 'bold' }}>Decision</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(data.options || []).map((option, index) => (
                        <div key={index} style={{
                            background: 'var(--secondary)', padding: '2px 4px', borderRadius: 4, fontSize: 12
                        }}>
                            {option}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const StaticExitNode = ({ data }) => (
    <div style={{
        width: '100%', height: '100%', backgroundColor: 'var(--card)', borderRadius: '50%', display: 'flex',
        justifyContent: 'center', alignItems: 'center', border: `4px solid var(--foreground)`, position: 'relative', color: 'var(--card-foreground)'
    }}>
         <div style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontWeight: 'bold' }}>Exit</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{data.text || "No text"}</div>
        </div>
    </div>
);

const StaticGoToNode = ({ data }) => (
     <div style={{
        width: '100%', height: '100%', backgroundColor: 'var(--card)', borderRadius: 'var(--radius)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', border: `4px solid var(--foreground)`,
        position: 'relative', color: 'var(--card-foreground)'
    }}>
         <div style={{ textAlign: 'center', padding: 8 }}>
            <div style={{ fontWeight: 'bold' }}>GOTO</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{data.alarmCode || "No code"}</div>
        </div>
    </div>
);

const NodeWrapper = ({ children, style }) => (
    <div style={{
        position: 'relative',
        width: style?.width || 160,
        height: style?.height || 120,
        margin: '20px auto',
        pointerEvents: 'none',
        ...style
    }}>
        {children}
    </div>
);

const HelpTutorial = ({ onClose }) => {
    return (
        <div className="help-tutorial-overlay" onClick={onClose}>
            <div className="help-tutorial-content" onClick={e => e.stopPropagation()}>
                <header className="help-tutorial-header">
                    <h2>Ayuda y Tutorial</h2>
                    <button onClick={onClose}>&times;</button>
                </header>
                <div className="help-tutorial-body">
                    <section>
                        <h3>Tipos de Nodos</h3>
                        
                        <div className="node-explanation">
                            <h4>Nodo de Inicio (Start)</h4>
                            <p>Este nodo marca el inicio de un flujo para una alarma específica. Contiene el código de la alarma y su tipo (ej. advertencia, crítico).</p>
                             <NodeWrapper style={{ width: 80, height: 80 }}>
                                <StaticStartNode data={{ text: 'Alarma 1019' }} />
                            </NodeWrapper>
                        </div>
                        
                        <div className="node-explanation">
                            <h4>Nodo de Condición (Condition)</h4>
                            <p>
                                Este nodo contiene 3 partes: la descripción, la condición y la acción. La descripción tiene todo el texto necesario para explicar algo al usuario y dar información extra. La condición es una pregunta cuyas respuestas son las definidas en el nodo de decisión que va después de cada nodo de condición. Estos siempre preceden a un nodo de decisión, un nodo de salida (exit) o un nodo de salto (goto). Hay dos tipos de acciones: enviar archivos (imágenes o PDF) o crear un ticket en la base de datos, ideal para nodos con mensajes finales.
                            </p>
                            <NodeWrapper style={{ width: 250, height: 180 }}>
                                <StaticConditionNode data={{ text: 'Revise el cableado del motor.', condition: '¿Observa usted alguna condición anormal?' }} />
                            </NodeWrapper>
                        </div>

                        <div className="node-explanation">
                            <h4>Nodo de Decisión (Decision)</h4>
                            <p>
                                Son los nodos que contienen las respuestas a la condición planteada en un nodo de condición. Estas respuestas pueden ser "Sí/No" por defecto, numéricas o de cualquier otro tipo. Deben ser cortas y diferentes entre ellas.
                            </p>
                            <NodeWrapper style={{ width: 112, height: 112 }}>
                                <StaticDecisionNode data={{ options: ['Sí', 'No'] }} />
                            </NodeWrapper>
                        </div>
                        
                        <div className="node-explanation">
                            <h4>Nodo de Salida (Exit)</h4>
                            <p>
                                Un nodo que determina el fin de un camino o interacción con el grafo. Va justo después de un nodo con el mensaje de despedida.
                            </p>
                            <NodeWrapper style={{ width: 96, height: 96 }}>
                                <StaticExitNode data={{ text: '¡Adiós!' }} />
                            </NodeWrapper>
                        </div>

                        <div className="node-explanation">
                            <h4>Nodo de Salto (Go To)</h4>
                            <p>
                                Nodo usado para determinar a qué alarma se debe saltar, es decir, qué alarma se debe abrir en el chatbot.
                            </p>
                             <NodeWrapper style={{ width: 120, height: 40 }}>
                                <StaticGoToNode data={{ alarmCode: '1060' }} />
                            </NodeWrapper>
                        </div>
                    </section>

                    <section>
                        <h3>Botones de Descarga</h3>
                         <div className="button-explanation">
                             <h4><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Exportar ZIP</h4>
                             <p>Este botón exporta un archivo <code>.zip</code> que contiene solo los activos finales necesarios para la producción: el archivo <code>alarmaXXXX.yml</code> y una carpeta <code>extra_metadata</code> con los archivos adjuntos. Esta es la versión que usarías para implementar el flujo del chatbot.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default HelpTutorial;
