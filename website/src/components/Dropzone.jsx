import React, { useState, useCallback } from 'react';
import newDocIcon from "../assets/new-document.png"

export default function Dropzone() {
    const [files, setFiles] = useState([]);

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);
        const validFiles = droppedFiles.filter(file =>
        ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
        );
        setFiles(prev => [...prev, ...validFiles]);
    }, []);

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        const validFiles = selectedFiles.filter(file =>
            ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
        );
        setFiles(prev => [...prev, ...validFiles]);
    };

  const preventDefault = (e) => e.preventDefault();

  return (
    <div
      onDrop={handleDrop}
      onDragOver={preventDefault}
      onDragEnter={preventDefault}
      onClick={() => document.getElementById('fileInput').click()}
      className="border-2 border-dashed border-white/60 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 text-white cursor-pointer transition hover:border-gray-300 w-80 h-80"
    >
      <input
        id="fileInput"
        type="file"
        accept=".pdf,.docx"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <img src={newDocIcon} alt="" className='w-15'/>
      <p>Add new documents</p>
      <p className="text-xs text-gray-400">File types accepted: DOCX, PDF</p>

      {files.length > 0 && (
        <div className="mt-4 text-left w-full max-w-sm mx-auto">
          <p className="text-sm font-medium underline mb-2">Uploaded Files:</p>
          <ul className="text-sm list-disc list-inside text-gray-300">
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
