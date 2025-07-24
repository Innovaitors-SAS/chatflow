import '@reactflow/node-resizer/dist/style.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MarkerType,
    Panel,
    ReactFlowProvider,
    SelectionMode,
    addEdge,
    useEdgesState,
    useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import CustomEdge from './edges/CustomEdge';
import ConditionActionNode from './nodes/ConditionActionNode';
import DecisionNode from './nodes/DecisionNode';
import GoToExitNode from './nodes/GoToExitNode';
import StartNode from './nodes/StartNode';

const nodeTypes = {
    start: StartNode,
    condition: ConditionActionNode,
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
        style: { width: 80, height: 80 },
        deletable: false,
    }
];

function generateYaml(nodes, edges) {
    if (!nodes || nodes.length === 0) return '';

    const nodesMap = new Map(nodes.map(n => [n.id, n]));
    const edgesBySource = edges.reduce((acc, edge) => {
        if (!acc[edge.source]) acc[edge.source] = [];
        acc[edge.source].push(edge);
        return acc;
    }, {});

    const startNode = nodes.find(n => n.type === 'start');
    const alarmCode = startNode?.data?.text?.match(/\b(\d{4})\b/)?.[1] || 'XXXX';

    let yaml = `graph:\n`;
    yaml += `  id: "graph_alarm_${alarmCode}"\n`;
    yaml += `  description: "${alarmCode}"\n\n`;
    yaml += `  nodes:\n`;

    const nodeIdMap = new Map();
    let nodeCounter = 1;
    nodes.forEach(node => {
        if (node.type !== 'start' && node.type !== 'exit') {
            nodeIdMap.set(node.id, `node_${nodeCounter++}`);
        }
    });

    const processedNodeIds = new Set();
    const yamlNodes = nodes.filter(node => node.type !== 'start' && node.type !== 'exit');

    for (const node of yamlNodes) {
        if (processedNodeIds.has(node.id)) {
            continue;
        }

        if (node.type === 'decision') {
            continue;
        }

        yaml += `    - id: "${nodeIdMap.get(node.id)}"\n`;
        const text = (node.data.text || '').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        if (text) {
            yaml += `      text: "${text}"\n`;
        }

        if (node.type === 'condition') {
            if (node.data.action && node.data.action !== 'none') {
                let actionString;
                if (node.data.action === 'Create Ticket') {
                    actionString = 'create_ticket_in_db';
                } else if (node.data.action === 'Send File' && node.data.file?.name) {
                    actionString = `Enviar archivo ${node.data.file.name}`;
                }

                if (actionString) {
                    yaml += `      action: "${actionString}"\n`;
                }
            }
        }

        const outgoingEdges = edgesBySource[node.id] || [];
        if (outgoingEdges.length > 0) {
            const nextNode = nodesMap.get(outgoingEdges[0].target);
            if (nextNode) {
                if (nextNode.type === 'exit') {
                    yaml += `      next: "End"\n`;
                } else if (nextNode.type === 'decision') {
                    yaml += `      decision:\n`;
                    const condition = (node.data.condition || '').replace(/"/g, '\\"');
                    yaml += `        condition: "${condition}"\n`;

                    const decisionEdges = edgesBySource[nextNode.id] || [];
                    for (const edge of decisionEdges) {
                        const targetNode = nodesMap.get(edge.target);
                        if (targetNode) {
                            const targetId = targetNode.type === 'exit' ? 'End' : nodeIdMap.get(edge.target);
                            if (targetId) {
                                const label = (edge.data?.label || 'option').toLowerCase().replace(/ /g, '_');
                                yaml += `        ${label}: "${targetId}"\n`;
                            }
                        }
                    }
                    processedNodeIds.add(nextNode.id);
                } else if (outgoingEdges.length === 1) {
                    const targetId = nodeIdMap.get(outgoingEdges[0].target);
                    if (targetId) {
                        yaml += `      next: "${targetId}"\n`;
                    }
                }
            }
        }

        processedNodeIds.add(node.id);
    }

    return yaml;
}

const getLayoutedElements = (nodes, edges) => {
    if (nodes.length === 0) {
        return { nodes, edges };
    }
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const adj = new Map(nodes.map(n => [n.id, []]));
    const inDegree = new Map(nodes.map(n => [n.id, 0]));

    for (const edge of edges) {
        if (adj.has(edge.source)) {
            adj.get(edge.source).push(edge.target);
        }
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
    
    const queue = nodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);
    const layers = [];
    
    while(queue.length > 0) {
        const layerSize = queue.length;
        const currentLayer = [];
        for(let i = 0; i < layerSize; i++) {
            const u = queue.shift();
            currentLayer.push(u);
            for (const v of (adj.get(u) || [])) {
                inDegree.set(v, inDegree.get(v) - 1);
                if (inDegree.get(v) === 0) {
                    queue.push(v);
                }
            }
        }
        layers.push(currentLayer);
    }

    const xSpacing = 250;
    const ySpacing = 200;
    let layoutedNodes = [];

    layers.forEach((layer, layerIndex) => {
        const layerWidth = (layer.length - 1) * xSpacing;
        const startX = -layerWidth / 2;
        layer.forEach((nodeId, nodeIndex) => {
            const node = nodeMap.get(nodeId);
            if (node) {
                layoutedNodes.push({
                    ...node,
                    position: {
                        x: startX + nodeIndex * xSpacing,
                        y: layerIndex * ySpacing
                    }
                });
            }
        });
    });

    const nodesInLayers = new Set(layoutedNodes.map(n => n.id));
    nodes.forEach(node => {
        if (!nodesInLayers.has(node.id)) {
            layoutedNodes.push({ ...node, position: { x: Math.random() * 400, y: Math.random() * 400 }});
        }
    });
    
    const startNodePos = layoutedNodes.find(n => n.type === 'start')?.position || { x: 0, y: 0 };
    const offsetX = 450 - startNodePos.x;
    const offsetY = 50 - startNodePos.y;

    const finalNodes = layoutedNodes.map(n => ({
        ...n,
        position: {
            x: n.position.x + offsetX,
            y: n.position.y + offsetY
        }
    }));
    
    return { nodes: finalNodes, edges };
}

const generateFlowFromYaml = (yamlData) => {
    if (!yamlData?.graph?.nodes) {
        return { nodes: initialNodes, edges: [] };
    }
    const { graph } = yamlData;
    const yamlNodes = graph.nodes;
    const yamlNodeMap = new Map(yamlNodes.map(n => [n.id, n]));

    let flowNodes = [];
    let flowEdges = [];
    const flowNodeMap = new Map();
    const exitNodeMap = new Map();

    const startNode = {
        id: 'start-node-1',
        type: 'start',
        data: { text: `Alarm ${graph.description}` || 'Workflow Start' },
        style: { width: 80, height: 80 },
        deletable: false,
    };
    flowNodes.push(startNode);

    for (const yamlNode of yamlNodes) {
        const flowNodeId = `${yamlNode.id.replace('node_', 'condition-')}-${uuidv4().substring(0,4)}`;
        const nodeData = { text: yamlNode.text || '', action: 'none', file: null };

        if (yamlNode.action) {
            if (yamlNode.action === 'create_ticket_in_db') nodeData.action = 'Create Ticket';
            else if (yamlNode.action.startsWith('Enviar archivo ')) {
                nodeData.action = 'Send File';
                nodeData.file = { name: yamlNode.action.substring('Enviar archivo '.length), type: '', size: 0 };
            }
        }
        if (yamlNode.decision) nodeData.condition = yamlNode.decision.condition || '';

        const flowNode = { id: flowNodeId, type: 'condition', data: nodeData, style: { width: 160, height: 96 } };
        flowNodes.push(flowNode);
        flowNodeMap.set(yamlNode.id, flowNode);

        if (yamlNode.decision) {
            const decisionOptions = Object.keys(yamlNode.decision).filter(k => k !== 'condition').map(o => o.replace(/_/g, ' '));
            const decisionNodeId = `${yamlNode.id.replace('node_', 'decision-')}-${uuidv4().substring(0,4)}`;
            const decisionNode = { id: decisionNodeId, type: 'decision', data: { options: decisionOptions }, style: { width: 112, height: 112 } };
            flowNodes.push(decisionNode);
            flowNode.decisionNodeId = decisionNodeId;
        }
    }

    const allTargets = new Set();
    yamlNodes.forEach(node => {
        if (node.next && node.next !== 'End') allTargets.add(node.next);
        if (node.decision) Object.entries(node.decision).forEach(([k, v]) => k !== 'condition' && v !== 'End' && allTargets.add(v));
    });
    const entryYamlNode = yamlNodes.find(n => !allTargets.has(n.id)) || yamlNodes[0];

    if (entryYamlNode) {
        const entryFlowNode = flowNodeMap.get(entryYamlNode.id);
        flowEdges.push({ id: `e-${startNode.id}-${entryFlowNode.id}`, source: startNode.id, target: entryFlowNode.id, type: 'custom', data: { label: '' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--foreground)' } });
    }

    for (const yamlNode of yamlNodes) {
        const sourceFlowNode = flowNodeMap.get(yamlNode.id);
        const createEdge = (target, label) => {
            const edge = { id: `e-${label ? `${sourceFlowNode.id}-${label}` : sourceFlowNode.id}-${target.id}`, source: sourceFlowNode.id, target: target.id, type: 'custom', data: { label: label || '' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--foreground)' } };
            return edge;
        }
        
        const getExitNode = (key = 'default') => {
            if (!exitNodeMap.has(key)) {
                const exitNodeId = `exit-${key}-${uuidv4().substring(0,4)}`;
                const exitNode = { id: exitNodeId, type: 'exit', data: { text: 'Workflow End' }, style: { width: 96, height: 96 } };
                flowNodes.push(exitNode);
                exitNodeMap.set(key, exitNode);
            }
            return exitNodeMap.get(key);
        }

        if (yamlNode.next) {
            const target = yamlNode.next === 'End' ? getExitNode() : flowNodeMap.get(yamlNode.next);
            flowEdges.push(createEdge(target));
        } else if (yamlNode.decision) {
            const decisionFlowNode = flowNodes.find(n => n.id === sourceFlowNode.decisionNodeId);
            flowEdges.push({ id: `e-${sourceFlowNode.id}-${decisionFlowNode.id}`, source: sourceFlowNode.id, target: decisionFlowNode.id, type: 'custom', data: { label: '' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--foreground)' }});

            Object.entries(yamlNode.decision).forEach(([key, value]) => {
                if (key === 'condition') return;
                const label = key.replace(/_/g, ' ');
                const target = value === 'End' ? getExitNode(key) : flowNodeMap.get(value);
                flowEdges.push({ id: `e-${decisionFlowNode.id}-${target.id}-${key}`, source: decisionFlowNode.id, target: target.id, type: 'custom', data: { label }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--foreground)' }});
            });
        }
    }
    
    return getLayoutedElements(flowNodes, flowEdges);
};


const FlowDiagram = ({ onYamlChange, initialData }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [flowTitle, setFlowTitle] = useState('Flow Builder');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const selectedNodeIds = useRef(new Set());
    const [menu, setMenu] = useState(null);

    useEffect(() => {
        if (initialData) {
            const { nodes: newNodes, edges: newEdges } = generateFlowFromYaml(initialData);
            setNodes(newNodes);
            setEdges(newEdges);
            if (initialData.graph?.description) {
                setFlowTitle(`Flow for Alarm ${initialData.graph.description}`);
            }
        }
    }, [initialData, setNodes, setEdges]);

    useEffect(() => {
        if (onYamlChange) {
            const yamlString = generateYaml(nodes, edges);
            onYamlChange(yamlString);
        }
    }, [nodes, edges, onYamlChange]);

    useEffect(() => {
        const currentSelectedNodes = nodes.filter(n => n.selected);
        const currentSelectedNodeIds = new Set(currentSelectedNodes.map(n => n.id));

        const oldIds = selectedNodeIds.current;
        if (oldIds.size === currentSelectedNodeIds.size) {
            let areEqual = true;
            for (const id of oldIds) {
                if (!currentSelectedNodeIds.has(id)) {
                    areEqual = false;
                    break;
                }
            }
            if (areEqual) {
                return;
            }
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
        const edgesBySource = edges.reduce((acc, edge) => {
            if (edge.source) {
                if (!acc[edge.source]) {
                    acc[edge.source] = [];
                }
                acc[edge.source].push(edge);
            }
            return acc;
        }, {});

        let nodesChanged = false;
        const newNodes = nodes.map(node => {
            if (node.type === 'decision') {
                const outgoingEdges = edgesBySource[node.id] || [];
                const nodeOptions = new Set(node.data.options || []);
                
                let hasWarning = outgoingEdges.length < nodeOptions.size;

                if (!hasWarning) {
                    for (const edge of outgoingEdges) {
                        if (!nodeOptions.has(edge.data?.label)) {
                            hasWarning = true;
                            break;
                        }
                    }
                }

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
                const usedLabels = new Set(outgoingEdges.map(e => e.data?.label));
                const options = sourceNode.data.options || [];

                const availableOption = options.find(option => !usedLabels.has(option));

                if (availableOption) {
                    setEdges((eds) => addEdge({
                        ...params,
                        type: 'custom',
                        data: { label: availableOption },
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

    const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

    const onPaneContextMenu = useCallback(
        (event) => {
            event.preventDefault();
            setMenu({
                top: event.clientY,
                left: event.clientX,
            });
        },
        [setMenu]
    );

    const onAddNode = useCallback(
        (type) => {
            if (!reactFlowInstance || !menu) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: menu.left,
                y: menu.top,
            });

            let newNode = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: {
                    ...(type === 'decision' && { options: ['Yes', 'No'] })
                },
            };

            if (type === 'condition') {
                newNode.style = { width: 160, height: 96 };
            } else if (type === 'decision') {
                newNode.style = { width: 112, height: 112 };
            } else if (type === 'exit') {
                newNode.style = { width: 96, height: 96 };
            }

            setNodes((nds) => nds.concat(newNode));
            setMenu(null);
        },
        [reactFlowInstance, setNodes, menu]
    );

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <ReactFlowProvider>
                <div style={{ height: '100%', width: '100%' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onPaneClick={onPaneClick}
                        onPaneContextMenu={onPaneContextMenu}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        minZoom={0.1}
                        selectionOnDrag
                        selectionMode={SelectionMode.Partial}
                        panOnDrag={[1]}
                    >
                        <Controls />
                        <Background color="var(--border)" gap={16} />
                        <Panel position="top-right" style={{
                            background: 'var(--secondary)',
                            color: 'var(--foreground)',
                            padding: '10px 15px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                        }}>
                            {isEditingTitle ? (
                                <input
                                    value={flowTitle}
                                    onChange={(e) => setFlowTitle(e.target.value)}
                                    onBlur={() => setIsEditingTitle(false)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') setIsEditingTitle(false);
                                    }}
                                    autoFocus
                                    style={{
                                        fontSize: '1.17em',
                                        fontWeight: 'bold',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--foreground)',
                                        borderBottom: '1px solid var(--foreground)',
                                        outline: 'none',
                                    }}
                                />
                            ) : (
                                <h3
                                    onDoubleClick={() => setIsEditingTitle(true)}
                                    title="Double-click to edit title"
                                    style={{ margin: 0, cursor: 'pointer' }}
                                >
                                    {flowTitle}
                                </h3>
                            )}
                        </Panel>
                    </ReactFlow>
                </div>
            </ReactFlowProvider>
            {menu && (
                <div className="context-menu" style={{ top: menu.top, left: menu.left }}>
                    <div className="context-menu-header">Add Node</div>
                    <ul>
                        <li onClick={() => onAddNode('condition')}>Condition</li>
                        <li onClick={() => onAddNode('decision')}>Decision</li>
                        <li onClick={() => onAddNode('exit')}>Exit</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FlowDiagram;
