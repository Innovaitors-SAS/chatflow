import { useState } from 'react';
import FlowDiagram from './components/FlowDiagram';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [yaml, setYaml] = useState('');

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ flexGrow: 1, height: '100%' }}>
        <FlowDiagram onYamlChange={setYaml} />
      </div>
      <Sidebar yaml={yaml} />
    </div>
  );
}

export default App;
