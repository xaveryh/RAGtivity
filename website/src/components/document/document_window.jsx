import React, { useState, useEffect } from 'react';
import DocumentListItem from '../document/document_list_item';
import Add_document from '../main/Add_document';
import PropTypes from "prop-types"

export default function DocumentWindow({ documents = [], onRemoveDocument, onAddDocuments }) {
    const [includedDocuments, setIncludedDocuments] = useState(
        documents.map(() => true) 
    );
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setIncludedDocuments(prev => {
            const newIncluded = [...prev];
            while (newIncluded.length < documents.length) {
                newIncluded.push(true);
            }
            if (newIncluded.length > documents.length) {
                newIncluded.splice(documents.length);
            }
            return newIncluded;
        });
    }, [documents.length]);

    const handleToggleIncluded = (index) => {
        setIncludedDocuments(prev => 
            prev.map((included, i) => i === index ? !included : included)
        );
    };

    // Filter documents based on search term
    const filteredDocuments = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const clearSearch = () => {
        setSearchTerm('');
    };

    return (
        <div className="w-full h-screen bg-121212 p-8 overflow-auto">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Document Management</h1>
                        <p className="text-white/60">Manage the knowledge base</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search documents by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 pl-10 pr-10 bg-lightgrey border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        {/* Search Icon */}
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        {/* Clear Button */}
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                                title="Clear search"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-lightgrey rounded-lg p-4">
                        <h3 className="text-white/80 text-sm font-medium">Total Documents</h3>
                        <p className="text-white text-2xl font-bold">{documents.length}</p>
                    </div>
                    <div className="bg-lightgrey rounded-lg p-4">
                        <h3 className="text-white/80 text-sm font-medium">Included in System</h3>
                        <p className="text-green-400 text-2xl font-bold">{includedDocuments.filter(Boolean).length}</p>
                    </div>
                    <div className="bg-lightgrey rounded-lg p-4">
                        <h3 className="text-white/80 text-sm font-medium">Excluded</h3>
                        <p className="text-red-400 text-2xl font-bold">{includedDocuments.filter(inc => !inc).length}</p>
                    </div>
                </div>

                {/* Document Table */}
                <div className="bg-lightgrey rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/20 bg-white/5">
                        <div className="col-span-4 text-white font-semibold">Document Name</div>
                        <div className="col-span-2 text-white font-semibold text-center">Chunks</div>
                        <div className="col-span-4 text-white font-semibold text-center">Included in System</div>
                        <div className="col-span-2 text-white font-semibold text-center">Action</div>
                    </div>

                    {/* Document List */}
                    <div className="divide-y divide-white/10">
                        {filteredDocuments.length === 0 ? (
                            <div className="text-center py-12">
                                {documents.length === 0 ? (
                                    <>
                                        <div className="text-6xl mb-4">📁</div>
                                        <h3 className="text-white text-xl font-medium mb-2">No documents uploaded yet</h3>
                                        <p className="text-white/60 mb-4">Upload documents using the button above or drag & drop files here</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-white text-xl font-medium mb-2">No documents found</h3>
                                    </>
                                )}
                            </div>
                        ) : (
                            filteredDocuments.map((doc, originalIndex) => {
                                // Find the original index in the unfiltered array
                                const docIndex = documents.findIndex(d => d.id === doc.id);
                                return (
                                    <DocumentListItem
                                        key={doc.id || originalIndex}
                                        doc={doc}
                                        index={docIndex}
                                        isIncluded={includedDocuments[docIndex] || false}
                                        onToggleIncluded={handleToggleIncluded}
                                        onRemove={onRemoveDocument}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex justify-between items-center">
                    <div className="text-white/60">
                        Showing {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <Add_document onAddDocuments={onAddDocuments} />
                        </div>
                        {documents.length > 0 && (
                            <>
                                <button 
                                    onClick={() => setIncludedDocuments(documents.map(() => true))}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Include All
                                </button>
                                <button 
                                    onClick={() => setIncludedDocuments(documents.map(() => false))}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Exclude All
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

DocumentWindow.propTypes = {
    documents: PropTypes.array,
    onRemoveDocument: PropTypes.func.isRequired,
    onAddDocuments: PropTypes.func.isRequired
}