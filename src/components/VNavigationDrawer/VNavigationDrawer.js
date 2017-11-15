require('../../stylus/components/_navigation-drawer.styl')

import Applicationable from '../../mixins/applicationable'
import Overlayable from '../../mixins/overlayable'
import Themeable from '../../mixins/themeable'

import ClickOutside from '../../directives/click-outside'
import Resize from '../../directives/resize'
import Touch from '../../directives/touch'

export default {
  name: 'v-navigation-drawer',

  mixins: [Applicationable, Overlayable, Themeable],

  directives: {
    ClickOutside,
    Resize,
    Touch
  },

  data () {
    return {
      isActive: false,
      isBooted: false,
      isMobile: null,
      touchArea: {
        left: 0,
        right: 0
      }
    }
  },

  props: {
    absolute: Boolean,
    clipped: Boolean,
    disableRouteWatcher: Boolean,
    disableResizeWatcher: Boolean,
    height: String,
    fixed: Boolean,
    floating: Boolean,
    miniVariant: Boolean,
    miniVariantWidth: {
      type: [Number, String],
      default: 80
    },
    mobileBreakPoint: {
      type: [Number, String],
      default: 1264
    },
    permanent: Boolean,
    right: Boolean,
    stateless: Boolean,
    temporary: Boolean,
    touchless: Boolean,
    width: {
      type: [Number, String],
      default: 300
    },
    value: { required: false }
  },

  computed: {
    calculatedHeight () {
      return this.height || '100%'
    },
    calculatedWidth () {
      return this.miniVariant
        ? this.miniVariantWidth
        : this.width
    },
    classes () {
      return {
        'navigation-drawer': true,
        'navigation-drawer--absolute': this.absolute,
        'navigation-drawer--clipped': this.clipped,
        'navigation-drawer--close': !this.isBooted || !this.isActive,
        'navigation-drawer--fixed': this.fixed,
        'navigation-drawer--floating': this.floating,
        'navigation-drawer--is-booted': this.isBooted,
        'navigation-drawer--is-mobile': this.isMobile,
        'navigation-drawer--mini-variant': this.miniVariant,
        'navigation-drawer--open': this.isActive && this.isBooted,
        'navigation-drawer--right': this.right,
        'navigation-drawer--temporary': this.temporary,
        'theme--dark': this.dark,
        'theme--light': this.light
      }
    },
    marginTop () {
      if (!this.app) return 0
      let marginTop = this.$vuetify.application.bar

      marginTop += this.clipped
        ? this.$vuetify.application.top
        : 0

      return marginTop
    },
    maxHeight () {
      if (!this.app) return '100%'

      return this.clipped
        ? this.$vuetify.application.top + this.$vuetify.application.bottom
        : this.$vuetify.application.bottom
    },
    reactsToClick () {
      return !this.stateless &&
        !this.permanent &&
        (this.isMobile || this.temporary)
    },
    reactsToMobile () {
      return !this.disableResizeWatcher &&
        !this.stateless &&
        !this.permanent &&
        this.isBooted &&
        !this.temporary
    },
    reactsToRoute () {
      return !this.disableRouteWatcher &&
        !this.stateless &&
        !this.permanent
    },
    resizeIsDisabled () {
      return this.disableResizeWatcher || this.stateless
    },
    showOverlay () {
      return this.isActive &&
        (this.temporary || this.isMobile)
    },
    styles () {
      return {
        height: this.calculatedHeight,
        marginTop: `${this.marginTop}px`,
        maxHeight: `calc(100% - ${this.maxHeight}px)`,
        width: `${this.calculatedWidth}px`
      }
    }
  },

  watch: {
    $route () {
      if (this.reactsToRoute) {
        this.isActive = !this.closeConditional()
      }
    },
    isActive (val) {
      this.$emit('input', val)

      if (this.temporary || this.isMobile) {
        this.tryOverlay()
        this.$el.scrollTop = 0
      }
    },
    /**
     * When mobile changes, adjust
     * the active state only when
     * there has been a previous
     * value
     */
    isMobile (val, prev) {
      !val &&
        this.isActive &&
        !this.temporary &&
        this.removeOverlay()

      if (prev == null ||
        this.resizeIsDisabled
      ) return

      this.isActive = !val
    },
    permanent (val) {
      // If enabling prop
      // enable the drawer
      if (val) this.isActive = true
    },
    right (val, prev) {
      // When the value changes
      // reset previous direction
      if (prev != null) {
        const dir = val ? 'left' : 'right'
        this.$vuetify.application[dir] = 0
      }

      this.updateApplication()
    },
    temporary (val) {
      if (!val) return

      this.tryOverlay()
    },
    value (val) {
      if (this.permanent) return

      if (val !== this.isActive) this.isActive = val
    }
  },

  mounted () {
    this.checkIfMobile()

    if (this.permanent) {
      this.isActive = true
    } else if (this.stateless ||
      this.value != null
    ) {
      this.isActive = this.value
    } else if (!this.temporary) {
      this.isActive = !this.isMobile
    }

    setTimeout(() => (this.isBooted = true), 0)
  },

  destroyed () {
    if (this.app) {
      this.$vuetify.application[this.right ? 'right' : 'left'] = 0
    }
  },

  methods: {
    calculateTouchArea () {
      if (!this.$el.parentNode) return
      const parentRect = this.$el.parentNode.getBoundingClientRect()

      this.touchArea = {
        left: parentRect.left + 50,
        right: parentRect.right - 50
      }
    },
    checkIfMobile () {
      if (this.permanent ||
        this.temporary
      ) return

      this.isMobile = window.innerWidth < parseInt(this.mobileBreakPoint, 10)
    },
    closeConditional () {
      return this.reactsToClick
    },
    genDirectives () {
      const directives = [
        { name: 'click-outside', value: this.closeConditional },
        {
          name: 'resize',
          value: {
            debounce: 200,
            quiet: true,
            value: this.onResize
          }
        }
      ]

      !this.touchless && directives.push({
        name: 'touch',
        value: {
          parent: true,
          left: this.swipeLeft,
          right: this.swipeRight
        }
      })

      return directives
    },
    onResize () {
      this.checkIfMobile()
    },
    swipeRight (e) {
      if (this.isActive && !this.right) return
      this.calculateTouchArea()

      if (Math.abs(e.touchendX - e.touchstartX) < 100) return
      else if (!this.right &&
        e.touchstartX <= this.touchArea.left
      ) this.isActive = true
      else if (this.right && this.isActive) this.isActive = false
    },
    swipeLeft (e) {
      if (this.isActive && this.right) return
      this.calculateTouchArea()

      if (Math.abs(e.touchendX - e.touchstartX) < 100) return
      else if (this.right &&
        e.touchstartX >= this.touchArea.right
      ) this.isActive = true
      else if (!this.right && this.isActive) this.isActive = false
    },
    tryOverlay () {
      if (!this.permanent &&
        this.showOverlay &&
        this.isActive
      ) {
        return this.genOverlay()
      }

      this.removeOverlay()
    },
    updateApplication () {
      if (!this.app) return

      const width = !this.isActive ||
        this.temporary ||
        this.isMobile
        ? 0
        : this.calculatedWidth

      if (this.right) {
        this.$vuetify.application.right = width
      } else {
        this.$vuetify.application.left = width
      }
    }
  },

  render (h) {
    this.updateApplication()

    const data = {
      'class': this.classes,
      style: this.styles,
      directives: this.genDirectives(),
      on: {
        click: () => this.$emit('update:miniVariant', false)
      }
    }

    return h('aside', data, [
      this.$slots.default,
      h('div', { 'class': 'navigation-drawer__border' })
    ])
  }
}
