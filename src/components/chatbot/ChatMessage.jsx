import React from 'react';

const ChatMessage = ({ message, onOptionSelect }) => {
    const isBot = message.sender === 'bot';

    const messageClass = isBot ? 'message-bot' : 'message-user';
    const containerClass = isBot ? 'message-container-bot' : 'message-container-user';

    const formatText = (text) => {
        // Simple markdown-like formatting
        const formattedText = text
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
        return { __html: formattedText };
    };

    return (
        <div className={`message-container ${containerClass}`}>
            <div className={`message-bubble ${messageClass}`}>
                <div dangerouslySetInnerHTML={formatText(message.text)} />
                {message.options && message.options.length > 0 && (
                    <div className="message-options">
                        {message.options.map((option, index) => (
                            <button key={index} onClick={() => onOptionSelect(option)}>
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
