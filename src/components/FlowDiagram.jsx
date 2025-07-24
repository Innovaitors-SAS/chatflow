import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Panel,
    ReactFlowProvider,
    addEdge,
    useEdgesState,
    useNodesState,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@reactflow/node-resizer/dist/style.css';
import Sidebar from './Sidebar';
import CustomEdge from './edges/CustomEdge';
import ConditionNode from './nodes/ConditionNode';
import DecisionNode from './nodes/DecisionNode';
import GoToExitNode from './nodes/GoToExitNode';
import StartNode from './nodes/StartNode';

const nodeTypes = {
    start: StartNode,
    condition: ConditionNode,
    decision: DecisionNode,
    exit: GoToExitNode
};

const edgeTypes = {
    custom: CustomEdge
};

const initialNodes = [
    {
        id: 'start-node-1',
        type: 'start',
        position: { x: 450, y: 50 },
        data: { text: 'Workflow Start' },
        style: { width: 140, height: 70 },
        deletable: false,
    }
];

const FlowDiagram = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const selectedNodeIds = useRef(new Set());

    useEffect(() => {
        const currentSelectedNodes = nodes.filter(n => n.selected);
        const currentSelectedNodeIds = new Set(currentSelectedNodes.map(n => n.id));
    
        const hasSelectionChanged = (
            selectedNodeIds.current.size !== currentSelectedNodeIds.size ||
            

![...selectedNodeIds.current].every(id => currentSelectedNodeIds.has(id)

)
        );

        if (!hasSelectionChanged) {
            return;
        }

        selectedNodeIds.current = currentSelectedNodeIds;

        if (currentSelectedNodes.length === 0) {
            setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isDimmed: false } })));
            setEdges((eds) => eds.map((e) => ({ ...e, data: { ...e.data, isDimmed: false } })));
            return;
        }

        const isStartNodeSelected = currentSelectedNodes.some(n => n.type === 'start');
        if (currentSelectedNodes.length === 1 && isStartNodeSelected) {
            setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isDimmed: false } })));
            setEdges((eds) => eds.map((e) => ({ ...e, data: { ...e.data, isDimmed: false } })));
            return;
        }

        const pathNodeIds = new Set();
        const pathEdgeIds = new Set();
        const queue = [...currentSelectedNodes];
        currentSelectedNodes.forEach(n => pathNodeIds.add(n.id));

        const nodesMap = new Map(nodes.map(n => [n.id, n]));
        
        while (queue.length > 0) {
            const currentNode = queue.shift();
            
            if (currentNode.type === 'start') continue;

            const incomingEdges = edges.filter((e) => e.target === currentNode.id);

            for (const edge of incomingEdges) {
                if (!pathEdgeIds.has(edge.id)) {
                    pathEdgeIds.add(edge.id);
                    const sourceNode = nodesMap.get(edge.source);
                    if (sourceNode && !pathNodeIds.has(sourceNode.id)) {
                        pathNodeIds.add(sourceNode.id);
                        queue.push(sourceNode);
                    }
                }
            }
        }
        
        setNodes((nds) =>
            nds.map((n) => ({
                ...n,
                data: { ...n.data, isDimmed: !pathNodeIds.has(n.id) },
            }))
        );
        setEdges((eds) =>
            eds.map((e) => ({
                ...e,
                data: { ...e.data, isDimmed: !pathEdgeIds.has(e.id) },
            }))
        );
    }, [nodes, edges, setNodes, setEdges]);

    useEffect(() => {
        const edgeCounts = edges.reduce((acc, edge) => {
            if (edge.source) {
                acc[edge.source] = (acc[edge.source] || 0) + 1;
            }
            return acc;
        }, {});
    
        let nodesChanged = false;
        const newNodes = nodes.map(node => {
            if (node.type === 'decision') {
                const outEdgeCount = edgeCounts[node.id] || 0;
                const optionsCount = node.data.options?.length || 0;
                const hasWarning = outEdgeCount < optionsCount;
    
                if ((node.data.hasWarning || false) !== hasWarning) {
                    nodesChanged = true;
                    return { ...node, data: { ...node.data, hasWarning } };
                }
            }
            return node;
        });
    
        if (nodesChanged) {
            setNodes(newNodes);
        }
    }, [edges, nodes, setNodes]);

    const onConnect = useCallback(
        (params) => {
            const sourceNode = nodes.find((node) => node.id === params.source);

            if (sourceNode?.type === 'decision') {
                const outgoingEdges = edges.filter(e => e.source === params.source);
                const optionIndex = outgoingEdges.length;

                if (sourceNode.data.options && optionIndex < sourceNode.data.options.length) {
                    const edgeLabel = sourceNode.data.options[optionIndex];
                    setEdges((eds) => addEdge({
                        ...params,
                        type: 'custom',
                        data: { label: edgeLabel },
                        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--foreground)' }
                    }, eds));
                }
                return;
            }

            setEdges((eds) => addEdge({
                ...params,
                type: 'custom',
                data: { label: '' },
                markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--foreground)' }
            }, eds));
        },
        [nodes, edges, setEdges]
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
                    ...(type === 'decision' && { options: ['Yes', 'No'] })
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
                        <MiniMap nodeColor="#f4f4f5" nodeStrokeWidth={3} />
                        <Background color="var(--border)" gap={16} />
                        <Panel position="top-right" style={{
                            background: 'var(--secondary)',
                            color: 'var(--foreground)',
                            padding: '5px 15px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                        }}>
                            <h3>Flow Builder</h3>
                        </Panel>
                    </ReactFlow>
                </div>
                <Sidebar />
            </ReactFlowProvider>
        </div>
    );
};

export default FlowDiagram;
