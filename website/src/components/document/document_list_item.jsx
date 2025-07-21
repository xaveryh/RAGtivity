import React from 'react';

export default function DocumentListItem({ 
    doc, 
    index, 
    isIncluded, 
    onToggleIncluded, 
    onRemove 
}) {
    const chunkCount = 0
    return (
        <div className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition-colors">
            {/* Document Name Column */}
            <div className="col-span-4 flex items-center min-w-0">
                <div className="min-w-0 flex-1">
                    <h3 className="text-white font-medium truncate" title={doc.name}>
                        {doc.name}
                    </h3>
                </div>
            </div>

            {/* Number of Chunks Column */}
            <div className="col-span-2 flex justify-center items-center">
                <span className="text-white/80 font-medium">
                    {chunkCount}
                </span>
            </div>

            {/* Included in System Column */}
            <div className="col-span-4 flex justify-center items-center">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => onToggleIncluded(index)}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className={`ml-3 font-medium ${
                        isIncluded ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {isIncluded ? 'Included' : 'Excluded'}
                    </span>
                </label>
            </div>

            {/* Delete Button Column */}
            <div className="col-span-2 flex justify-center items-center">
                <button
                    onClick={() => onRemove(index)}
                    className="text-red-400 hover:text-red-300 bg-red-400/20 hover:bg-red-400/30 rounded-lg px-3 py-2 transition-all font-medium"
                    title="Remove document"
                >
                    Remove
                </button>
            </div>
        </div>
    );
}