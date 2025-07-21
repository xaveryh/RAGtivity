import { useState } from "react";
import chatIcon from "../../assets/chat.png"
import documentIcon from "../../assets/docs.png"
import settingsIcon from "../../assets/settings.png"
import SidebarItem from "../sidebar/SidebarItem";

function Sidebar({ documents = [], onNavigate, currentView }) {
    const handleNewChat = () => {
        onNavigate('main');
    }

    const handleDocuments = () => {
        onNavigate('documents');
    }

    const handleSettings = () => {
        onNavigate('settings');
    }

    return (
        <div className="w-1/7 h-screen py-6 px-5 bg-lightgrey flex flex-col justify-between">
            <div className="flex flex-col gap-3">
                <SidebarItem 
                    icon={chatIcon} 
                    text={"New chat"} 
                    onClick={handleNewChat}
                    isActive={currentView === 'main'}
                />
                
                <div className="relative">
                    <SidebarItem 
                        icon={documentIcon} 
                        text={"Documents"} 
                        onClick={handleDocuments}
                        isActive={currentView === 'documents'}
                    />
                    {documents.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {documents.length}
                        </span>
                    )}
                </div>

                <SidebarItem 
                    icon={settingsIcon} 
                    text={"Settings"} 
                    onClick={handleSettings}
                    isActive={currentView === 'settings'}
                />
            </div>
        </div>
    );
}

export default Sidebar