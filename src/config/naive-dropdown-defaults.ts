import type { HTMLAttributes } from "vue"

/** 下拉菜单挂载到 body，避免弹窗/滚动容器裁剪 */
export const NAIVE_DROPDOWN_TO = "body" as const

export const NAIVE_DROPDOWN_MENU_MAX_HEIGHT = "280px"

export const NAIVE_DROPDOWN_MENU_PROPS: HTMLAttributes = {
  style: { maxHeight: NAIVE_DROPDOWN_MENU_MAX_HEIGHT }
}

export function mergeNaiveDropdownMenuProps(user?: HTMLAttributes): HTMLAttributes {
  if (!user) return { ...NAIVE_DROPDOWN_MENU_PROPS }
  return {
    ...user,
    style: {
      ...(NAIVE_DROPDOWN_MENU_PROPS.style as Record<string, string>),
      ...(user.style as Record<string, string> | undefined)
    }
  }
}
