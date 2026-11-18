import { ImagePlus, UploadCloud, Sparkles } from "lucide-react";
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
            <div className="px-4 pt-6">
                <div className="mb-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-indigo-200">
                            <ImagePlus size={18} className="text-white" />
                        </div>

                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-800">
                                Uploads
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400">
                                Your personal media
                            </p>
                        </div>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-slate-500">
                        Bring your ideas to life with your own images and creative assets.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/70 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-200/30 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                    <div className="relative flex flex-col items-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md shadow-indigo-100 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                            <UploadCloud
                                size={27}
                                strokeWidth={1.8}
                                className="text-indigo-600"
                            />
                        </div>

                        <h4 className="text-sm font-bold text-slate-800">
                            Upload your images
                        </h4>

                        <p className="mt-1.5 text-xs leading-5 text-slate-500">
                            Drag your creativity in or browse your device
                        </p>

                        <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:shadow-indigo-200">
                            <ImagePlus size={14} />
                            Choose files
                        </span>

                        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                            {["PNG", "JPG", "WEBP", "SVG"].map((format) => (
                                <span
                                    key={format}
                                    className="rounded-md border border-white/80 bg-white/70 px-2 py-1 text-[9px] font-bold tracking-wide text-slate-500"
                                >
                                    {format}
                                </span>
                            ))}
                        </div>
                    </div>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />

                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                    <div className="flex items-start gap-2">
                        <Sparkles
                            size={16}
                            className="mt-0.5 shrink-0 text-indigo-500"
                        />
                        <div>
                            <p className="text-xs font-semibold text-indigo-900">
                                Make it yours
                            </p>
                            <p className="mt-1 text-[11px] leading-4 text-indigo-700/80">
                                Upload personal photos and make your designs unique.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

}