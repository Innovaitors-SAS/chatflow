import { useState } from 'react';

const AlarmItem = ({ alarmId, alarm }) => {
    const [isOpen, setIsOpen] = useState(false);

    const statusDotColor = {
        online: 'var(--tested)',
        pending: 'var(--destructive)',
    }[alarm.status] || 'var(--muted-foreground)';

    return (
        <div className="alarm-item">
            <div className="alarm-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="status-dot" style={{ backgroundColor: statusDotColor }} title={`Status: ${alarm.status}`} />
                <div className="alarm-id">{alarmId}</div>
                <div className="alarm-name">{alarm.name}</div>
                <div className={`alarm-type ${alarm.alarm_type}`}>{alarm.alarm_type}</div>
                <div className={`alarm-status ${alarm.status}`}>{alarm.status}</div>
            </div>
            {isOpen && (
                <div className="alarm-details">
                    <h4>File Name</h4>
                    <p><code>{alarm.file_name}</code></p>
                    {alarm.extra_metadata && alarm.extra_metadata.length > 0 && (
                        <>
                            <h4>Extra Metadata</h4>
                            <ul>
                                {alarm.extra_metadata.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const Dashboard = ({ alarmsData, onClose }) => {
    const [filterType, setFilterType] = useState('all');

    if (!alarmsData || !alarmsData.Alarms) {
        return (
             <div className="dashboard-overlay" onClick={onClose}>
                <div className="dashboard-content" onClick={e => e.stopPropagation()}>
                    <header className="dashboard-header">
                        <h2>Alarms Dashboard</h2>
                        <button onClick={onClose}>&times;</button>
                    </header>
                    <div className="dashboard-body">
                        <p>Loading alarms data or no alarms found...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const sortedAlarms = Object.entries(alarmsData.Alarms).sort(([idA], [idB]) => idA.localeCompare(idB));

    const filteredAlarms = sortedAlarms.filter(([, alarm]) => {
        if (filterType === 'all') return true;
        return alarm.alarm_type === filterType;
    });

    return (
        <div className="dashboard-overlay" onClick={onClose}>
            <div className="dashboard-content" onClick={e => e.stopPropagation()}>
                <header className="dashboard-header">
                    <h2>Alarms Dashboard</h2>
                    <button onClick={onClose}>&times;</button>
                </header>
                <div className="dashboard-filters">
                    <button className={filterType === 'all' ? 'active' : ''} onClick={() => setFilterType('all')}>All</button>
                    <button className={filterType === 'critical' ? 'active' : ''} onClick={() => setFilterType('critical')}>Critical</button>
                    <button className={filterType === 'warning' ? 'active' : ''} onClick={() => setFilterType('warning')}>Warning</button>
                </div>
                <div className="dashboard-body">
                    {filteredAlarms.map(([id, alarm]) => (
                        <AlarmItem key={id} alarmId={id} alarm={alarm} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
