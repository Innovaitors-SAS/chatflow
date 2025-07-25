import { useRef, useState, useCallback } from 'react';
import yaml from 'js-yaml';
import JSZip from 'jszip';
import './App.css';
import FlowDiagram from './components/FlowDiagram';
import Sidebar from './components/Sidebar';

function App() {
  const [yamlString, setYamlString] = useState('');
  const [lineMap, setLineMap] = useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [initialData, setInitialData] = useState(null);
  const flowDiagramRef = useRef(null);

  const handleToggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  const onYamlChange = useCallback((newYaml, newLineMap, newSelectedNodeIds) => {
    setYamlString(newYaml);
    setLineMap(newLineMap);
    setSelectedNodeIds(newSelectedNodeIds);
  }, []);

  const handleDownloadZip = async () => {
    if (!flowDiagramRef.current) return;

    const { nodes, edges, viewport, yaml: currentYaml } = flowDiagramRef.current.getFlowData();
    if (!currentYaml) return;

    const zip = new JSZip();

    // 1. Add flowchart.yml
    zip.file('flowchart.yml', currentYaml);

    // 2. Add graph_layout_metadata.json
    const layoutData = {
        nodes: nodes.map(n => ({
            id: n.id,
            position: n.position,
            width: n.width,
            height: n.height,
        })),
        edges: edges,
        viewport,
    };
    zip.file('graph_layout_metadata.json', JSON.stringify(layoutData, null, 2));

    // 3. Add files from nodes to extra_metadata/
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
    
    const match = currentYaml.match(/id: "graph_alarm_(\w+)"/);
    const alarmCode = match ? match[1] : 'flow';
    a.download = `${alarmCode}_flow.zip`;
    
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
        
        const yamlFile = content.file('flowchart.yml');
        const layoutFile = content.file('graph_layout_metadata.json');
        
        if (!yamlFile) {
            alert('ZIP archive must contain a "flowchart.yml" file.');
            return;
        }

        const yamlContent = await yamlFile.async('string');
        const yamlData = yaml.load(yamlContent);

        if (!yamlData || !yamlData.graph) {
            alert('Invalid YAML structure. Expected a "graph" property.');
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

        setInitialData({
            yaml: yamlData,
            layout: layoutData,
            files: filesData,
        });

    } catch (err) {
        console.error("Error processing ZIP file:", err);
        alert("Failed to process ZIP file. It may be corrupt or not a valid ZIP archive.");
    } finally {
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div style={{ flexGrow: 1, height: '100%' }}>
        <FlowDiagram ref={flowDiagramRef} onYamlChange={onYamlChange} initialData={initialData} />
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
          id="zip-upload"
          type="file"
          accept=".zip"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
      />
       <button
        title="Upload Flow (ZIP)"
        onClick={() => document.getElementById('zip-upload').click()}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: isSidebarVisible ? `${sidebarWidth + 24 + 56 + 12}px` : `${24 + 56 + 12}px`,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          transition: 'right 0.3s ease-in-out'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
      </button>

      <button
        title="Download Flow (ZIP)"
        onClick={handleDownloadZip}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: isSidebarVisible ? `${sidebarWidth + 24}px` : '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          transition: 'right 0.3s ease-in-out'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
      </button>

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
    </div>
  );
}

export default App;
