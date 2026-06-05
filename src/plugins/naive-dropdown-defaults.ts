import { type App, type Component, computed, defineComponent, h } from "vue"
import { NSelect as NaiveSelect, NTreeSelect as NaiveTreeSelect } from "naive-ui"
import type { HTMLAttributes } from "vue"
import {
  mergeNaiveDropdownMenuProps,
  NAIVE_DROPDOWN_TO
} from "@/config/naive-dropdown-defaults"

function createDropdownWrapper(name: string, Inner: Component) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const mergedProps = computed(() => {
        const raw = attrs as Record<string, unknown>
        const userMenuProps = (raw.menuProps ?? raw["menu-props"]) as HTMLAttributes | undefined
        const { menuProps: _menuProps, "menu-props": _menuPropsKebab, to, ...rest } = raw
        return {
          ...rest,
          to: to ?? NAIVE_DROPDOWN_TO,
          menuProps: mergeNaiveDropdownMenuProps(userMenuProps)
        }
      })
      return () => h(Inner, mergedProps.value, slots)
    }
  })
}

/** 覆盖 Naive 全局 NSelect / NTreeSelect，统一下拉挂载与菜单高度 */
export function applyNaiveDropdownDefaults(app: App) {
  app.component("NSelect", createDropdownWrapper("NSelect", NaiveSelect))
  app.component("NTreeSelect", createDropdownWrapper("NTreeSelect", NaiveTreeSelect))
}
