import { useCallback, useRef, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Panel,
    ReactFlowProvider,
    addEdge,
    useEdgesState,
    useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@reactflow/node-resizer/dist/style.css';
import Sidebar from './Sidebar';
import CustomEdge from './edges/CustomEdge';
import ConditionNode from './nodes/ConditionNode';
import DecisionNode from './nodes/DecisionNode';
import GoToExitNode from './nodes/GoToExitNode';

const nodeTypes = {
    condition: ConditionNode,
    decision: DecisionNode,
    exit: GoToExitNode
};

const edgeTypes = {
    custom: CustomEdge
};

const FlowDiagram = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, type: 'custom', data: { label: '' } }, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            if (!reactFlowInstance) return;

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            let newNode = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: {
                    label: `${type} node`,
                    ...(type === 'decision' && { options: ['Sí', 'No'] })
                },
            };

            if (type === 'condition') {
                newNode.style = { width: 200, height: 120 };
            } else if (type === 'decision') {
                newNode.style = { width: 140, height: 140 };
            } else if (type === 'exit') {
                newNode.style = { width: 120, height: 120 };
            }

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
            <ReactFlowProvider>
                <div style={{ flexGrow: 1, height: '100%' }} ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                    >
                        <Controls />
                        <MiniMap />
                        <Background color="#aaa" gap={16} />
                        <Panel position="top-right">
                            <h3>Diagrama de Flujo</h3>
                        </Panel>
                    </ReactFlow>
                </div>
                <Sidebar />
            </ReactFlowProvider>
        </div>
    );
};

export default FlowDiagram;
