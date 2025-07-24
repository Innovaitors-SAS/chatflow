import { useState } from 'react';
import yaml from 'js-yaml';
import './App.css';
import FlowDiagram from './components/FlowDiagram';
import Sidebar from './components/Sidebar';

function App() {
  const [yamlString, setYamlString] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [initialData, setInitialData] = useState(null);

  const handleToggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  const handleDownloadYaml = () => {
    if (!yamlString) return;

    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const match = yamlString.match(/id: "graph_alarm_(\w+)"/);
    const alarmCode = match ? match[1] : 'flow';
    a.download = `${alarmCode}.yaml`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const yamlContent = event.target.result;
            const data = yaml.load(yamlContent);
            if (data && data.graph) {
                setInitialData(data);
            } else {
                alert('Invalid YAML structure. Expected a "graph" property.');
            }
        } catch (err) {
            console.error("Error parsing YAML:", err);
            alert("Failed to parse YAML file. Please check its format.");
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div style={{ flexGrow: 1, height: '100%' }}>
        <FlowDiagram onYamlChange={setYamlString} initialData={initialData} />
      </div>
      <Sidebar
        yaml={yamlString}
        isVisible={isSidebarVisible}
        width={sidebarWidth}
        onToggle={handleToggleSidebar}
        onWidthChange={setSidebarWidth}
      />
      <input
          id="yaml-upload"
          type="file"
          accept=".yml,.yaml"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
      />
       <button
        title="Upload YAML"
        onClick={() => document.getElementById('yaml-upload').click()}
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
        title="Download YAML"
        onClick={handleDownloadYaml}
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
