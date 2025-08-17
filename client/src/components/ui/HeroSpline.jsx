export default function HeroSpline() {
  return (
    <section className="relative w-full min-h-[70vh] md:min-h-[80vh] overflow-hidden">
      {/* Overlay copy: above robot, left-aligned, doesn't block pointer events */}
      <div className="pointer-events-none absolute left-0 top-0 z-20 px-6 md:px-16 lg:px-24 py-8 md:py-40 max-w-[45rem]">
        <h1
          className="text-3xl md:text-5xl font-bold mb-4 leading-tight"
          style={{ color: "#48aab1" }}
        >
          Meet Your AI Learning Companion
        </h1>
        <p className="text-md md:text-xl text-gray-700 max-w-xl">
          Unlock interactive, visual and personalized education with Edvanta's
          3D AI robot. Experience the future of learning—engaging, smart and
          always by your side.
        </p>
      </div>

      {/* Robot container (behind text) */}
      <div className="relative z-10 w-full flex justify-end">
        <div className="w-[150vw] max-w-none h-[320px] md:h-[500px] lg:h-[600px] -mr-[35vw]">
          <iframe
            src="https://my.spline.design/nexbotrobotcharacterconcept-pEKDoPk1s0o4YIz9NCio81XB/"
            className="w-full h-full border-0 bg-transparent"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            loading="lazy"
            title="3D Hero"
            style={{ minHeight: 320 }}
          />
        </div>
      </div>
    </section>
  );
}
