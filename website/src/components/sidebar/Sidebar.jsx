import chatIcon from "../../assets/chat.png"
import documentIcon from "../../assets/docs.png"
import settingsIcon from "../../assets/settings.png"
import SidebarItem from "../sidebar/SidebarItem";
import { NavLink, useLocation } from "react-router";
import PropTypes from "prop-types"

export default function Sidebar({ documents = [] }) {
    return (
        
        <div className="w-1/7 h-screen py-6 px-5 bg-lightgrey flex flex-col justify-between">
            <div className="flex flex-col gap-3">
                <NavLink to="/">
                    <SidebarItem 
                        icon={chatIcon} 
                        text={"New chat"} 
                        isActive={useLocation().pathname === '/'}
                    />
                </NavLink>
                
                <NavLink to="/documents">
                    <div className="relative">
                        <SidebarItem
                            icon={documentIcon}
                            text={"Documents"}
                            isActive={useLocation().pathname === '/documents'}
                        />
                        {documents.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {documents.length}
                            </span>
                        )}
                    </div>
                </NavLink>

                <NavLink to="/settings">
                    <SidebarItem
                        icon={settingsIcon}
                        text={"Settings"}
                        isActive={useLocation().pathname === '/settings'}
                    />
                </NavLink>
            </div>
        </div>
    );
}

Sidebar.propTypes = {
    documents: PropTypes.array
}