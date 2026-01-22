import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import yaml from 'js-yaml';
import JSZip from 'jszip';
import './App.css';
import FlowDiagram from './components/FlowDiagram';
import Sidebar from './components/Sidebar';
import Chatbot from './components/chatbot/Chatbot';
import HelpTutorial from './components/HelpTutorial';

// Helper functions for persistence
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return new Blob();
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return new Blob();
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

const serializeNodesForStorage = async (nodes) => {
    const serializedNodes = [];
    for (const node of nodes) {
        let newNodeData = { ...node.data };
        if (node.data?.action === 'Send File' && node.data?.file instanceof File) {
            const file = node.data.file;
            const fileContent = await readFileAsDataURL(file);
            newNodeData.file = {
                name: file.name,
                type: file.type,
                content: fileContent,
            };
        }
        serializedNodes.push({ ...node, data: newNodeData });
    }
    return serializedNodes;
};

const deserializeNodesFromStorage = (serializedNodes) => {
    if (!serializedNodes) return [];
    return serializedNodes.map(node => {
        let newNodeData = { ...node.data };
        if (node.data?.action === 'Send File' && node.data?.file?.content) {
            const fileData = node.data.file;
            try {
                const blob = dataURLtoBlob(fileData.content);
                newNodeData.file = new File([blob], fileData.name, { type: fileData.type });
            } catch (e) {
                console.error("Error deserializing file", fileData.name, e);
                newNodeData.file = { name: fileData.name };
            }
        }
        return { ...node, data: newNodeData };
    });
};


function App() {
  const [yamlString, setYamlString] = useState('');
  const [lineMap, setLineMap] = useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [initialData, setInitialData] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [testedPath, setTestedPath] = useState({ nodes: new Set(), edges: new Set() });
  const [sessionPath, setSessionPath] = useState({ nodes: new Set(), edges: new Set() });
  const flowDiagramRef = useRef(null);
  const [flowTitle, setFlowTitle] = useState('Flow Builder');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const saveData = useCallback(() => {
      if (!flowDiagramRef.current) return;

      const { nodes, edges, viewport } = flowDiagramRef.current.getFlowData();

      if (nodes.length <= 1 && edges.length === 0) {
          localStorage.removeItem('chatflow-data');
          return;
      }

      const performSave = async () => {
          try {
              const serializedNodes = await serializeNodesForStorage(nodes);
              const flowData = {
                  nodes: serializedNodes,
                  edges,
                  viewport,
              };
              const dataToStore = {
                  flowData,
                  sidebar: {
                      isVisible: isSidebarVisible,
                      width: sidebarWidth,
                  },
              };
              localStorage.setItem('chatflow-data', JSON.stringify(dataToStore));
          } catch (e) {
              console.error("Failed to save flow to local storage", e);
          }
      };

      performSave();
  }, [isSidebarVisible, sidebarWidth]);

  const debouncedSaveData = useMemo(() => debounce(saveData, 1000), [saveData]);

  const handleFlowChange = useCallback(() => {
      debouncedSaveData();
  }, [debouncedSaveData]);

  useEffect(() => {
      const savedDataString = localStorage.getItem('chatflow-data');
      if (savedDataString) {
          try {
              const savedData = JSON.parse(savedDataString);
              if (savedData.flowData) {
                  const deserializedNodes = deserializeNodesFromStorage(savedData.flowData.nodes);
                  setInitialData({
                      fromLocalStorage: true,
                      nodes: deserializedNodes,
                      edges: savedData.flowData.edges,
                      viewport: savedData.flowData.viewport,
                  });
              }
              if (savedData.sidebar) {
                  setIsSidebarVisible(savedData.sidebar.isVisible);
                  setSidebarWidth(savedData.sidebar.width);
              }
          } catch (e) {
              console.error('Failed to load data from local storage', e);
              localStorage.removeItem('chatflow-data');
          }
      }
  }, []);

  const totalHighlightedPath = useMemo(() => ({
    nodes: new Set([...testedPath.nodes, ...sessionPath.nodes]),
    edges: new Set([...testedPath.edges, ...sessionPath.edges])
  }), [testedPath, sessionPath]);

  const handleToggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  const onYamlChange = useCallback((newYaml, newLineMap, newSelectedNodeIds) => {
    setYamlString(newYaml);
    setLineMap(newLineMap);
    setSelectedNodeIds(newSelectedNodeIds);
  }, []);

  const handleExportZip = async () => {
    if (!flowDiagramRef.current) return;

    const { nodes, edges, viewport, yaml: currentYaml } = flowDiagramRef.current.getFlowData();
    if (!currentYaml) return;

    const zip = new JSZip();

    const startNode = nodes.find(n => n.type === 'start');
    let alarmCode = 'flow';
    if (startNode?.data?.alarmCode) {
        alarmCode = startNode.data.alarmCode;
    }

    zip.file(`alarma${alarmCode}.yml`, currentYaml);

    const nodesForLayout = nodes.map(n => {
        const nodeLayoutData = {
            id: n.id,
            type: n.type,
            position: n.position,
            width: n.width,
            height: n.height,
            data: { ...n.data },
        };
        if (nodeLayoutData.data.file instanceof File) {
            nodeLayoutData.data.file = { name: nodeLayoutData.data.file.name };
        }
        return nodeLayoutData;
    });

    const layoutData = {
        nodes: nodesForLayout,
        edges: edges,
        viewport,
    };
    zip.file('graph_layout_metadata.json', JSON.stringify(layoutData, null, 2));

    const extraMetadata = zip.folder('extra_metadata');
    for (const node of nodes) {
        if (node.data?.action === 'Send File' && node.data?.file instanceof File) {
            extraMetadata.file(node.data.file.name, node.data.file);
        }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;

    a.download = `${alarmCode}.zip`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const zip = new JSZip();
    try {
        const content = await zip.loadAsync(file);

        let yamlFile = content.file('flowchart.yml');
        let layoutFile = content.file('graph_layout_metadata.json');

        if (!yamlFile) {
            const alarmFiles = content.file(/alarma.*\.yml/);
            if (alarmFiles.length > 0) {
                yamlFile = alarmFiles[0];
            } else {
                alert('File must contain either "flowchart.yml" or a file named like "alarmaXXXX.yml".');
                return;
            }
        }

        const yamlContent = await yamlFile.async('string');
        const yamlData = yaml.load(yamlContent);

        if (!yamlData || !(yamlData.graph || yamlData.Alarms)) {
            alert('Invalid YAML structure. Expected a "graph" or "Alarms" property.');
            return;
        }

        let layoutData = null;
        if (layoutFile) {
            const layoutContent = await layoutFile.async('string');
            layoutData = JSON.parse(layoutContent);
        }

        const filesData = new Map();
        const extraMetadataFolder = content.folder('extra_metadata');
        if(extraMetadataFolder){
            const filePromises = [];
            extraMetadataFolder.forEach((_relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    const fileName = zipEntry.name.split('/').pop();
                    const promise = zipEntry.async('blob').then(blob => {
                        filesData.set(fileName, new File([blob], fileName, { type: blob.type }));
                    });
                    filePromises.push(promise);
                }
            });
            await Promise.all(filePromises);
        }

        handleCloseChatbot();

        setInitialData({
            yaml: yamlData,
            layout: layoutData,
            files: filesData,
        });

    } catch (err) {
        console.error("Error processing file:", err);
        alert("Failed to process file. It may be corrupt or not a valid archive.");
    } finally {
      e.target.value = ''; // Reset file input
    }
  };

  const handleTestChatbot = () => {
      if (flowDiagramRef.current?.getFlowData()) {
          setSessionPath({ nodes: new Set(), edges: new Set() });
          setIsChatbotOpen(true);
      }
  };

  const handleCloseChatbot = () => {
      setIsChatbotOpen(false);
      setTestedPath({ nodes: new Set(), edges: new Set() });
      setSessionPath({ nodes: new Set(), edges: new Set() });
  };
  
  const handleToggleHelp = () => {
    setIsHelpOpen(prev => !prev);
  };

  const handleOpenFolder = () => {
    window.open('https://innovaitors-my.sharepoint.com/:f:/g/personal/nicolas_lasso_innovaitors_ai/IgAcPeAhjf5URaEoRQNk1gUzAYGDGNVFUv9ArGoj-QlDygc?e=HzEfH1', '_blank');
  };

  const actionButtonStyle = {
    background: 'var(--primary)',
    color: 'var(--primary-foreground)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    borderRadius: 'var(--radius)',
    gap: '8px',
    fontWeight: 500,
    height: '40px',
    fontSize: '14px',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
  };
  


  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div style={{ flexGrow: 1, height: '100%' }}>
        <FlowDiagram
            ref={flowDiagramRef}
            onYamlChange={onYamlChange}
            initialData={initialData}
            testedPath={totalHighlightedPath}
            flowTitle={flowTitle}
            onFlowTitleChange={setFlowTitle}
            onFlowChange={handleFlowChange}
            isSidebarVisible={isSidebarVisible}
        />
      </div>
      <Sidebar
        yaml={yamlString}
        lineMap={lineMap}
        selectedNodeIds={selectedNodeIds}
        isVisible={isSidebarVisible}
        width={sidebarWidth}
        onToggle={handleToggleSidebar}
        onWidthChange={setSidebarWidth}
      />
      <input
          id="chatflow-upload"
          type="file"
          accept=".chatflow,.zip"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
      />
      
      <div style={{
          position: 'fixed',
          bottom: '24px',
          right: isSidebarVisible ? `${sidebarWidth + 24}px` : '24px',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'right 0.3s ease-in-out'
      }}>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--card)', padding: '8px', borderRadius: 'var(--radius)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
              <button
                  title="Test Chatbot"
                  onClick={handleTestChatbot}
                  style={{...actionButtonStyle, background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)'}}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span>Test</span>
              </button>
              <button
                  title="Ayuda"
                  onClick={handleToggleHelp}
                  style={{...actionButtonStyle, background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)'}}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>Help</span>
              </button>
              <button
                  title="Archivos"
                  onClick={handleOpenFolder}
                  style={{...actionButtonStyle, background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)'}}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  <span>Files</span>
              </button>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>

          <div style={{ display: 'flex', gap: '8px', background: 'var(--card)', padding: '8px', borderRadius: 'var(--radius)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
              <button
                  title="Upload Flow (.chatflow)"
                  onClick={() => document.getElementById('chatflow-upload').click()}
                  style={actionButtonStyle}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  <span>Upload</span>
              </button>
              <button
                  title="Export ZIP for Production"
                  onClick={handleExportZip}
                  style={actionButtonStyle}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <span>Export</span>
              </button>
          </div>
      </div>

      {!isSidebarVisible && (
        <button
          onClick={handleToggleSidebar}
          title="Show Sidebar"
          style={{
            position: 'fixed',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1001,
            background: 'var(--secondary)',
            border: '1px solid var(--border)',
            borderRight: 'none',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            padding: '12px 6px',
            cursor: 'pointer',
            borderTopLeftRadius: 'var(--radius)',
            borderBottomLeftRadius: 'var(--radius)',
            color: 'var(--muted-foreground)',
            boxShadow: '-2px 0 5px rgba(0,0,0,0.1)'
          }}
        >
          YAML
        </button>
      )}
      {isChatbotOpen && (
          <Chatbot
              onClose={handleCloseChatbot}
              flowData={flowDiagramRef.current?.getFlowData()}
              onPathUpdate={setSessionPath}
          />
      )}
      {isHelpOpen && <HelpTutorial onClose={handleToggleHelp} />}
    </div>
  );
}

export default App;
