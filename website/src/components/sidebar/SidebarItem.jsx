import PropTypes from "prop-types"

export default function SidebarItem({ icon, text, isActive = false }) {
    return (
        <div 
            className={`flex items-center gap-3 rounded-md py-2 px-2 cursor-pointer transition-colors ${
                isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-white/7.5 text-white'
            }`}
        >
            <img src={icon} className="h-6" alt="" />
            <p className="text-lg font-medium">{text}</p>
        </div>
    );
}

SidebarItem.propTypes = {
    icon: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    isActive: PropTypes.bool
}