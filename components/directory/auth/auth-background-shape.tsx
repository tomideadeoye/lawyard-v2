export default function AuthBackgroundShape() {
  return (
    <svg
      width="800"
      height="800"
      viewBox="0 0 800 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-[0.03] dark:opacity-[0.07] pointer-events-none select-none animate-pulse-slow"
    >
      <circle cx="400" cy="400" r="400" fill="url(#paint0_radial_auth)" />
      <defs>
        <radialGradient
          id="paint0_radial_auth"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(400 400) rotate(90) scale(400)"
        >
          <stop stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}
