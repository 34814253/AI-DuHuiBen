/** PostCSS：375 设计稿 → vw（与 STEP2 规格一致） */
export default {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 375,
      unitPrecision: 5,
      propList: ['*'],
      minPixelValue: 1,
    },
  },
}
