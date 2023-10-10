/* themeConfigProp */
export interface ThemeConfigProps {
  layout: string
  primary: string
  isDark: boolean
  isGrey: boolean
  isCollapse: boolean
  isWeak: boolean
  breadcrumb: boolean
  breadcrumbIcon: boolean
  tabs: boolean
  tabsIcon: boolean
  footer: boolean
  maximize: boolean
}
interface userInfo {
  user_id: number | null
  user_phone: number | null
  user_name: string
  real_name: string
  avatar: string
  roles: string[]
}
/* GlobalState */
export interface GlobalState {
  ffmpeg: any
  fetchFile: any
  token: string
  userInfo: userInfo
  assemblySize: string
  language: string
  themeConfig: ThemeConfigProps
}

/* tabsMenuProps */
export interface TabsMenuProps {
  icon: string
  title: string
  path: string
  close: boolean
}

/* TabsState */
export interface TabsState {
  tabsMenuList: TabsMenuProps[]
}

/* AuthState */
export interface AuthState {
  authMenuList: Menu.MenuOptions[]
  routeName: string
}
