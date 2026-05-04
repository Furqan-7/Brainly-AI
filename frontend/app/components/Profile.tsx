import { useState, useRef, useEffect } from "react";
import { Bookmark, Video, X } from "lucide-react";

export default function Profile({
    isProfileOpen,
    setIsProfileOpen,
}: {
    isProfileOpen: boolean;
    setIsProfileOpen: any;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    // close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    return (
        <div className="relative" ref={ref}>

            {/* 3-dot button */}
            <button
                onClick={() => setIsProfileOpen(true)}
                className="p-2 rounded-full hover:bg-gray-200"
            >
                ⋮
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-50">
                    <ul className="py-2 text-sm">
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            Rename
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500">
                            Delete
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            Share
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}