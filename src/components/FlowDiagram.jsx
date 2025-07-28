import '@reactflow/node-resizer/dist/style.css';
import * as dagre from 'dagre';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
        data: { text: 'Workflow Start', alarmCode: '0000', alarmType: 'warning' },
        style: { width: 80, height: 80 },
        deletable: false,
    }
];

function generateYaml(nodes, edges) {
    if (!nodes || nodes.length === 0) return { yamlString: '', lineMap: new Map() };

    const yamlLines = [];
    const push = (str) => yamlLines.push(str);
    const lineMap = new Map();

    const startNode = nodes.find(n => n.type === 'start');
    const alarmCode = startNode?.data?.alarmCode || 'XXXX';
    const alarmType = startNode?.data?.alarmType || 'warning';

    const fileNames = new Set();
    nodes.forEach(node => {
        if (node.data?.action === 'Send File' && node.data?.file?.name) {
            fileNames.add(node.data.file.name);
        }
    });

    const nodesMap = new Map(nodes.map(n => [n.id, n]));
    const edgesBySource = edges.reduce((acc, edge) => {
        if (!acc[edge.source]) acc[edge.source] = [];
        acc[edge.source].push(edge);
        return acc;
    }, {});

    const startNodeEdges = edgesBySource[startNode?.id] || [];
    const firstNodeAfterStartId = startNodeEdges.length > 0 ? startNodeEdges[0].target : null;
    const idMapping = new Map();
    if (firstNodeAfterStartId) {
        idMapping.set(firstNodeAfterStartId, `${alarmCode}_start`);
    }
    const getYamlNodeId = (nodeId) => idMapping.get(nodeId) || nodeId;
    
    const graphStartLine = yamlLines.length + 1;
    push(`graph:`);
    push(`  id: "graph_alarm_${alarmCode}"`);
    push(`  description: "Proceso alarma ${alarmCode}."`);
    push(``);
    if (startNode) lineMap.set(startNode.id, { start: graphStartLine, end: yamlLines.length });

    push(`  nodes:`);

    const yamlNodes = nodes
        .filter(node => node.type !== 'start' && node.type !== 'exit')
        .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

    const processedNodeIds = new Set();

    for (const node of yamlNodes) {
        if (processedNodeIds.has(node.id) || node.type === 'decision') {
            continue;
        }

        const startLine = yamlLines.length + 1;
        let decisionNodeIdForThisBlock = null;

        push(`    - id: "${getYamlNodeId(node.id)}"`);
        const text = (node.data.text || '').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        if (text) {
            push(`      text: "${text}"`);
        }

        if (node.type === 'condition') {
            if (node.data.action && node.data.action !== 'none') {
                if (node.data.action === 'Create Ticket') {
                    push(`      action: "create_ticket_in_db"`);
                } else if (node.data.action === 'Send File' && node.data.file?.name) {
                    push(`      action: Enviar archivo ${node.data.file.name}`);
                }
            }
        }

        const outgoingEdges = edgesBySource[node.id] || [];
        if (outgoingEdges.length > 0) {
            const nextNode = nodesMap.get(outgoingEdges[0].target);
            if (nextNode) {
                if (nextNode.type === 'exit') {
                    push(`      next: "End"`);
                } else if (nextNode.type === 'decision') {
                    decisionNodeIdForThisBlock = nextNode.id;
                    push(`      decision:`);
                    const condition = (node.data.condition || '').replace(/"/g, '\\"');
                    push(`        condition: "${condition}"`);

                    const decisionEdges = edgesBySource[nextNode.id] || [];
                    for (const edge of decisionEdges) {
                        const targetNode = nodesMap.get(edge.target);
                        if (targetNode) {
                            const targetId = targetNode.type === 'exit' ? 'End' : getYamlNodeId(edge.target);
                            if (targetId) {
                                const originalLabel = (edge.data?.label || 'option');
                                // check if original label is a number before any transformation
                                const isNumeric = /^-?\d+(\.\d+)?$/.test(originalLabel);
                                
                                if (isNumeric) {
                                    push(`        "${originalLabel}": "${targetId}"`);
                                } else {
                                    const label = originalLabel.replace(/ /g, '_');
                                    push(`        ${label}: "${targetId}"`);
                                }
                            }
                        }
                    }
                    processedNodeIds.add(nextNode.id);
                } else if (outgoingEdges.length === 1) {
                    const targetId = outgoingEdges[0].target;
                    if (targetId) {
                        push(`      next: "${getYamlNodeId(targetId)}"`);
                    }
                }
            }
        }
        
        const endLine = yamlLines.length;
        lineMap.set(node.id, { start: startLine, end: endLine });
        if(decisionNodeIdForThisBlock) {
            lineMap.set(decisionNodeIdForThisBlock, { start: startLine, end: endLine });
        }

        processedNodeIds.add(node.id);
    }
    
    const endNodeStartLine = yamlLines.length + 1;
    push(`    - id: "End"`);
    push(`      text: "Fin del proceso"`);
    const endNodeEndLine = yamlLines.length;
    
    const exitNodes = nodes.filter(n => n.type === 'exit');
    for (const exitNode of exitNodes) {
        lineMap.set(exitNode.id, { start: endNodeStartLine, end: endNodeEndLine });
    }

    push(``);
    push(`# ---`);
    push(`# Metadata for Alarms file (for reference):`);
    push(`#`);
    push(`#    "${alarmCode}":`);
    push(`#        name: Alarma ${alarmCode}`);
    push(`#        file_name: alarma${alarmCode}.yml`);
    push(`#        alarm_type: ${alarmType}`);
    if (fileNames.size > 0) {
        push(`#        extra_metadata:`);
        const sortedFileNames = Array.from(fileNames).sort();
        sortedFileNames.forEach(fileName => push(`#            - ${fileName}`));
    }

    return { yamlString: yamlLines.join('\n'), lineMap };
}

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 100 });

    nodes.forEach((node) => {
        const nodeWidth = node.width || (node.style && node.style.width) || 160;
        const nodeHeight = node.height || (node.style && node.style.height) || 96;
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    let layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        if (nodeWithPosition) {
            const nodeWidth = node.width || (node.style && node.style.width) || 160;
            const nodeHeight = node.height || (node.style && node.style.height) || 96;
            
            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - nodeWidth / 2,
                    y: nodeWithPosition.y - nodeHeight / 2,
                }
            };
        }
        return node;
    });

    const startNode = layoutedNodes.find(n => n.type === 'start');
    if (startNode) {
        const startNodePos = startNode.position || { x: 0, y: 0 };
        const offsetX = 450 - startNodePos.x;
        const offsetY = 50 - startNodePos.y;

        layoutedNodes = layoutedNodes.map(n => ({
            ...n,
            position: {
                x: n.position.x + offsetX,
                y: n.position.y + offsetY
            }
        }));
    }
    
    return { nodes: layoutedNodes, edges };
};

const generateNodesWithLayoutExits = (yamlData, files, layoutNodes) => {
    const { graph, Alarms } = yamlData || {};
    if (!graph?.nodes) {
        return { nodes: initialNodes };
    }

    const seenNodeIds = new Set();
    const yamlNodes = graph.nodes.filter(node => {
        if (!node?.id || seenNodeIds.has(node.id) || node.id === 'End') {
            return false;
        }
        seenNodeIds.add(node.id);
        return true;
    });

    let flowNodes = [];

    let alarmCode, alarmType;
    if (Alarms) {
        const alarmKey = Object.keys(Alarms)[0];
        if (alarmKey) {
            alarmCode = alarmKey;
            alarmType = Alarms[alarmKey]?.alarm_type;
        }
    }
    if (!alarmCode) alarmCode = graph.description;
    if (!alarmType) alarmType = graph.alarm_type || 'warning';

    const startNode = {
        id: 'start-node-1',
        type: 'start',
        data: { 
            text: `Alarm ${alarmCode}` || 'Workflow Start',
            alarmCode,
            alarmType
        },
        style: { width: 80, height: 80 },
        deletable: false,
    };
    flowNodes.push(startNode);

    for (const yamlNode of yamlNodes) {
        const flowNodeId = yamlNode.id;
        const nodeData = { text: yamlNode.text || '', action: 'none', file: null };

        if (yamlNode.action) {
            if (yamlNode.action === 'create_ticket_in_db') {
                nodeData.action = 'Create Ticket';
            } else if (yamlNode.action.startsWith('Enviar archivo ')) {
                nodeData.action = 'Send File';
                const fileName = yamlNode.action.substring('Enviar archivo '.length);
                if (files && files.has(fileName)) {
                    nodeData.file = files.get(fileName);
                } else {
                    nodeData.file = { name: fileName };
                }
            }
        }
        if (yamlNode.decision) nodeData.condition = yamlNode.decision.condition || '';

        const flowNode = { id: flowNodeId, type: 'condition', data: nodeData, style: { width: 160, height: 96 } };
        flowNodes.push(flowNode);

        if (yamlNode.decision) {
            const decisionOptions = Object.keys(yamlNode.decision).filter(k => k !== 'condition' && k !== 'id').map(o => o.replace(/_/g, ' '));
            const decisionNodeId = yamlNode.decision.id || `decision-${flowNodeId}`;
            const decisionNode = { id: decisionNodeId, type: 'decision', data: { options: decisionOptions }, style: { width: 112, height: 112 } };
            flowNodes.push(decisionNode);
        }
    }

    if (layoutNodes) {
        const exitNodesFromLayout = layoutNodes.filter(n => n.id.startsWith('exit-'));
        for (const layoutExitNode of exitNodesFromLayout) {
            if (!flowNodes.find(n => n.id === layoutExitNode.id)) {
                const exitNode = {
                    id: layoutExitNode.id,
                    type: 'exit',
                    data: { text: 'Workflow End' },
                    style: { width: layoutExitNode.width || 96, height: layoutExitNode.height || 96 }
                };
                flowNodes.push(exitNode);
            }
        }
    }

    return { nodes: flowNodes };
};

const generateFlowFromYaml = (yamlData, files) => {
    const { graph, Alarms } = yamlData || {};
    if (!graph?.nodes) {
        return { nodes: initialNodes, edges: [] };
    }

    const seenNodeIds = new Set();
    const yamlNodes = graph.nodes.filter(node => {
        if (!node?.id || seenNodeIds.has(node.id) || node.id === 'End') {
            return false;
        }
        seenNodeIds.add(node.id);
        return true;
    });

    const yamlNodeMap = new Map(yamlNodes.map(n => [n.id, n]));

    let flowNodes = [];
    let flowEdges = [];
    const flowNodeMap = new Map();
    const exitNodeMap = new Map();

    let alarmCode, alarmType;
    if (Alarms) {
        const alarmKey = Object.keys(Alarms)[0];
        if (alarmKey) {
            alarmCode = alarmKey;
            alarmType = Alarms[alarmKey]?.alarm_type;
        }
    }
    if (!alarmCode) alarmCode = graph.description;
    if (!alarmType) alarmType = graph.alarm_type || 'warning';

    const startNode = {
        id: 'start-node-1',
        type: 'start',
        data: { 
            text: `Alarm ${alarmCode}` || 'Workflow Start',
            alarmCode,
            alarmType
        },
        style: { width: 80, height: 80 },
        deletable: false,
    };
    flowNodes.push(startNode);

    for (const yamlNode of yamlNodes) {
        const flowNodeId = yamlNode.id;
        const nodeData = { text: yamlNode.text || '', action: 'none', file: null };

        if (yamlNode.action) {
            if (yamlNode.action === 'create_ticket_in_db') {
                nodeData.action = 'Create Ticket';
            } else if (yamlNode.action.startsWith('Enviar archivo ')) {
                nodeData.action = 'Send File';
                const fileName = yamlNode.action.substring('Enviar archivo '.length);
                if (files && files.has(fileName)) {
                    nodeData.file = files.get(fileName);
                } else {
                    nodeData.file = { name: fileName };
                }
            }
        }
        if (yamlNode.decision) nodeData.condition = yamlNode.decision.condition || '';

        const flowNode = { id: flowNodeId, type: 'condition', data: nodeData, style: { width: 160, height: 96 } };
        flowNodes.push(flowNode);
        flowNodeMap.set(yamlNode.id, flowNode);

        if (yamlNode.decision) {
            const decisionOptions = Object.keys(yamlNode.decision).filter(k => k !== 'condition' && k !== 'id').map(o => o.replace(/_/g, ' '));
            const decisionNodeId = yamlNode.decision.id || `decision-${flowNodeId}`;
            const decisionNode = { id: decisionNodeId, type: 'decision', data: { options: decisionOptions }, style: { width: 112, height: 112 } };
            flowNodes.push(decisionNode);
            flowNode.decisionNodeId = decisionNodeId;
        }
    }

    const allTargets = new Set();
    yamlNodes.forEach(node => {
        if (node.next && node.next !== 'End') allTargets.add(node.next);
        if (node.decision) Object.entries(node.decision).forEach(([k, v]) => k !== 'condition' && k !== 'id' && v !== 'End' && allTargets.add(v));
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
                const exitNodeId = `exit-${key}`;
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
                if (key === 'condition' || key === 'id') return;
                const label = key.replace(/_/g, ' ');
                const target = value === 'End' ? getExitNode(key) : flowNodeMap.get(value);
                flowEdges.push({ id: `e-${decisionFlowNode.id}-${target.id}-${key}`, source: decisionFlowNode.id, target: target.id, type: 'custom', data: { label }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--foreground)' }});
            });
        }
    }
    
    return { nodes: flowNodes, edges: flowEdges };
};

const applyLayout = (nodes, layoutNodes) => {
    if (!layoutNodes) return nodes;
    const layoutMap = new Map(layoutNodes.map(n => [n.id, n]));
    return nodes.map(node => {
        const layoutNode = layoutMap.get(node.id);
        if (layoutNode) {
            return {
                ...node,
                position: layoutNode.position,
                width: layoutNode.width,
                height: layoutNode.height,
                style: { ...node.style, width: layoutNode.width, height: layoutNode.height },
            };
        }
        return { ...node, position: { x: 0, y: 0 } };
    });
};


const FlowDiagram = forwardRef(({ onYamlChange, initialData, testedPath, flowTitle, onFlowTitleChange, onFlowChange }, ref) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const selectedNodeIds = useRef(new Set());
    const [menu, setMenu] = useState(null);

    useImperativeHandle(ref, () => ({
        getFlowData() {
            const { yamlString, lineMap } = generateYaml(nodes, edges);
            return {
                nodes,
                edges,
                viewport: reactFlowInstance?.getViewport(),
                yaml: yamlString,
                lineMap,
            };
        }
    }));

    const onLayout = useCallback(() => {
        const layouted = getLayoutedElements(nodes, edges);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
    }, [nodes, edges, setNodes, setEdges]);

    useEffect(() => {
        if (testedPath) {
            setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isTested: testedPath.nodes.has(n.id) } })));
            setEdges((eds) => eds.map((e) => ({ ...e, data: { ...e.data, isTested: testedPath.edges.has(e.id) } })));
        }
    }, [testedPath, setNodes, setEdges]);

    useEffect(() => {
        if (initialData?.fromLocalStorage) {
            setNodes(initialData.nodes);
            setEdges(initialData.edges);
            if (reactFlowInstance && initialData.viewport) {
                reactFlowInstance.setViewport(initialData.viewport);
            }
            if (initialData.flowTitle) {
                onFlowTitleChange(initialData.flowTitle);
            } else {
                const startNode = initialData.nodes.find(n => n.type === 'start');
                if (startNode?.data?.alarmCode) {
                    onFlowTitleChange(`Flow for Alarm ${startNode.data.alarmCode}`);
                }
            }
            return;
        }

        if (initialData?.yaml) {
            let newNodes, newEdges;

            if (initialData.layout?.edges) {
                const result = generateNodesWithLayoutExits(initialData.yaml, initialData.files, initialData.layout.nodes);
                newNodes = result.nodes;
                newEdges = initialData.layout.edges;
            } else {
                const result = generateFlowFromYaml(initialData.yaml, initialData.files);
                newNodes = result.nodes;
                newEdges = result.edges;
            }

            let finalNodes;
            if (initialData.layout) {
                finalNodes = applyLayout(newNodes, initialData.layout.nodes);
            } else {
                const layouted = getLayoutedElements(newNodes, newEdges);
                finalNodes = layouted.nodes;
            }

            setNodes(finalNodes);
            setEdges(newEdges);

            if (reactFlowInstance && initialData.layout?.viewport) {
                reactFlowInstance.setViewport(initialData.layout.viewport);
            }
            
            const startNode = finalNodes.find(n => n.type === 'start');
            if (startNode?.data?.alarmCode) {
                onFlowTitleChange(`Flow for Alarm ${startNode.data.alarmCode}`);
            }
        }
    }, [initialData, setNodes, setEdges, reactFlowInstance, onFlowTitleChange]);

    useEffect(() => {
        if (onYamlChange) {
            const { yamlString, lineMap } = generateYaml(nodes, edges);
            const currentSelectedNodeIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
            onYamlChange(yamlString, lineMap, currentSelectedNodeIds);
        }
        if (onFlowChange) {
            onFlowChange();
        }
    }, [nodes, edges, onYamlChange, onFlowChange]);

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
                            padding: '10px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            {isEditingTitle ? (
                                <input
                                    value={flowTitle}
                                    onChange={(e) => onFlowTitleChange(e.target.value)}
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
                                        padding: '0 5px'
                                    }}
                                />
                            ) : (
                                <h3
                                    onDoubleClick={() => setIsEditingTitle(true)}
                                    title="Double-click to edit title"
                                    style={{ margin: 0, cursor: 'pointer', padding: '0 5px' }}
                                >
                                    {flowTitle}
                                </h3>
                            )}
                            <button
                                onClick={onLayout}
                                title="Auto-layout"
                                style={{
                                    background: 'var(--secondary)',
                                    color: 'var(--foreground)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px'
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </button>
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
});

export default FlowDiagram;
