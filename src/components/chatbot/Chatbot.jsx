import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './ChatMessage';

const Chatbot = ({ onClose, flowData, onPathUpdate }) => {
    const { nodes, edges } = flowData;
    const [messages, setMessages] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const messagesEndRef = useRef(null);

    const nodesMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
    const edgesBySource = useMemo(() => {
        return edges.reduce((acc, edge) => {
            if (!acc[edge.source]) acc[edge.source] = [];
            acc[edge.source].push(edge);
            return acc;
        }, {});
    }, [edges]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        startChat();
    }, []);

    useEffect(() => {
        if (currentNodeId) {
            const timeoutId = setTimeout(() => {
                processNode(currentNodeId);
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [currentNodeId]);

    const addMessage = (sender, text, options = []) => {
        setMessages(prev => [...prev, { id: uuidv4(), sender, text, options }]);
    };

    const findNextNodeId = (sourceNodeId) => {
        const outgoingEdges = edgesBySource[sourceNodeId] || [];
        if (outgoingEdges.length > 0) {
            return outgoingEdges[0].target;
        }
        return null;
    };

    const startChat = () => {
        setMessages([]);
        setIsFinished(false);
        const startNode = nodes.find(n => n.type === 'start');
        if (startNode) {
            addMessage('bot', 'Hello! Starting the workflow simulation.');
            onPathUpdate({ nodes: new Set([startNode.id]), edges: new Set() });

            const nextNodeId = findNextNodeId(startNode.id);
            if (nextNodeId) {
                const edge = (edgesBySource[startNode.id] || [])[0];
                if (edge) {
                    onPathUpdate(p => ({
                        nodes: new Set([...p.nodes, nextNodeId]),
                        edges: new Set([...p.edges, edge.id])
                    }));
                } else {
                    onPathUpdate(p => ({ ...p, nodes: new Set([...p.nodes, nextNodeId]) }));
                }
                setCurrentNodeId(nextNodeId);
            } else {
                addMessage('bot', 'No starting point found after start node. Conversation ended.');
                setIsFinished(true);
            }
        } else {
            addMessage('bot', 'Could not find a start node. Cannot begin conversation.');
            setIsFinished(true);
        }
    };

    const processNode = (nodeId) => {
        const node = nodesMap.get(nodeId);
        if (!node) {
            addMessage('bot', 'Error: an unexpected error occurred. Ending conversation.');
            setIsFinished(true);
            return;
        }

        switch (node.type) {
            case 'condition': {
                let messageText = '';
                if (node.data.text) messageText += `${node.data.text}\n\n`;
                if (node.data.condition) messageText += `*Condition:*\n\`${node.data.condition}\`\n\n`;
                if (node.data.action && node.data.action !== 'none') {
                    messageText += `*Action:*\n${node.data.action}`;
                    if (node.data.action === 'Send File' && node.data.file) {
                        messageText += ` (${node.data.file.name})`;
                    }
                }
                addMessage('bot', messageText.trim());

                const nextNodeId = findNextNodeId(node.id);
                if (nextNodeId) {
                    const edge = (edgesBySource[node.id] || [])[0];
                    if (edge) {
                        onPathUpdate(p => ({
                            nodes: new Set([...p.nodes, nextNodeId]),
                            edges: new Set([...p.edges, edge.id])
                        }));
                    } else {
                        onPathUpdate(p => ({ ...p, nodes: new Set([...p.nodes, nextNodeId]) }));
                    }
                    setCurrentNodeId(nextNodeId);
                } else {
                    addMessage('bot', 'The flow ends here.');
                    setIsFinished(true);
                }
                break;
            }
            case 'decision': {
                const options = node.data.options || [];
                if (options.length > 0) {
                    addMessage('bot', 'Please choose an option:', options);
                } else {
                    addMessage('bot', 'No options available from this point. The flow ends here.');
                    setIsFinished(true);
                }
                break;
            }
            case 'exit': {
                addMessage('bot', node.data.text || 'The workflow has concluded. Goodbye!');
                setIsFinished(true);
                break;
            }
            default: {
                addMessage('bot', 'Encountered an unknown step. Ending conversation.');
                setIsFinished(true);
            }
        }
    };

    const handleOptionSelect = (option) => {
        addMessage('user', option);

        const decisionNode = nodesMap.get(currentNodeId);
        if (decisionNode?.type !== 'decision') {
            addMessage('bot', 'An error occurred. Trying to select an option when not at a decision point.');
            setIsFinished(true);
            return;
        }
        
        const outgoingEdges = edgesBySource[decisionNode.id] || [];
        const selectedEdge = outgoingEdges.find(e => e.data?.label === option);

        if (selectedEdge) {
            onPathUpdate(p => ({
                nodes: new Set([...p.nodes, selectedEdge.target]),
                edges: new Set([...p.edges, selectedEdge.id])
            }));
            setCurrentNodeId(selectedEdge.target);
        } else {
            addMessage('bot', `I'm sorry, I can't find a path for "${option}". The flow ends here.`);
            setIsFinished(true);
        }
    };

    return (
        <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
            <div className="chatbot-header">
                <h3>Chatbot Test</h3>
                <button onClick={onClose} title="Close Chat">&times;</button>
            </div>
            <div className="chatbot-messages">
                {messages.map(msg => (
                    <ChatMessage key={msg.id} message={msg} onOptionSelect={handleOptionSelect} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            {isFinished && (
                <div className="chatbot-footer">
                    <button className="restart" onClick={startChat}>Restart</button>
                    <button className="close" onClick={onClose}>Close</button>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
