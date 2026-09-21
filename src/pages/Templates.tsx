import { Link } from "react-router-dom";
import { templates } from "../data/templates";

export default function Templates() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">

        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
          Certificate Collection
        </p>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3">
          Choose Your Perfect Template
        </h1>

        <p className="text-gray-500 mt-4 text-lg leading-7">
          Select a professionally designed certificate and
          customize every detail using our visual editor.
        </p>

      </div>

      {/* Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {templates.map((template) => {

          const heading =
            template.elements.find(
              (element) =>
                element.type === "heading"
            );

          const mainColor =
            heading?.type === "heading"
              ? heading.color
              : "#374151";

          return (
            <div
              key={template.id}
              className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300"
            >

              {/* Preview Background */}
              <div className="bg-gray-100 p-6 md:p-8">

                {/* Certificate */}
                <div
                  className="relative w-full aspect-[900/650] overflow-hidden rounded-lg shadow-xl"
                  style={{
                    backgroundColor:
                      template.backgroundColor,
                  }}
                >

                  {/* Certificate Border */}
                  <div
                    className="absolute inset-[3%] border-2 pointer-events-none"
                    style={{
                      borderColor: mainColor,
                    }}
                  />

                  <div
                    className="absolute inset-[5%] border pointer-events-none"
                    style={{
                      borderColor: `${mainColor}55`,
                    }}
                  />

                  {/* Actual Template Elements */}
                  {template.elements.map(
                    (element) => {

                      const left =
                        (element.x / 900) * 100;

                      const top =
                        (element.y / 650) * 100;

                      const width =
                        (element.width / 900) * 100;

                      const height =
                        (element.height / 650) * 100;

                      const baseStyle = {
                        position:
                          "absolute" as const,

                        left: `${left}%`,
                        top: `${top}%`,

                        width: `${width}%`,
                        height: `${height}%`,
                      };

                      {/* Rectangle */}
                      if (
                        element.type ===
                        "rectangle"
                      ) {
                        return (
                          <div
                            key={element.id}
                            style={{
                              ...baseStyle,

                              backgroundColor:
                                element.backgroundColor,
                            }}
                          />
                        );
                      }

                      {/* Circle */}
                      if (
                        element.type ===
                        "circle"
                      ) {
                        return (
                          <div
                            key={element.id}
                            style={{
                              ...baseStyle,

                              backgroundColor:
                                element.backgroundColor,

                              borderRadius:
                                "50%",
                            }}
                          />
                        );
                      }

                      {/* Triangle */}
                      if (
                        element.type ===
                        "triangle"
                      ) {
                        return (
                          <div
                            key={element.id}
                            style={{
                              ...baseStyle,
                            }}
                          >
                            <div
                              style={{
                                width: 0,
                                height: 0,

                                borderLeft:
                                  `${element.width / 2}px solid transparent`,

                                borderRight:
                                  `${element.width / 2}px solid transparent`,

                                borderBottom:
                                  `${element.height}px solid ${element.backgroundColor}`,

                                transform:
                                  "scale(0.45)",

                                transformOrigin:
                                  "top left",
                              }}
                            />
                          </div>
                        );
                      }

                      {/* Text */}
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...baseStyle,

                            fontSize: `${Math.max(
                              8,
                             (  (element.fontSize ?? 18 )/
                                900) *
                                900 *
                                0.55
                            )}px`,

                            fontFamily:
                              element.fontFamily,

                            color:
                              element.color,

                            fontWeight:
                              element.fontWeight,

                            display: "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            textAlign:
                              "center",

                            lineHeight:
                              "1.2",

                            padding: "2px",

                            overflow:
                              "hidden",
                          }}
                        >
                          {element.text}
                        </div>
                      );
                    }
                  )}

                  {/* Hover */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">

                    <Link
                      to={`/editor/${template.id}`}
                      className="bg-white text-gray-900 px-7 py-3 rounded-lg font-bold shadow-xl hover:bg-gray-100 transition transform group-hover:scale-105"
                    >
                      Use This Template →
                    </Link>

                  </div>

                </div>
              </div>

              {/* Information */}
              <div className="p-6">

                <div className="flex items-start justify-between gap-5">

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {template.name}
                    </h2>

                    <p className="text-gray-500 text-sm mt-2 leading-6">
                      {template.description}
                    </p>
                  </div>

                  <div
                    className="w-8 h-8 rounded-full border-4 border-white shadow-md shrink-0"
                    style={{
                      backgroundColor:
                        mainColor,
                    }}
                  />

                </div>

                <Link
                  to={`/editor/${template.id}`}
                  className="mt-6 w-full inline-flex items-center justify-center bg-black text-white px-5 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  Customize Template
                </Link>

              </div>
            </div>
          );
        })}

      </div>

      {/* Bottom CTA */}
      <div className="mt-14 bg-gray-950 rounded-2xl px-8 py-10 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">

        <div className="text-center md:text-left">

          <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
            Create Something Unique
          </p>

          <h2 className="text-2xl md:text-3xl font-bold text-white mt-2">
            Want to create your own design?
          </h2>

          <p className="text-gray-400 mt-2">
            Start with a completely blank certificate.
          </p>

        </div>

        <Link
          to="/editor"
          className="bg-white text-gray-950 px-7 py-3 rounded-lg font-bold hover:bg-gray-200 transition whitespace-nowrap"
        >
          Start From Scratch →
        </Link>

      </div>

    </div>
  );
}