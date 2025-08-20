export default function HeroSpline() {
  return (
    <section className="relative w-full min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] overflow-hidden">
      {/* Overlay copy: above robot, left-aligned, doesn't block pointer events */}
      <div className="pointer-events-none absolute left-0 top-0 z-20 px-4 sm:px-6 md:px-12 lg:px-16 xl:px-24 py-6 sm:py-12 md:py-20 lg:py-32 xl:py-40 max-w-[95%] sm:max-w-[80%] md:max-w-[60%] lg:max-w-[45rem]">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 leading-tight"
          style={{ color: "#48aab1" }}
        >
          Meet Your AI Learning Companion
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-xl leading-relaxed">
          Unlock interactive, visual and personalized education with Edvanta's
          3D AI robot. Experience the future of learning—engaging, smart and
          always by your side.
        </p>
      </div>

      {/* Robot container (behind text) */}
      <div className="relative z-10 w-full flex justify-center sm:justify-end">
        <div className="w-[180vw] sm:w-[150vw] max-w-none h-[280px] sm:h-[320px] md:h-[450px] lg:h-[550px] xl:h-[600px] -mr-0 sm:-mr-[20vw] md:-mr-[30vw] lg:-mr-[35vw]">
          <iframe
            src="https://my.spline.design/nexbotrobotcharacterconcept-pEKDoPk1s0o4YIz9NCio81XB/"
            className="w-full h-full border-0 bg-transparent"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            loading="lazy"
            title="3D Hero"
            style={{ minHeight: 280 }}
          />
        </div>
      </div>
    </section>
  );
}
