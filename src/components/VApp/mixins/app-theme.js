export default {
  data: () => ({
    style: null
  }),

  watch: {
    '$vuetify.theme': {
      deep: true,
      handler () {
        this.applyTheme()
      }
    }
  },

  created () {
    if (typeof document === 'undefined') {
      return this.$ssrContext && this.$ssrContext._styles &&
        (this.$ssrContext._styles['vuetify-theme-stylesheet'] = {
          ids: ['vuetify-theme-stylesheet'],
          css: this.genColors(this.$vuetify.theme),
          media: ''
        })
    }
    this.genStyle()
    this.applyTheme()
  },

  methods: {
    applyTheme () {
      this.style.innerHTML = this.genColors(this.$vuetify.theme)
    },
    genColors (theme) {
      return Object.keys(theme).map(key => {
        const value = theme[key]

        return (
          this.genBackgroundColor(key, value) +
          this.genTextColor(key, value)
        )
      }).join('')
    },
    genBackgroundColor (key, value) {
      return `.${key}{background-color:${value} !important;border-color:${value} !important;}`
    },
    genTextColor (key, value) {
      return `.${key}--text{color:${value} !important;}`
    },
    genStyle () {
      let style = document.querySelector('[data-vue-ssr-id=vuetify-theme-stylesheet]')

      if (!style) {
        style = document.createElement('style')
        style.type = 'text/css'
        document.head.appendChild(style)
      }

      this.style = style
    }
  }
}
