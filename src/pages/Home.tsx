import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="bg-white">

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Hero Content */}
            <div>

              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-sm mb-6">

                <span className="w-2 h-2 bg-green-500 rounded-full" />

                Create certificates visually

              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-950 leading-[1.05]">

                Design certificates
                <span className="block text-indigo-600">
                  your way.
                </span>

              </h1>

              <p className="mt-6 text-lg md:text-xl text-gray-600 leading-8 max-w-xl">

                Choose a beautiful certificate template,
                customize every element, and create a
                professional certificate without complicated
                design tools.

              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-9">

                <Link
                  to="/editor"
                  className="group inline-flex items-center justify-center gap-3 bg-gray-950 text-white px-7 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 hover:-translate-y-1 transition-all shadow-lg"
                >
                  Start Designing

                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>

                </Link>

                <Link
                  to="/templates"
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-800 px-7 py-4 rounded-xl font-semibold text-lg hover:border-gray-500 hover:bg-gray-50 transition"
                >
                  Explore Templates
                </Link>

              </div>

              <div className="flex flex-wrap gap-6 mt-8 text-sm text-gray-500">

                <span>✓ Easy to customize</span>
                <span>✓ Drag & edit</span>
                <span>✓ Professional templates</span>

              </div>

            </div>

            {/* Hero Preview */}
            <div className="relative">

              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200 rounded-full blur-3xl opacity-60" />

              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-200 rounded-full blur-3xl opacity-60" />

              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 p-4 rotate-1 hover:rotate-0 transition-transform duration-500">

                <div className="bg-gray-100 rounded-2xl p-6">

                  <div className="bg-white aspect-[1.414/1] rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">

                    <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-600" />

                    <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center text-2xl mb-5">
                      🏆
                    </div>

                    <p className="text-xs tracking-[0.3em] text-gray-500 uppercase">
                      Certificate
                    </p>

                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">
                      Certificate of
                    </h2>

                    <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                      Excellence
                    </h3>

                    <div className="w-24 h-px bg-gray-300 my-5" />

                    <p className="text-gray-500 text-sm">
                      Presented to
                    </p>

                    <p className="text-xl font-bold text-gray-900 mt-2">
                      Your Name
                    </p>

                    <p className="text-xs text-gray-400 mt-5">
                      For outstanding achievement
                    </p>

                    <div className="flex justify-between w-full mt-8 text-xs text-gray-400">
                      <span>Signature</span>
                      <span>2026</span>
                    </div>

                  </div>

                </div>

              </div>

              {/* Floating Badge */}
              <div className="absolute -left-5 top-16 bg-white rounded-xl shadow-xl border border-gray-200 px-4 py-3 hidden md:flex items-center gap-3 animate-pulse">

                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  ✓
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Design ready
                  </p>

                  <p className="font-semibold text-gray-900 text-sm">
                    Fully customizable
                  </p>
                </div>

              </div>

              <div className="absolute -right-5 bottom-10 bg-gray-950 text-white rounded-xl shadow-xl px-4 py-3 hidden md:block">

                <p className="text-xs text-gray-400">
                  Your canvas
                </p>

                <p className="font-semibold">
                  Edit anything ✨
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= STATS ================= */}

      <section className="border-y border-gray-100 bg-white">

        <div className="max-w-7xl mx-auto px-6 py-10">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

            <div>
              <p className="text-3xl font-bold text-gray-950">
                100+
              </p>
              <p className="text-gray-500 mt-1">
                Design possibilities
              </p>
            </div>

            <div>
              <p className="text-3xl font-bold text-gray-950">
                20+
              </p>
              <p className="text-gray-500 mt-1">
                Template styles
              </p>
            </div>

            <div>
              <p className="text-3xl font-bold text-gray-950">
                100%
              </p>
              <p className="text-gray-500 mt-1">
                Customizable
              </p>
            </div>

            <div>
              <p className="text-3xl font-bold text-gray-950">
                1
              </p>
              <p className="text-gray-500 mt-1">
                Simple editor
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* ================= FEATURES ================= */}

      <section
        id="features"
        className="max-w-7xl mx-auto px-6 py-24"
      >

        <div className="text-center max-w-2xl mx-auto">

          <p className="text-indigo-600 font-semibold uppercase tracking-wider text-sm">
            Powerful editor
          </p>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-950 mt-3">
            Everything you need to design
          </h2>

          <p className="text-gray-500 text-lg mt-5 leading-8">
            Build your certificate exactly the way you
            imagine it using simple visual controls.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">

          {/* Feature 1 */}
          <div className="group border border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">

            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              📝
            </div>

            <h3 className="text-xl font-bold mt-6">
              Text Editor
            </h3>

            <p className="text-gray-500 mt-3 leading-7">
              Add headings, subheadings and custom text.
              Change font size, color and styling.
            </p>

          </div>

          {/* Feature 2 */}
          <div className="group border border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">

            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              🔷
            </div>

            <h3 className="text-xl font-bold mt-6">
              Shapes
            </h3>

            <p className="text-gray-500 mt-3 leading-7">
              Add rectangles, circles, triangles and other
              visual elements to your certificate.
            </p>

          </div>

          {/* Feature 3 */}
          <div className="group border border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">

            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              🎨
            </div>

            <h3 className="text-xl font-bold mt-6">
              Full Customization
            </h3>

            <p className="text-gray-500 mt-3 leading-7">
              Customize colors, sizes, positions and
              styles to make your certificate unique.
            </p>

          </div>

          {/* Feature 4 */}
          <div className="group border border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">

            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              📋
            </div>

            <h3 className="text-xl font-bold mt-6">
              Ready Templates
            </h3>

            <p className="text-gray-500 mt-3 leading-7">
              Start quickly with professionally designed
              certificate templates.
            </p>

          </div>

          {/* Feature 5 */}
          <div className="group border border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">

            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              💾
            </div>

            <h3 className="text-xl font-bold mt-6">
              Save Your Designs
            </h3>

            <p className="text-gray-500 mt-3 leading-7">
              Save your certificate designs and continue
              editing them whenever you want.
            </p>

          </div>

          {/* Feature 6 */}
          <div className="group border border-gray-200 rounded-2xl p-7 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">

            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
              ⚡
            </div>

            <h3 className="text-xl font-bold mt-6">
              Simple Workflow
            </h3>

            <p className="text-gray-500 mt-3 leading-7">
              Choose a template, customize it, save your
              design and create your certificate.
            </p>

          </div>

        </div>

      </section>


      {/* ================= HOW IT WORKS ================= */}

      <section
        id="how-it-works"
        className="bg-gray-50 border-y border-gray-100"
      >

        <div className="max-w-7xl mx-auto px-6 py-24">

          <div className="text-center">

            <p className="text-indigo-600 font-semibold uppercase tracking-wider text-sm">
              Simple process
            </p>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-950 mt-3">
              Create in three simple steps
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">

            <div className="text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-950 text-white flex items-center justify-center text-2xl font-bold">
                1
              </div>

              <h3 className="text-xl font-bold mt-6">
                Choose a template
              </h3>

              <p className="text-gray-500 mt-3 leading-7">
                Select a certificate template that matches
                your purpose and style.
              </p>

            </div>

            <div className="text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                2
              </div>

              <h3 className="text-xl font-bold mt-6">
                Customize it
              </h3>

              <p className="text-gray-500 mt-3 leading-7">
                Edit text, colors, shapes, font sizes and
                other elements using the editor.
              </p>

            </div>

            <div className="text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl font-bold">
                3
              </div>

              <h3 className="text-xl font-bold mt-6">
                Save your design
              </h3>

              <p className="text-gray-500 mt-3 leading-7">
                Save your finished certificate and continue
                editing it whenever you need.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================= CTA ================= */}

      <section
        id="templates"
        className="max-w-7xl mx-auto px-6 py-24"
      >

        <div className="relative overflow-hidden rounded-3xl bg-gray-950 px-8 py-16 md:px-16 text-center">

          <div className="absolute -top-20 -left-20 w-60 h-60 bg-indigo-500 rounded-full blur-3xl opacity-30" />

          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500 rounded-full blur-3xl opacity-30" />

          <div className="relative">

            <p className="text-indigo-300 font-semibold">
              Ready to create?
            </p>

            <h2 className="text-4xl md:text-5xl font-bold text-white mt-3">
              Turn your idea into a certificate.
            </h2>

            <p className="text-gray-400 max-w-2xl mx-auto mt-5 text-lg">
              Start with a blank canvas or choose a template
              and make it completely yours.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">

              <Link
                to="/editor"
                className="bg-white text-gray-950 px-7 py-4 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Start from Scratch
              </Link>

              <Link
                to="/templates"
                className="border border-gray-700 text-white px-7 py-4 rounded-xl font-bold hover:bg-gray-800 transition"
              >
                Browse Templates
              </Link>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}