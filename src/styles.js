const styles = {
  paddingX: "sm:px-16 px-6",
  paddingY: "sm:py-16 py-6",
  padding: "sm:px-16 px-6 sm:py-16 py-10",

  heroHeadText:
    "font-black text-white lg:text-[80px] sm:text-[60px] xs:text-[50px] text-[40px] lg:leading-[98px] mt-2",
  heroSubText:
    "text-[#dfd9ff] font-medium lg:text-[30px] sm:text-[26px] xs:text-[20px] text-[16px] lg:leading-[40px]",

  sectionHeadText:
    "text-white font-black md:text-[60px] sm:text-[50px] xs:text-[40px] text-[30px]",
  sectionSubText:
    "sm:text-[18px] text-[14px] text-secondary uppercase tracking-wider",

  // Theme colors & visual elements
  bgMain: "bg-[#0d0d1e]",
  bgCard: "bg-[#1a1a2e]",
  borderCard: "border border-[#2a2a40]",
  accentColor: "#915EFF",

  // Reusable Component Styles
  card: "bg-[#1a1a2e] border border-[#2a2a40] rounded-2xl shadow-lg p-6 transition-all duration-300",
  input: "w-full p-3 bg-[#2e2e4d] rounded-xl text-white border border-[#3e3e5f] focus:outline-none focus:ring-2 focus:ring-[#915EFF] transition duration-200",
  
  btnPrimary: "bg-[#915EFF] hover:bg-[#a27eff] active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold transition duration-200 cursor-pointer text-center border-none",
  btnSecondary: "bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-semibold transition duration-200 cursor-pointer text-center border-none",
  btnDanger: "bg-red-700 hover:bg-red-800 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold transition duration-200 cursor-pointer text-center border-none",

  // Unified Typography
  h1: "text-white font-black md:text-[36px] text-[28px] leading-tight",
  h2: "text-white font-bold md:text-[26px] text-[20px] leading-snug",
  h3: "text-white font-semibold md:text-[20px] text-[18px]",
  body: "text-sm text-gray-300 leading-relaxed",
  subtext: "text-xs text-gray-400"
};

export { styles };
