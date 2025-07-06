import { useState } from "react";
import chatIcon from "../assets/chat.png"
import documentIcon from "../assets/docs.png"
import settingsIcon from "../assets/settings.png"
import SidebarItem from "./SidebarItem";
import Dropzone from "./Dropzone";

function Sidebar() {
    const handleChange = file => {
        print(file)
    }

    return <>
        <div className="w-1/7 h-screen py-6 px-5 bg-lightgrey flex flex-col justify-between">
            <div className="flex flex-col gap-3">
                <SidebarItem icon={chatIcon} text={"New chat"} />
                <SidebarItem icon={documentIcon} text={"Documents"} />
                <SidebarItem icon={settingsIcon} text={"Settings"} />
            </div>

            <div className="flex items-center justify-center p-2">
                <Dropzone />
            </div>
        </div>
    </>
}

export default Sidebar