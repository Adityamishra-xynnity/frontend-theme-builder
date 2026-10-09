import { ImagePlus } from "lucide-react";
import { useRef } from "react";

import { useFabric } from "../../context/FabricContext";

export default function UploadsPanel() {
    const { addImage } = useFabric();

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    function handleImageUpload(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === "string") {
                addImage(reader.result);
            }
        };

        reader.readAsDataURL(file);

        event.target.value = "";
    }

    return (
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 h-full overflow-y-auto">
            {/* MEDIA */}
            <div className="px-4 pt-6">

                <p className="px-1 mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Media
                </p>

                <button
                    type="button"
                    onClick={() =>
                        fileInputRef.current?.click()
                    }
                    className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition flex flex-col items-center justify-center gap-2"
                >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <ImagePlus
                            size={20}
                            className="text-gray-700"
                        />
                    </div>

                    <div className="text-center">

                        <p className="text-sm font-semibold text-gray-800">
                            Upload Image
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">
                            PNG, JPG, WEBP
                        </p>

                    </div>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={
                        handleImageUpload
                    }
                    className="hidden"
                />

            </div>

        </aside>
    );
}