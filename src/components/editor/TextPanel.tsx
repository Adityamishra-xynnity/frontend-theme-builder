import {
    Type,
    Heading,
    AlignLeft,
} from "lucide-react";

import { useFabric } from "../../context/FabricContext";


export default function TextPanel() {
    const {
        addText,
    } = useFabric();

    return (
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 h-full overflow-y-auto">
            {/* TEXT */}
            <div className="px-4 pt-5">

                <p className="px-1 mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Text
                </p>

                <div className="space-y-2">

                    <button
                        type="button"
                        onClick={() =>
                            addText("heading")
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Heading
                                size={20}
                                className="text-gray-800"
                            />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Heading
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5">
                                Large title
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            addText(
                                "subheading"
                            )
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <AlignLeft
                                size={19}
                                className="text-gray-800"
                            />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Subheading
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5">
                                Supporting text
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            addText("text")
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Type
                                size={19}
                                className="text-gray-800"
                            />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Body Text
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5">
                                Normal text
                            </p>
                        </div>
                    </button>

                </div>
            </div>
        </aside>
    );
}