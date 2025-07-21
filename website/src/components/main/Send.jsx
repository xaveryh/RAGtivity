import React from 'react';
import sendIcon from "../../assets/send.png"

export default function Send({ onSend }) {
    const handleSend = () => {
        const query = document.getElementById('query').value;
        if (query.trim()) {
            if (onSend) {
                onSend(query);
            } else {
                console.log('Sending query:', query);
            }
            // Clear input after sending
            document.getElementById('query').value = '';
        }
    };

    return (
        <div 
            onClick={handleSend}
            className="flex items-center justify-center cursor-pointer transition hover:scale-110 p-2"
            title="Send message"
        >
            <img 
                src={sendIcon} 
                alt="Send message" 
                className="w-6 h-6 opacity-80 hover:opacity-100 transition-opacity"
            />
        </div>
    );
}