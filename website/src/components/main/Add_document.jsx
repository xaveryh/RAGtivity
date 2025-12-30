import React, { useCallback } from 'react';
import newDocIcon from "../../assets/new-document.png"
import PropTypes from "prop-types"

export default function Add_document({ onAddDocuments }) {
    const handleDrop = useCallback((event) => {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);
        const validFiles = droppedFiles.filter(file =>
            ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
        );
        if (validFiles.length > 0 && onAddDocuments) {
            onAddDocuments(validFiles);
        }
    }, [onAddDocuments]);

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        const validFiles = selectedFiles.filter(file =>
            ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
        );
        if (validFiles.length > 0 && onAddDocuments) {
            onAddDocuments(validFiles);
        }
        // Clear input
        event.target.value = '';
    };

    const preventDefault = (e) => e.preventDefault();

    return (
        <div
            onDrop={handleDrop}
            onDragOver={preventDefault}
            onDragEnter={preventDefault}
            onClick={() => document.getElementById('fileInput').click()}
            className="flex items-center justify-center cursor-pointer transition hover:scale-110 p-2"
            title="Add documents"
        >
            <input
                id="fileInput"
                type="file"
                accept=".pdf,.docx,.txt"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />
            <img 
                src={newDocIcon} 
                alt="Add documents" 
                className="w-6 h-6 opacity-80 hover:opacity-100 transition-opacity"
            />
        </div>
    );
}

Add_document.propTypes = {
    onAddDocuments: PropTypes.func.isRequired
}